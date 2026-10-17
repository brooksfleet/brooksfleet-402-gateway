# Handoff — 2026-10-14 19:37 +07

## Now

0.1.2 (BRO-51) is merged to `main` and tagged `v0.1.2`. The Publish run succeeded at
12:32 UTC, but at 12:37 UTC the npm registry had not yet listed 0.1.2. The
development → main flow and branch protection are in place.

## Branches

| Branch                                                                                                         | Merged?                        | Unpushed | Dirty | Note                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| `development`                                                                                                  | —                              | 0        | no    | at `0436b53`; default branch                                                                                    |
| `main`                                                                                                         | —                              | 0        | no    | local is 3 behind `origin/main` (`b2d179d`); file trees of `origin/main` and `origin/development` are identical |
| `origin/BRO-46-ci-runtime`, `origin/BRO-46-pkg-fix`, `origin/BRO-46-release-0.1.1`, `origin/BRO-51-docs-0.1.2` | yes, into `origin/development` | —        | —     | remote branches not deleted                                                                                     |

Uncommitted: `.claude/HANDOFF.md` (this file, new) only.

## PRs (GitHub)

| PR  | Branch                 | Target        | CI      | State  |
| --- | ---------------------- | ------------- | ------- | ------ |
| #1  | `BRO-46-ci-runtime`    | `main`        | success | merged |
| #2  | `BRO-46-pkg-fix`       | `main`        | success | merged |
| #3  | `BRO-46-release-0.1.1` | `development` | success | merged |
| #4  | `development`          | `main`        | success | merged |
| #5  | `BRO-51-docs-0.1.2`    | `development` | success | merged |
| #6  | `development`          | `main`        | success | merged |

## Releases (npm `brooksfleet-402-gateway`)

| Version       | Tag      | Publish run                     | On registry                                      |
| ------------- | -------- | ------------------------------- | ------------------------------------------------ |
| `0.0.0-stage` | —        | — (manual)                      | yes                                              |
| `0.1.0`       | `v0.1.0` | failed: version already existed | yes, published manually before merge             |
| `0.1.1`       | `v0.1.1` | success (attempt 4)             | yes, with provenance                             |
| `0.1.2`       | `v0.1.2` | success, run 38564564464        | not yet as of 12:37 UTC; `latest` is still 0.1.1 |

npm trusted publisher: GitHub `brooksfleet/brooksfleet-402-gateway`, `publish.yml`, permissions
`publish, stage publish` (id `880838e9-2488-453e-a23a-f02f356d3285`).

## Repo protection

| Ruleset                          | Branch        | Rules                                                                                             |
| -------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `Protect development` (25072745) | `development` | PR required (0 approvals), checks `test (22)` + `test (24)`, no force-push, no deletion           |
| `Protect main` (25072747)        | `main`        | same, plus check `source-branch` (PRs into `main` must come from `development`); no bypass actors |

Publish workflow refuses tags whose commit is not on `main`.

## Jira

| Key    | Summary                                                                               | Status (verified 19:36 +07) |
| ------ | ------------------------------------------------------------------------------------- | --------------------------- |
| BRO-46 | DX - brooksfleet-402-gateway: shared package that makes AI training crawlers pay      | QA                          |
| BRO-51 | DX - brooksfleet-402-gateway 0.1.2: receiving USDC account and proxy origin in README | QA                          |

## Migrations

none — npm library, no database.

## Open issues

- `npm audit`: one low-severity dev-only esbuild advisory
  (GHSA-g7r4-m6w7-qqqr); esbuild 0.27 is pinned by tsup and vitest.
- TypeScript is held at 6.0.3: `typescript-eslint` supports `<6.1.0`, so
  TS 7 is blocked.
- `0.0.0-stage` is still on npm; it can be unpublished until 72 hours after
  2026-10-14 07:59 UTC.
- `gh` active account is `brooksfleet` (admin); `cpuell` has push only.

## Unverified

- `brooksfleet-402-gateway@0.1.2` availability on npm: CI log says `+ brooksfleet-402-gateway@0.1.2`
  and "being processed", but the registry did not list it 5 minutes later.
- Whether 0.1.0 as published matches `main` at `v0.1.0` was never compared.
