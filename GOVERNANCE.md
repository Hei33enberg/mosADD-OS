# Governance

mosadd is an open-source project with a small core team and an open contributor model. This document explains how decisions are made and how to become a maintainer.

## Roles

### Contributors
Anyone who opens an issue, comments on a discussion, submits a PR, helps with docs, or contributes in any other way. No formal role needed.

### Maintainers
Contributors with merge rights. Two kinds:

- **Core maintainers** — full repo access, can land changes to anything, set direction
- **Channel maintainers** — merge rights for a specific `m*` module or area (e.g. `mTALK`, `mKB`, `providers/livekit`)

Becoming a maintainer:
1. Land 5+ meaningful PRs over 3+ months
2. Demonstrated good judgement in reviews
3. Active in community (Discord, RFCs, issue triage)
4. Nominated by an existing maintainer, approved by core team

### Steering committee
Core maintainers form the steering committee. Currently bootstrapping — initial committee to be named at the first stable release.

## Decision making

### Lazy consensus
Default for most decisions. Maintainer proposes change (PR, RFC, or issue), waits 3 business days. Silence = approval.

### Voting
For contentious decisions (license change, breaking changes, major architecture shifts):
- Open a `RFC: ...` issue
- 1-week comment window
- Core maintainers vote by 👍/👎 on the issue
- Majority decides
- Tie = steering committee chair breaks tie

### Vetos
Any maintainer can veto a PR within their domain for technical reasons (correctness, security, license). Veto requires written rationale.

## RFC process

For changes that:
- Add a new `m*` module
- Change a public API (`@mosadd/*` exports)
- Add or remove a provider
- Modify governance

Follow the RFC template in [`docs/rfcs/0000-template.md`](./docs/rfcs/0000-template.md). RFCs go through lazy consensus.

## Release cadence

- **Patch releases** (`3.0.0` → `3.0.1`) — as needed, security fixes within 24h
- **Minor releases** (`3.0.x` → `3.1.0`) — monthly
- **Major releases** (`3.x.x` → `4.0.0`) — when breaking changes accumulate, typically annually

Releases use [Changesets](https://github.com/changesets/changesets). Every PR with a public API change requires a changeset.

## Security

Vulnerability disclosure: see [SECURITY.md](./SECURITY.md). Email `security@mosadd.com` privately. We respond within 48h.

## Funding

mosadd is developed primarily by the team behind the **commercial hub** at `mcp.mosadd.com` and `hub.mosadd.com`. This funds full-time maintainers.

Open source contributions are welcomed and credited but unpaid.

## Trademark

"mosadd" and the mosadd logo are trademarks. The Apache-2.0 license does **not** grant trademark rights. You may not use the name in a way that implies endorsement without permission.

## Forks

You're free to fork under Apache-2.0. We ask that:
- You rename the fork (don't call it "mosadd")
- You make clear it's a fork (in README and package name)
- You contribute back when feasible

## Changes to this document

Changes require an RFC and 2/3 majority of core maintainers.
