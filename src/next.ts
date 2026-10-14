import { NextResponse, type NextRequest } from 'next/server.js';

import {
  BLOCK_HEADERS,
  DEFAULT_BLOCK_MESSAGE,
  createChargeTest,
  lazy,
  resolveX402,
  type GatewayOptions,
} from './config.js';
import { createX402 } from './x402.js';

export type { GatewayOptions } from './config.js';

type Proxy = (request: NextRequest) => Promise<NextResponse>;

/**
 * A Next.js `proxy.ts` handler. Requests from charged crawlers get a 402 —
 * plain, or an x402 payment request; everything else passes untouched and
 * never loads x402.
 *
 * ```ts
 * // proxy.ts
 * import { createGatewayProxy } from 'brooksfleet-402-gateway/next';
 * export const proxy = createGatewayProxy({ mode: 'block' });
 * ```
 */
export function createGatewayProxy(options: GatewayOptions): Proxy {
  const charged = createChargeTest(options);

  if (options.mode === 'block') {
    const message = options.message ?? DEFAULT_BLOCK_MESSAGE;
    return (request) =>
      Promise.resolve(
        charged(request.nextUrl.pathname, request.headers.get('user-agent'))
          ? new NextResponse(message, { status: 402, headers: BLOCK_HEADERS })
          : NextResponse.next(),
      );
  }

  const x402 = resolveX402(options);
  const paid = lazy(async (): Promise<Proxy> => {
    const [{ paymentProxy }, { server, route }] = await Promise.all([
      import('@x402/next'),
      createX402(x402),
    ]);
    return paymentProxy(route, server);
  });
  return async (request) =>
    charged(request.nextUrl.pathname, request.headers.get('user-agent'))
      ? (await paid())(request)
      : NextResponse.next();
}
