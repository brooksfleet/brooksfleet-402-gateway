import { isChargedCrawler } from './classify.js';
import { DEFAULT_CHARGED_PURPOSES, type CrawlerPurpose } from './crawlers.js';

/** Networks by friendly name, as CAIP-2 ids. */
export const NETWORKS = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
} as const;

export type NetworkName = keyof typeof NETWORKS;

/** A CAIP-2 network id, e.g. `eip155:8453`. */
export type NetworkId = `${string}:${string}`;

/** The public testnet facilitator. x402 says never to use it for mainnet. */
export const TESTNET_FACILITATOR_URL = 'https://x402.org/facilitator';

const TESTNETS: ReadonlySet<string> = new Set([NETWORKS['base-sepolia']]);
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const USD_PRICE = /^\$\d+(\.\d+)?$/;

export interface BlockOptions {
  readonly mode: 'block';
  /** Plain-text body of the 402. */
  readonly message?: string;
}

export interface X402Options {
  readonly mode: 'x402';
  /** Public receiving address (EVM). Never a private key. */
  readonly payTo: string;
  /** Price per request in USD, paid in USDC, e.g. `"$0.005"`. */
  readonly price: string;
  /** Default `base-sepolia` (testnet), so nothing is charged by accident. */
  readonly network?: NetworkName;
  /** Required on mainnet; defaults to the public testnet facilitator otherwise. */
  readonly facilitatorUrl?: string;
  /** Shown to the paying client in the payment requirements. */
  readonly description?: string;
}

export type GatewayOptions = (BlockOptions | X402Options) & {
  /** Which crawler purposes are charged. Default: training only. */
  readonly purposes?: readonly CrawlerPurpose[];
  /**
   * Paths served to everyone, charged crawlers included. Default
   * `['/robots.txt']` — the file that tells a crawler the terms must stay readable.
   */
  readonly exemptPaths?: readonly string[];
};

export const DEFAULT_EXEMPT_PATHS: readonly string[] = ['/robots.txt'];

export const DEFAULT_BLOCK_MESSAGE =
  'Payment required. Automated collection of this site for AI training is not licensed free of charge.\n';

export interface ResolvedX402 {
  readonly payTo: string;
  readonly price: string;
  readonly network: NetworkId;
  readonly facilitatorUrl: string;
  readonly description: string;
}

/**
 * Validates x402 options up front, so a typo fails at startup rather than as a
 * 500 on the first crawler request.
 */
export function resolveX402(options: X402Options): ResolvedX402 {
  if (!EVM_ADDRESS.test(options.payTo)) {
    throw new Error(`payTo must be a public EVM address (0x + 40 hex), got "${options.payTo}"`);
  }
  if (!USD_PRICE.test(options.price)) {
    throw new Error(`price must be a USD amount like "$0.005", got "${options.price}"`);
  }
  // Checked at runtime too: plain-JS callers can pass any string.
  const name = options.network ?? 'base-sepolia';
  if (!Object.hasOwn(NETWORKS, name)) throw new Error(`unknown network "${name}"`);
  const network: NetworkId = NETWORKS[name];
  const facilitatorUrl =
    options.facilitatorUrl ?? (TESTNETS.has(network) ? TESTNET_FACILITATOR_URL : undefined);
  if (!facilitatorUrl) {
    throw new Error(
      'facilitatorUrl is required on mainnet — the public facilitator is testnet-only',
    );
  }
  if (!TESTNETS.has(network) && facilitatorUrl === TESTNET_FACILITATOR_URL) {
    throw new Error(`${TESTNET_FACILITATOR_URL} is testnet-only; set a mainnet facilitatorUrl`);
  }
  return {
    payTo: options.payTo,
    price: options.price,
    network,
    facilitatorUrl,
    description: options.description ?? 'Licence to collect this page for AI training',
  };
}

/** The decision every adapter makes first: is this request charged at all? */
export function createChargeTest(
  options: GatewayOptions,
): (path: string, userAgent: string | null | undefined) => boolean {
  const purposes = options.purposes ?? DEFAULT_CHARGED_PURPOSES;
  const exempt = new Set(options.exemptPaths ?? DEFAULT_EXEMPT_PATHS);
  return (path, userAgent) => !exempt.has(path) && isChargedCrawler(userAgent, purposes);
}

/**
 * Memoises an async factory, forgetting a failure so the next request retries
 * instead of failing forever (a facilitator outage at startup, say).
 */
export function lazy<T>(factory: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= factory().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

export const BLOCK_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'no-store',
};
