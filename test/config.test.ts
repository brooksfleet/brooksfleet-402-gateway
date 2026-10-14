import { describe, expect, it } from 'vitest';

import { NETWORKS, TESTNET_FACILITATOR_URL, resolveX402 } from '../src/index.js';
import { PAY_TO } from './agents.js';

describe('resolveX402', () => {
  it('defaults to the testnet and its facilitator', () => {
    expect(resolveX402({ mode: 'x402', payTo: PAY_TO, price: '$0.005' })).toMatchObject({
      network: NETWORKS['base-sepolia'],
      facilitatorUrl: TESTNET_FACILITATOR_URL,
    });
  });

  it.each([
    [{ payTo: 'not-an-address' }, /payTo/],
    [{ payTo: '0xabc' }, /payTo/],
    [{ price: '0.005' }, /price/],
    [{ price: '$abc' }, /price/],
    [{ network: 'base' }, /facilitatorUrl is required on mainnet/],
    [{ network: 'base', facilitatorUrl: TESTNET_FACILITATOR_URL }, /testnet-only/],
    [{ network: 'mainnet' }, /unknown network/],
  ])('rejects %o', (override, error) => {
    // Plain-JS callers can pass anything; the runtime checks are what this covers.
    const options = { mode: 'x402', payTo: PAY_TO, price: '$0.005', ...override } as Parameters<
      typeof resolveX402
    >[0];
    expect(() => resolveX402(options)).toThrow(error);
  });

  it('accepts mainnet with an explicit facilitator', () => {
    expect(
      resolveX402({
        mode: 'x402',
        payTo: PAY_TO,
        price: '$0.01',
        network: 'base',
        facilitatorUrl: 'https://facilitator.example',
      }).network,
    ).toBe(NETWORKS.base);
  });
});
