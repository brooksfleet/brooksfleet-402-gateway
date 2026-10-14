# brooksfleet-402-gateway

**Make AI training crawlers pay for your content — and keep search traffic flowing.**

[![npm](https://img.shields.io/npm/v/brooksfleet-402-gateway.svg)](https://www.npmjs.com/package/brooksfleet-402-gateway)
[![CI](https://github.com/brooksfleet/brooksfleet-402-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/brooksfleet/brooksfleet-402-gateway/actions/workflows/ci.yml)
[![License: source-available](https://img.shields.io/badge/license-source--available-blue.svg)](LICENSE)

AI companies crawl the web to train their models. Your articles, docs and product pages
are the raw material, and nobody asked. HTTP has had a status code for exactly this since
1997 — **`402 Payment Required`** — and with [x402](https://x402.org) it finally does
something: a crawler can pay per page in USDC and get the content in the same request.

`brooksfleet-402-gateway` puts that in front of your site in a few lines:

- **Training crawlers** (GPTBot, ClaudeBot, CCBot, Bytespider, …) get a **402** — either a
  plain "licence required" block, or a real **x402 payment request**.
- **Search engines and AI search agents** (Googlebot, Bingbot, OAI-SearchBot,
  Claude-SearchBot, ChatGPT-User, PerplexityBot, …) **pass untouched** — being found and
  cited is worth more than a crawl fee.
- **People** never notice. Their requests don't even load the payment code.

Works with **Next.js**, **Express**, **NestJS**, and — through a generated config —
**anything behind nginx** (Odoo, WordPress, static sites, …).

---

## Contents

- [How traffic is treated](#how-traffic-is-treated)
- [Install](#install)
- [Next.js](#nextjs)
- [Express](#express)
- [NestJS](#nestjs)
- [nginx (any stack)](#nginx-any-stack)
- [robots.txt: allow or disallow?](#robotstxt-allow-or-disallow)
- [Getting paid with x402](#getting-paid-with-x402)
- [Options](#options)
- [The crawler list](#the-crawler-list)
- [Limits — read before you rely on it](#limits--read-before-you-rely-on-it)
- [Feature requests](#feature-requests)
- [License](#license)

## How traffic is treated

| Who                                                         | Purpose         | Default      |
| ----------------------------------------------------------- | --------------- | ------------ |
| GPTBot, ClaudeBot, CCBot, Bytespider, Meta-ExternalAgent, … | `training`      | **402**      |
| OAI-SearchBot, Claude-SearchBot, PerplexityBot              | `ai-search`     | pass         |
| ChatGPT-User, Claude-User, Perplexity-User                  | `ai-user`       | pass         |
| Googlebot, Bingbot, DuckDuckBot, Applebot, YandexBot        | `search-engine` | pass         |
| Browsers, unknown clients                                   | —               | pass         |
| Anyone requesting `/robots.txt`                             | —               | pass, always |

Which purposes are charged is configurable — charge `ai-search` too if that is your call.

## Install

```sh
npm install brooksfleet-402-gateway
```

For **block mode** that's all. For **x402 payments**, add the x402 packages for your stack
and the networks you accept:

```sh
# Next.js
npm install @x402/core @x402/next
# Express / NestJS
npm install @x402/core @x402/express

# EVM networks (Base, Ethereum, Polygon, Arbitrum, Avalanche)
npm install @x402/evm
# Solana
npm install @x402/svm @solana/kit
```

They are optional peer dependencies: block mode never imports them, and at runtime each
network family's package loads only when you accept a network from that family.

**With a bundler** (Next.js always; NestJS or Express when built with webpack or esbuild),
install **all** of them for x402 mode, even for networks you don't accept. The bundler
resolves every `import()` it finds at build time, whether or not that code ever runs, so a
missing package fails the build:

```sh
# Next.js, x402 mode
npm install @x402/core @x402/next @x402/evm @x402/svm @solana/kit
```

On TypeScript 6, use `@solana/kit` 6.8 or newer. Earlier versions declare a peer dependency on
TypeScript 5, and npm refuses to install it alongside TypeScript 6.

You do **not** need `@x402/paywall` — that is a browser wallet UI for humans, and crawlers
don't use it.

## Next.js

Next.js 16+ — create `proxy.ts` (formerly `middleware.ts`) in the project root:

```ts
// proxy.ts
import { createGatewayProxy } from 'brooksfleet-402-gateway/next';

// Block: training crawlers get a 402 "licence required".
export const proxy = createGatewayProxy({ mode: 'block' });

// Or charge them via x402 — testnets until you switch:
// export const proxy = createGatewayProxy({
//   mode: 'x402',
//   price: '$0.005',
//   accepts: [
//     { network: 'solana-devnet', payTo: process.env.X402_SOLANA_ADDRESS ?? '' },
//     { network: 'base-sepolia', payTo: process.env.X402_EVM_ADDRESS ?? '' },
//   ],
// });

export const config = {
  // Skip static assets; the gateway handles pages.
  matcher: ['/((?!_next/|favicon.ico).*)'],
};
```

And publish matching rules in `app/robots.ts`:

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';
import { robotsRules } from 'brooksfleet-402-gateway';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: robotsRules({ charged: 'allow' }), // see "allow or disallow?" below
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

## Express

```ts
import express from 'express';
import { renderRobotsTxt, robotsRules } from 'brooksfleet-402-gateway';
import { createGatewayMiddleware } from 'brooksfleet-402-gateway/express';

const app = express();

app.use(createGatewayMiddleware({ mode: 'block' }));
// or: app.use(createGatewayMiddleware({
//   mode: 'x402',
//   price: '$0.005',
//   accepts: [{ network: 'base-sepolia', payTo: '0x…' }],
// }));

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(renderRobotsTxt(robotsRules()));
});
```

## NestJS

NestJS runs on Express, so the same middleware goes in `main.ts`:

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { createGatewayMiddleware } from 'brooksfleet-402-gateway/express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(createGatewayMiddleware({ mode: 'block' }));
  await app.listen(3000);
}
void bootstrap();
```

## nginx (any stack)

For apps you can't — or don't want to — change, let nginx answer. The CLI generates the
user-agent map from the same crawler list:

```sh
npx brooksfleet-402-gateway nginx > /etc/nginx/conf.d/ai-training-crawlers.conf
```

Then in your `server { … }` block:

```nginx
# robots.txt stays readable for everyone — it carries your terms.
location = /robots.txt {
    proxy_pass http://127.0.0.1:3000;
}

location / {
    if ($ai_training_crawler) {
        return 402;
    }
    proxy_pass http://127.0.0.1:3000;
}
```

Want a branded page as the 402 body? Add `error_page 402 /licensing;` inside `location /`
and serve `/licensing` from a `location` without the check — with no `=` in `error_page`,
nginx keeps the 402 status. nginx can block, but it cannot take payments; for x402, use the
Next.js or Express integration.

Regenerate the file when you upgrade the package — the crawler list grows.

```sh
npx brooksfleet-402-gateway list                 # what is matched, and why
npx brooksfleet-402-gateway robots --disallow    # a matching robots.txt
```

## robots.txt: allow or disallow?

This choice matters more than it looks.

- **`charged: 'allow'`** (default) — training crawlers are allowed in robots.txt, so they
  reach your 402 and _can_ pay. **Use this with x402.**
- **`charged: 'disallow'`** — training crawlers are asked to stay away. Crawlers that
  respect robots.txt never fetch a page, so they never see the 402; only those ignoring
  robots.txt get it. This is the clearer opt-out signal, and the right pairing for
  **block mode**.

`disallow` also lists `Google-Extended` and `Applebot-Extended`: they never appear in a
User-Agent (Google and Apple crawl with their search bots), so robots.txt is the only place
to opt out of their AI training.

## Getting paid with x402

[x402](https://x402.org) is an open payment protocol on top of HTTP 402:

```text
crawler ── GET /article ─────────────────────────▶ gateway
        ◀── 402 + PAYMENT-REQUIRED (price, USDC, your address) ──
crawler signs a USDC transfer authorisation
crawler ── GET /article + PAYMENT-SIGNATURE ─────▶ gateway ──▶ facilitator verifies & settles on-chain
        ◀── 200 + content + PAYMENT-RESPONSE (receipt) ──
```

### Networks

You accept USDC on one or more networks; the crawler pays on whichever it holds funds on.
Offering several raises the odds of getting paid.

| Network | Name                                                   | Address                   | Testnet                            |
| ------- | ------------------------------------------------------ | ------------------------- | ---------------------------------- |
| EVM     | `base`, `ethereum`, `polygon`, `arbitrum`, `avalanche` | one `0x…` address for all | `base-sepolia`, `arbitrum-sepolia` |
| Solana  | `solana`                                               | a base58 Solana address   | `solana-devnet`                    |

### Your wallet

Use a **self-custody wallet**: [Phantom](https://phantom.com) gives you a Solana address
and an EVM address in one app, and MetaMask, Rabby or Coinbase Wallet work for EVM. Two
rules:

- **Only the public address goes into config** — in an environment variable, never in code.
  Your private key and recovery phrase never touch the server, a repository or a ticket.
- **Avoid exchange deposit addresses.** They are often credited on one chain only; USDC
  arriving on another can be lost.

### Step by step

1. **Start on testnet.** Use `base-sepolia` and/or `solana-devnet`; the public testnet
   facilitator is the default there, so nothing real moves while you try it. Get test USDC
   from [Circle's faucet](https://faucet.circle.com) to pay yourself once.
2. **Pick a price.** Per request, in USD, paid in USDC: `'$0.001'` to `'$0.01'` per page is
   where early experiments sit.
3. **Go live:** switch to mainnet networks and set a mainnet `facilitatorUrl` — for example
   Coinbase CDP's (`https://api.cdp.coinbase.com/platform/v2/x402`; check its docs for
   account and API-key requirements, fees and which networks it settles). Every network you
   accept must be supported by your facilitator. The gateway refuses mainnet without a
   facilitator, refuses the testnet facilitator on mainnet, and refuses mixing the two.

```ts
createGatewayProxy({
  mode: 'x402',
  price: '$0.005',
  accepts: [
    { network: 'solana', payTo: process.env.X402_SOLANA_ADDRESS ?? '' },
    { network: 'base', payTo: process.env.X402_EVM_ADDRESS ?? '' },
    { network: 'polygon', payTo: process.env.X402_EVM_ADDRESS ?? '' },
  ],
  facilitatorUrl: process.env.X402_FACILITATOR_URL,
});
```

Options are validated when the gateway is created, so a wrong address format, an unknown
network or a bad price fails at startup — not as a 500 on the first crawler.

In the Next.js proxy, payment is verified and settled **before** your page renders. In
Express, settlement follows x402's middleware behaviour.

## Options

`createGatewayProxy(options)` (Next.js) and `createGatewayMiddleware(options)`
(Express/NestJS) take the same options:

| Option           | Mode  | Default                          | Meaning                               |
| ---------------- | ----- | -------------------------------- | ------------------------------------- |
| `mode`           | both  | —                                | `'block'` or `'x402'`                 |
| `purposes`       | both  | `['training']`                   | Which crawler purposes are charged    |
| `exemptPaths`    | both  | `['/robots.txt']`                | Exact paths served to everyone        |
| `message`        | block | "Payment required. …"            | Plain-text body of the 402            |
| `price`          | x402  | —                                | USD per request, e.g. `'$0.005'`      |
| `accepts`        | x402  | —                                | `[{ network, payTo }]` — see Networks |
| `facilitatorUrl` | x402  | testnet facilitator on testnet   | Required on mainnet                   |
| `description`    | x402  | "Licence to collect this page …" | Shown to the paying client            |

The core entry point also exports the building blocks: `classifyUserAgent`,
`isChargedCrawler`, `CRAWLERS`, `robotsRules`, `renderRobotsTxt`, `nginxMap`,
`resolveX402`.

## The crawler list

One list drives everything — the middleware, robots.txt and the nginx map — so they can't
drift apart. See it with `npx brooksfleet-402-gateway list` or in
[`src/crawlers.ts`](src/crawlers.ts). Each entry is classified by **purpose**, not by
company: OpenAI runs a training crawler (GPTBot) _and_ a search agent (OAI-SearchBot), and
they deserve different answers.

## Limits — read before you rely on it

- **User-Agent is a claim, not a proof.** A crawler that pretends to be a browser walks
  through. Verifying crawlers cryptographically (Web Bot Auth) or by reverse DNS is out of
  scope for now; a CDN such as Cloudflare can do it in front of this.
- **Few crawlers pay today.** As of 2026 the big training crawlers don't speak x402, so in
  practice x402 mode works like a block that _could_ pay — useful as a standing offer and
  for AI agents that do pay. Expect little revenue until crawlers adopt it.
- **It is not legal advice.** A 402 and a robots.txt line state your terms; what they mean
  legally depends on where you and the crawler are.

## Feature requests

Missing a crawler, a framework or a network? **[Open an issue](https://github.com/brooksfleet/brooksfleet-402-gateway/issues)**
— Brooksfleet maintains the code and ships improvements in new releases. For a crawler,
include the operator's documentation link for its User-Agent and what it is used for, so its
purpose is classified right.

The license does not allow modified versions or forks, so please don't patch your copy —
ask, and it lands in the package for everyone.

## License

**Brooksfleet Source-Available License 1.0** — see [LICENSE](LICENSE). In short:

- **You may** install and use it, unmodified, in any project — commercial included.
- **You may** ship it inside your built application (bundled, minified, in a container image).
- **You may not** create modified versions, derivative works or forks, or republish the package.
- **Changes** go through [feature requests](#feature-requests).

© 2026 Brooksfleet LLC. All rights not expressly granted are reserved.

---

Built and maintained by **[Brooksfleet](https://brooksfleet.com)** — AI consulting, software
development and digital transformation for companies that want AI to work for them, not on
them. Need help putting this in front of your site? [Get in touch](https://brooksfleet.com).
