import type { RouteConfig, x402ResourceServer } from '@x402/core/server';

import type { ResolvedX402 } from './config.js';

/**
 * The x402 server and the single route config that covers every path. Loaded
 * lazily so the x402 packages stay optional peers: block mode never imports
 * them, and `@x402/svm` loads only when a Solana network is accepted.
 */
export async function createX402(
  x402: ResolvedX402,
): Promise<{ server: x402ResourceServer; route: RouteConfig }> {
  const { x402ResourceServer, HTTPFacilitatorClient } = await import('@x402/core/server');
  const server = new x402ResourceServer(new HTTPFacilitatorClient({ url: x402.facilitatorUrl }));

  const families = new Set(x402.targets.map((t) => t.family));
  const evm = families.has('evm')
    ? new (await import('@x402/evm/exact/server')).ExactEvmScheme()
    : undefined;
  const svm = families.has('solana')
    ? new (await import('@x402/svm/exact/server')).ExactSvmScheme()
    : undefined;
  for (const target of x402.targets) {
    const scheme = target.family === 'evm' ? evm : svm;
    if (scheme) server.register(target.network, scheme);
  }

  const route: RouteConfig = {
    accepts: x402.targets.map((target) => ({
      scheme: 'exact',
      payTo: target.payTo,
      price: x402.price,
      network: target.network,
    })),
    description: x402.description,
    mimeType: 'text/html',
  };
  return { server, route };
}
