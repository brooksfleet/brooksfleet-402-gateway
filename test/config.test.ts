import { describe, expect, it } from 'vitest';

import { NETWORKS, TESTNET_FACILITATOR_URL, resolveX402, type X402Options } from '../src/index.js';
import { PAY_TO, SOL_PAY_TO, TESTNET_ACCEPTS } from './agents.js';

const base: X402Options = { mode: 'x402', price: '$0.005', accepts: TESTNET_ACCEPTS };

describe('resolveX402', () => {
  it('uses the testnet facilitator for testnets and keeps every target', () => {
    const resolved = resolveX402(base);
    expect(resolved.facilitatorUrl).toBe(TESTNET_FACILITATOR_URL);
    expect(resolved.targets).toEqual([
      { network: NETWORKS['base-sepolia'].id, family: 'evm', payTo: PAY_TO },
      { network: NETWORKS['solana-devnet'].id, family: 'solana', payTo: SOL_PAY_TO },
    ]);
  });

  it('accepts one EVM address on several mainnet chains', () => {
    const resolved = resolveX402({
      mode: 'x402',
      price: '$0.01',
      accepts: [
        { network: 'base', payTo: PAY_TO },
        { network: 'polygon', payTo: PAY_TO },
        { network: 'solana', payTo: SOL_PAY_TO },
      ],
      facilitatorUrl: 'https://facilitator.example',
    });
    expect(resolved.targets.map((t) => t.network)).toEqual([
      'eip155:8453',
      'eip155:137',
      NETWORKS.solana.id,
    ]);
  });

  it.each<[string, Partial<X402Options>, RegExp]>([
    ['bad EVM address', { accepts: [{ network: 'base-sepolia', payTo: '0xabc' }] }, /EVM address/],
    [
      'EVM address on Solana',
      { accepts: [{ network: 'solana-devnet', payTo: PAY_TO }] },
      /Solana address/,
    ],
    ['bad price', { price: '0.005' }, /price/],
    ['non-numeric price', { price: '$abc' }, /price/],
    ['empty accepts', { accepts: [] }, /at least one/],
    [
      'duplicate network',
      {
        accepts: [
          { network: 'base-sepolia', payTo: PAY_TO },
          { network: 'base-sepolia', payTo: PAY_TO },
        ],
      },
      /twice/,
    ],
    [
      'mixed testnet and mainnet',
      {
        accepts: [
          { network: 'base-sepolia', payTo: PAY_TO },
          { network: 'base', payTo: PAY_TO },
        ],
      },
      /mixes testnet and mainnet/,
    ],
    [
      'mainnet without facilitator',
      { accepts: [{ network: 'base', payTo: PAY_TO }] },
      /required on mainnet/,
    ],
    [
      'testnet facilitator on mainnet',
      { accepts: [{ network: 'base', payTo: PAY_TO }], facilitatorUrl: TESTNET_FACILITATOR_URL },
      /testnet-only/,
    ],
  ])('rejects %s', (_label, override, error) => {
    expect(() => resolveX402({ ...base, ...override })).toThrow(error);
  });

  it('rejects an unknown network from plain-JS callers', () => {
    const accepts = JSON.parse('[{"network":"mainnet","payTo":"0x0"}]') as X402Options['accepts'];
    expect(() => resolveX402({ ...base, accepts })).toThrow(/unknown network/);
  });
});
