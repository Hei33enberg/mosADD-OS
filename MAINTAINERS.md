# Maintainers

This file lists the current maintainers of mosadd-os, their areas of focus, and how decisions get made when multiple maintainers disagree. See [GOVERNANCE.md](./GOVERNANCE.md) for the underlying process; this file is the *who*, not the *how*.

## Steering committee

The steering committee holds final authority on strategic direction, trademark, licence policy, and conflict resolution.

| Name | GitHub | Areas |
|---|---|---|
| Maciej Damian Białek | [@Hei33enberg](https://github.com/Hei33enberg) | founder · strategic direction · trademark · commercial hub roadmap |

The committee starts with one member (founder) and expands as the project does. Adding a new member requires unanimous steering vote + a 30-day public comment window.

## Maintainers (per-area)

Maintainers can merge PRs in their area, request reviews, and vote on RFCs.

| Name | GitHub | Area | Status |
|---|---|---|---|
| Maciej Damian Białek | [@Hei33enberg](https://github.com/Hei33enberg) | all areas (bootstrap) | active |
| *(open)* | | `@m0ssad/mcp` — MCP server, tool surface | seeking |
| *(open)* | | `@m0ssad/ai` — framework adapters | seeking |
| *(open)* | | `@m0ssad/providers` — provider adapters (Supabase, Telnyx, LiveKit, Routr) | seeking |
| *(open)* | | `@m0ssad/bridges` — Telegram/Discord/Matrix/Signal | seeking |
| *(open)* | | `@m0ssad/crypto` — E2E primitives, X3DH, Double Ratchet | seeking |
| *(open)* | | `@m0ssad/threat-engine` — radar event taxonomy | seeking |
| *(open)* | | `apps/dev` — mosadd.dev developer portal | seeking |
| *(open)* | | docs · RFCs · governance | seeking |

We're seeking maintainers. If you want to help maintain one of these areas after a few merged contributions, open an issue tagged `maintainer-track` and we'll talk.

## Reviewers

Reviewers can approve PRs in their area but cannot merge unilaterally. Promotion to maintainer requires 3 months active contribution + 2 maintainer +1s.

*(Currently empty — see open positions above.)*

## How to become a maintainer

1. Land 5+ substantive PRs in one area
2. Show good judgement in code review (comments on others' PRs)
3. Be active in the [community channels](./README.md#contributing) — Discord, GitHub Discussions
4. Open an issue tagged `maintainer-track` with your case
5. 2 existing maintainers +1 OR steering committee approval

Step 1 is the main gate. Substantive means: not typo fixes, not dependency bumps. Real feature work or non-trivial bug fixes.

## How to remove a maintainer

A maintainer can be removed by steering committee for inactivity (>6 months silence), conduct violations (per [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)), or repeated decisions in bad faith.

Removed maintainers may rejoin after a 12-month cooling period.

## Office hours

Open hours when maintainers are available for sync conversation:

- *(currently async-first; sync office hours start when we have ≥3 active maintainers)*

## Contact

- Public: GitHub Discussions, Issues, Discord (link in README)
- Private (legal, security, conflicts): `conduct@mosadd.com` · `security@mosadd.com`
