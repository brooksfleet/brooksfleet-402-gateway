import type { NextFunction, Request, RequestHandler, Response } from 'express';

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

/**
 * Express middleware — also NestJS, via `app.use(...)` in `main.ts`. Requests
 * from charged crawlers get a 402 — plain, or an x402 payment request;
 * everything else passes untouched and never loads x402.
 *
 * ```ts
 * import { createGatewayMiddleware } from 'brooksfleet-402-gateway/express';
 * app.use(createGatewayMiddleware({ mode: 'block' }));
 * ```
 */
export function createGatewayMiddleware(options: GatewayOptions): RequestHandler {
  const charged = createChargeTest(options);

  if (options.mode === 'block') {
    const message = options.message ?? DEFAULT_BLOCK_MESSAGE;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!charged(req.path, req.get('user-agent'))) {
        next();
        return;
      }
      res.status(402).set(BLOCK_HEADERS).send(message);
    };
  }

  const x402 = resolveX402(options);
  const paid = lazy(async (): Promise<RequestHandler> => {
    const [{ paymentMiddleware }, { server, route }] = await Promise.all([
      import('@x402/express'),
      createX402(x402),
    ]);
    return paymentMiddleware(route, server);
  });
  return (req: Request, res: Response, next: NextFunction) => {
    if (!charged(req.path, req.get('user-agent'))) {
      next();
      return;
    }
    paid().then(
      (handler) => {
        void handler(req, res, next);
      },
      (error: unknown) => {
        next(error);
      },
    );
  };
}
