import { NextRequest } from 'next/server.js';
import { describe, expect, it } from 'vitest';

import { createGatewayProxy } from '../src/next.js';
import { PAY_TO, UA } from './agents.js';

const request = (path: string, userAgent: string) =>
  new NextRequest(`https://example.com${path}`, { headers: { 'user-agent': userAgent } });

/** NextResponse.next() marks a pass-through with this header. */
const passes = (res: Response) => res.headers.get('x-middleware-next') === '1';

describe('createGatewayProxy — block', () => {
  const proxy = createGatewayProxy({ mode: 'block' });

  it('answers a training crawler with 402', async () => {
    const res = await proxy(request('/en', UA.gptbot));
    expect(res.status).toBe(402);
    expect(await res.text()).toMatch(/Payment required/);
  });

  it.each([UA.googlebot, UA.oaiSearch, UA.claudeUser, UA.browser])('passes %s', async (ua) => {
    expect(passes(await proxy(request('/en', ua)))).toBe(true);
  });

  it('keeps robots.txt readable for charged crawlers', async () => {
    expect(passes(await proxy(request('/robots.txt', UA.gptbot)))).toBe(true);
  });

  it('uses a custom message', async () => {
    const custom = createGatewayProxy({ mode: 'block', message: 'licence@example.com\n' });
    expect(await (await custom(request('/', UA.ccbot))).text()).toBe('licence@example.com\n');
  });
});

describe('createGatewayProxy — x402', () => {
  it('validates options at creation, not on the first request', () => {
    expect(() => createGatewayProxy({ mode: 'x402', payTo: 'nope', price: '$0.01' })).toThrow();
  });

  it('never loads x402 for traffic that passes', async () => {
    // An unreachable facilitator would fail any request that touched x402.
    const proxy = createGatewayProxy({
      mode: 'x402',
      payTo: PAY_TO,
      price: '$0.005',
      facilitatorUrl: 'http://127.0.0.1:9',
    });
    expect(passes(await proxy(request('/', UA.browser)))).toBe(true);
  });
});

// Talks to the public testnet facilitator: X402_LIVE=1 npm test
describe.skipIf(!process.env.X402_LIVE)('createGatewayProxy — x402 live (Base Sepolia)', () => {
  it('asks a training crawler for payment', async () => {
    const proxy = createGatewayProxy({ mode: 'x402', payTo: PAY_TO, price: '$0.005' });
    const res = await proxy(request('/en/article', UA.gptbot));
    expect(res.status).toBe(402);
    const header = res.headers.get('payment-required');
    expect(header).toBeTruthy();
    const required = JSON.parse(Buffer.from(header ?? '', 'base64').toString('utf8')) as {
      accepts: { payTo: string; network: string }[];
    };
    expect(required.accepts[0]).toMatchObject({ payTo: PAY_TO, network: 'eip155:84532' });
  }, 30_000);
});
