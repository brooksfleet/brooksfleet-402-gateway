# Changelog

## 0.2.0

- Breaking: peer dependency floors raised to `next` 16.4.1, `@x402/*` 2.30.0 and `@solana/kit`
  8.0.0. Earlier versions are affected by security advisories or are not supported by x402 2.30.
- Security: excludes the Next.js remote code execution advisories GHSA-2464-fhr4-w9xw and
  GHSA-673q-mjm6-r5xr, the Next.js denial of service GHSA-p3m5-59mp-jv5r, and the Zod memory
  exhaustion GHSA-mrhx-c7xc-m3w5 that reaches x402 below 2.30.

## 0.1.3

- Tested on Node 22, 24 and 26; developed on Node 24 LTS. Node 22 remains the minimum.

## 0.1.2

- README: receive USDC once on every network you accept before going live — without a USDC
  account at your address every payment fails (`invalid_exact_svm_transaction_simulation_failed`
  on Solana).
- README: behind a reverse proxy or in a container, hand the gateway a request on your public
  origin, or the payment request names an internal host.

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
