import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { GatewayOptions } from '../src/config.js';
import { createGatewayMiddleware } from '../src/express.js';
import { TESTNET_ACCEPTS, UA } from './agents.js';

function app(options: GatewayOptions) {
  return express()
    .use(createGatewayMiddleware(options))
    .get('/{*path}', (_req, res) => {
      res.send('content');
    });
}

describe('createGatewayMiddleware — block', () => {
  const server = app({ mode: 'block' });

  it('answers a training crawler with 402', async () => {
    const res = await request(server).get('/en').set('user-agent', UA.claudebot);
    expect(res.status).toBe(402);
    expect(res.text).toMatch(/Payment required/);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it.each([UA.googlebot, UA.claudeSearch, UA.chatgptUser, UA.browser])('passes %s', async (ua) => {
    const res = await request(server).get('/en').set('user-agent', ua);
    expect(res.status).toBe(200);
    expect(res.text).toBe('content');
  });

  it('keeps robots.txt readable for charged crawlers', async () => {
    const res = await request(server).get('/robots.txt').set('user-agent', UA.gptbot);
    expect(res.status).toBe(200);
  });
});

describe('createGatewayMiddleware — x402', () => {
  it('never loads x402 for traffic that passes', async () => {
    const server = app({
      mode: 'x402',
      price: '$0.005',
      accepts: TESTNET_ACCEPTS,
      facilitatorUrl: 'http://127.0.0.1:9',
    });
    const res = await request(server).get('/').set('user-agent', UA.browser);
    expect(res.status).toBe(200);
  });
});

describe.skipIf(!process.env.X402_LIVE)(
  'createGatewayMiddleware — x402 live (Base Sepolia)',
  () => {
    it('asks a training crawler for payment', async () => {
      const server = app({ mode: 'x402', price: '$0.005', accepts: TESTNET_ACCEPTS });
      const res = await request(server).get('/en/article').set('user-agent', UA.gptbot);
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeTruthy();
    }, 30_000);
  },
);
