import { isChargedCrawler } from './classify.js';
import { DEFAULT_CHARGED_PURPOSES, type CrawlerPurpose } from './crawlers.js';

/** A CAIP-2 network id, e.g. `eip155:8453`. */
export type NetworkId = `${string}:${string}`;

/** Address format, and which x402 scheme package handles the network. */
export type ChainFamily = 'evm' | 'solana';

export interface NetworkInfo {
  readonly id: NetworkId;
  readonly family: ChainFamily;
  readonly testnet: boolean;
}

/**
 * Networks where x402 knows the USDC contract, by friendly name. One EVM
 * address receives on every EVM network; Solana needs its own address.
 */
export const NETWORKS = {
  base: { id: 'eip155:8453', family: 'evm', testnet: false },
  ethereum: { id: 'eip155:1', family: 'evm', testnet: false },
  polygon: { id: 'eip155:137', family: 'evm', testnet: false },
  arbitrum: { id: 'eip155:42161', family: 'evm', testnet: false },
  avalanche: { id: 'eip155:43114', family: 'evm', testnet: false },
  solana: { id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', family: 'solana', testnet: false },
  'base-sepolia': { id: 'eip155:84532', family: 'evm', testnet: true },
  'arbitrum-sepolia': { id: 'eip155:421614', family: 'evm', testnet: true },
  'solana-devnet': {
    id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    family: 'solana',
    testnet: true,
  },
} as const satisfies Record<string, NetworkInfo>;

export type NetworkName = keyof typeof NETWORKS;

/** The public testnet facilitator. x402 says never to use it for mainnet. */
export const TESTNET_FACILITATOR_URL = 'https://x402.org/facilitator';

const ADDRESS: Record<ChainFamily, { pattern: RegExp; label: string }> = {
  evm: { pattern: /^0x[0-9a-fA-F]{40}$/, label: 'an EVM address (0x + 40 hex)' },
  solana: { pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, label: 'a Solana address (base58)' },
};
const USD_PRICE = /^\$\d+(\.\d+)?$/;

export interface BlockOptions {
  readonly mode: 'block';
  /** Plain-text body of the 402. */
  readonly message?: string;
}

/** One network you accept USDC on, and your public address there. */
export interface PaymentTarget {
  readonly network: NetworkName;
  /** Public receiving address. Never a private key or recovery phrase. */
  readonly payTo: string;
}

export interface X402Options {
  readonly mode: 'x402';
  /** Price per request in USD, paid in USDC, e.g. `"$0.005"`. */
  readonly price: string;
  /**
   * Where you accept payment. The crawler pays on one of them — offering
   * several raises the odds it holds USDC on one. All testnet or all mainnet.
   */
  readonly accepts: readonly PaymentTarget[];
  /** Required on mainnet; defaults to the public testnet facilitator on testnets. */
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

export interface ResolvedTarget {
  readonly network: NetworkId;
  readonly family: ChainFamily;
  readonly payTo: string;
}

export interface ResolvedX402 {
  readonly price: string;
  readonly targets: readonly ResolvedTarget[];
  readonly facilitatorUrl: string;
  readonly description: string;
}

function resolveTarget(target: PaymentTarget): NetworkInfo & { payTo: string } {
  // Checked at runtime too: plain-JS callers can pass any string.
  if (!Object.hasOwn(NETWORKS, target.network)) {
    throw new Error(
      `unknown network "${target.network}" — one of ${Object.keys(NETWORKS).join(', ')}`,
    );
  }
  const info: NetworkInfo = NETWORKS[target.network];
  const address = ADDRESS[info.family];
  if (!address.pattern.test(target.payTo)) {
    throw new Error(`payTo for ${target.network} must be ${address.label}, got "${target.payTo}"`);
  }
  return { ...info, payTo: target.payTo };
}

/**
 * Validates x402 options up front, so a typo fails at startup rather than as a
 * 500 on the first crawler request.
 */
export function resolveX402(options: X402Options): ResolvedX402 {
  if (!USD_PRICE.test(options.price)) {
    throw new Error(`price must be a USD amount like "$0.005", got "${options.price}"`);
  }
  if (options.accepts.length === 0) throw new Error('accepts needs at least one network');
  const targets = options.accepts.map(resolveTarget);
  if (new Set(targets.map((t) => t.id)).size !== targets.length) {
    throw new Error('accepts lists a network twice');
  }
  const testnet = targets.every((t) => t.testnet);
  if (!testnet && targets.some((t) => t.testnet)) {
    throw new Error('accepts mixes testnet and mainnet networks — use one or the other');
  }
  const facilitatorUrl = options.facilitatorUrl ?? (testnet ? TESTNET_FACILITATOR_URL : undefined);
  if (!facilitatorUrl) {
    throw new Error(
      'facilitatorUrl is required on mainnet — the public facilitator is testnet-only',
    );
  }
  if (!testnet && facilitatorUrl === TESTNET_FACILITATOR_URL) {
    throw new Error(`${TESTNET_FACILITATOR_URL} is testnet-only; set a mainnet facilitatorUrl`);
  }
  return {
    price: options.price,
    targets: targets.map(({ id, family, payTo }) => ({ network: id, family, payTo })),
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
