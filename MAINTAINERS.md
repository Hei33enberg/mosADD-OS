# Maintainers

This file lists the current maintainers of mosadd-os, their areas of focus, and how decisions get made when multiple maintainers disagree. See [GOVERNANCE.md](./GOVERNANCE.md) for the underlying process; this file is the *who*, not the *how*.

## The Sovereign (BDFL)

The Sovereign holds final authority on strategic direction, trademark, licence policy, and conflict resolution — see [GOVERNANCE.md](./GOVERNANCE.md) for the model.

| Name | GitHub | Areas |
|---|---|---|
| Maciej Damian Białek | [@Hei33enberg](https://github.com/Hei33enberg) | founder · strategic direction · trademark · commercial hub roadmap |

Succession and absorption-proofing are written down in [REALM.md](./REALM.md#succession--absorption-proofing).

## Maintainers (per-area)

Maintainers can merge PRs in their area, request reviews, and advise on RFCs (RFCs are ratified by the Sovereign — see [GOVERNANCE.md](./GOVERNANCE.md)).

| Name | GitHub | Area | Status |
|---|---|---|---|
| Maciej Damian Białek | [@Hei33enberg](https://github.com/Hei33enberg) | all areas (bootstrap) | active |
| *(open)* | | `@mosadd/mcp` — MCP server, tool surface | seeking |
| *(open)* | | `@mosadd/ai` — framework adapters | seeking |
| *(open)* | | `@mosadd/providers` — provider adapters (Supabase, LiveKit, nwaku) | seeking |
| *(open)* | | `@mosadd/crypto` — E2E primitives, X3DH, Double Ratchet | seeking |
| *(open)* | | `@mosadd/threat-engine` — radar event taxonomy | seeking |
| *(open)* | | `apps/dev` — developer portal (folded into mosadd.com) | seeking |
| *(open)* | | docs · RFCs · governance | seeking |

We're seeking maintainers. If you want to help maintain one of these areas after a few merged contributions, open an issue tagged `maintainer-track` and we'll talk.

## Reviewers

Reviewers can approve PRs in their area but cannot merge unilaterally. Promotion to maintainer requires 3 months active contribution + 2 maintainer +1s.

*(Currently empty — see open positions above.)*

## How to become a maintainer

1. Land 5+ substantive PRs in one area
2. Show good judgement in code review (comments on others' PRs)
3. Be active in the [community channels](./README.md#contributing) — GitHub Discussions, the mosADD community room
4. Open an issue tagged `maintainer-track` with your case
5. 2 existing maintainers +1 OR Sovereign approval

Step 1 is the main gate. Substantive means: not typo fixes, not dependency bumps. Real feature work or non-trivial bug fixes.

## How to remove a maintainer

A maintainer can be removed by the Sovereign for inactivity (>6 months silence), conduct violations (per [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)), or repeated decisions in bad faith.

Removed maintainers may rejoin after a 12-month cooling period.

## Office hours

Open hours when maintainers are available for sync conversation:

- *(currently async-first; sync office hours start when we have ≥3 active maintainers)*

## Contact

- Public: GitHub Discussions, Issues, the mosADD community room (see [README → Contributing](./README.md#contributing))
- Private (legal, security, conflicts): `conduct@mosadd.com` · `security@mosadd.com`
