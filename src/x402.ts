import type { RouteConfig, x402ResourceServer } from '@x402/core/server';

import type { ResolvedX402 } from './config.js';

/**
 * The x402 server and the single route config that covers every path. Loaded
 * lazily so the x402 packages stay optional peers: block mode never imports them.
 */
export async function createX402(
  x402: ResolvedX402,
): Promise<{ server: x402ResourceServer; route: RouteConfig }> {
  const [{ x402ResourceServer, HTTPFacilitatorClient }, { ExactEvmScheme }] = await Promise.all([
    import('@x402/core/server'),
    import('@x402/evm/exact/server'),
  ]);
  const server = new x402ResourceServer(
    new HTTPFacilitatorClient({ url: x402.facilitatorUrl }),
  ).register(x402.network, new ExactEvmScheme());
  const route: RouteConfig = {
    accepts: {
      scheme: 'exact',
      payTo: x402.payTo,
      price: x402.price,
      network: x402.network,
    },
    description: x402.description,
    mimeType: 'text/html',
  };
  return { server, route };
}
