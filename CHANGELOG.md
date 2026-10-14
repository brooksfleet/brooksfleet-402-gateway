# Changelog

## 0.1.1

- README: bundled builds (Next.js, webpack, esbuild) need every x402 peer installed, including
  `@x402/evm`, `@x402/svm` and `@solana/kit`, even for networks you don't accept.
- README: use `@solana/kit` 6.8 or newer with TypeScript 6.
- First release published by CI through npm Trusted Publishing, with provenance.

## 0.1.0

First release.

- Crawler catalogue classified by purpose: training, AI search, AI user-triggered, search engine.
- Next.js `proxy.ts` gateway and Express / NestJS middleware, in `block` or `x402` mode.
- x402 on EVM networks (Base, Ethereum, Polygon, Arbitrum, Avalanche) and Solana, several at once.
- robots.txt rules and renderer; nginx user-agent map generator; `brooksfleet-402-gateway` CLI.
- Brooksfleet Source-Available License 1.0.
