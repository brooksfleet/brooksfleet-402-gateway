# Handoff — 2026-10-17 17:29 +07

## Now

0.1.3 (BRO-53) is published to npm as `latest` via tag `v0.1.3` on `main`. It carries
BRO-52: `.nvmrc` 24, CI matrix Node 22/24/26, `@types/node` `~22.20.5`. No runtime code
changed since 0.1.2. All BRO tickets for this repo are Done.

## Branches

| Branch | Merged? | Unpushed | Dirty | Note |
| ------------- | ------- | -------- | ----- | ---------------------------------------------------------------------------------------- |
| `development` | — | 0 | see below | at `243085c` |
| `main` | — | 0 | — | at `9b21b5e`; 3 merge commits ahead of `development`, file trees identical |

No other branches, local or on GitHub. Merged ticket branches were deleted 2026-10-17.

Uncommitted: `.claude/HANDOFF.md` (this file, modified), `.claude/jira.json` exists locally but is
gitignored (`.gitignore` ignores `.claude`, commit `08200f5`): BRO config for this repo, no
required parent epic.

## PRs (GitHub)

| PR | Branch | Target | CI | State |
| --- | ---------------------- | ------------- | ------- | ------ |
| #7 | `BRO-52-node-24-lts` | `development` | success | merged |
| #8 | `BRO-53-release-0.1.3` | `development` | success | merged |
| #9 | `development` | `main` | success | merged |

PRs #1–#6 merged earlier (BRO-46, BRO-51). No open PRs.

## Releases (npm `brooksfleet-402-gateway`)

| Version | Tag | Publish run | On registry |
| ------- | -------- | -------------------- | ----------------- |
| `0.1.3` | `v0.1.3` | success, 39024759218 | yes, `latest` |
| `0.1.2` | `v0.1.2` | success, 38564564464 | yes |
| `0.1.1` | `v0.1.1` | success | yes |

## Repo protection

| Ruleset | Required checks |
| -------------------------------- | ----------------------------------------- |
| `Protect development` (25072745) | `test (22)`, `test (24)` |
| `Protect main` (25072747) | `test (22)`, `test (24)`, `source-branch` |

`test (26)` runs in CI but is not a required check.

## Jira

| Key | Summary | Status (verified 17:29 +07) |
| ------ | -------------------------------------------------------------------------------------- | --------------------------- |
| BRO-46 | DX - brooksfleet-402-gateway: shared package that makes AI training crawlers pay | Done |
| BRO-51 | DX - brooksfleet-402-gateway 0.1.2: receiving USDC account and proxy origin in README | Done |
| BRO-52 | DX - brooksfleet-402-gateway: develop on Node 24 LTS, test Node 26 in CI | Done |
| BRO-53 | DX - brooksfleet-402-gateway 0.1.3: release tested on Node 22, 24 and 26 | Done |

## Migrations

none — npm library, no database.

## Open issues

- `package-lock.json` must be regenerated under Node 22 (npm 10). npm 11 (Node 24, the
  `.nvmrc` version) drops the nested `@x402/svm` → `typescript@5.9.3` entry, and `npm ci`
  then fails on Node 22.
- One low-severity advisory on `development`: esbuild GHSA-g7r4-m6w7-qqqr (below the
  `high` audit gate).

## Unverified

- Whether 0.1.3 needed a manual staged-publish approval on npmjs.com, or only processing time — it
  reached `latest` within about 3 minutes of the publish run.
