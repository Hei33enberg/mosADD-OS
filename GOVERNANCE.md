# Governance

mosadd is a **BDFL-governed project** — a kingdom, not a democracy. The founder holds final decision authority on direction, scope, naming, and brand. The community proposes and builds; the crown decides. We say this openly because pretending otherwise would be the dishonest version — the same honesty stance we apply to encryption applies to power.

The model has long precedent in open source: Linux, Python (pre-2018), and SQLite all shipped for decades under a sovereign maintainer. The companion charter — roles, levels, rewards, and succession — lives in [REALM.md](./REALM.md).

## Roles

### Contributors
Anyone who opens an issue, comments on a discussion, submits a PR, helps with docs, or contributes in any other way. No formal role needed. Recognition and levels: [REALM.md](./REALM.md).

### Maintainers
Contributors with merge rights. Two kinds:

- **Core maintainers** — full repo access, can land changes to anything
- **Channel maintainers** — merge rights for a specific `m*` module or area (e.g. `mTALK`, `mRAG`, `providers/livekit`)

Merge rights are **delegated authority** — granted by the Sovereign, revocable by the Sovereign, and exercised autonomously day-to-day within the maintainer's area.

Becoming a maintainer:
1. Land 5+ meaningful PRs over 3+ months
2. Demonstrated good judgement in reviews
3. Active in community (Discussions, the mosADD community room, RFCs, issue triage)
4. Nominated by an existing maintainer, ratified by the Sovereign

### The Sovereign (BDFL)
**Hei33enberg (Maciej Damian Białek)** — founder. Holds the vision, the final word, and the trademark. See [MAINTAINERS.md](./MAINTAINERS.md) for areas and [REALM.md → Succession](./REALM.md#succession--absorption-proofing) for what happens if the Sovereign is ever absent or captured.

## Decision making

### Lazy consensus
Default for routine and technical decisions. A maintainer proposes a change (PR, RFC, or issue) and waits 3 business days. Silence = approval. The Sovereign can override within the same window; overrides are written down.

### Advisory RFCs
For consequential decisions (new modules, public API changes, provider changes, governance changes), the RFC process is how the community formally advises. The Sovereign ratifies or rejects, with written rationale. There is no vote to win — there is a case to make.

A **ratified RFC is binding direction**, including on the Sovereign's own future changes: changing what a ratified RFC decided requires a superseding RFC, not a quiet edit. The RFC record in [`docs/rfcs/`](./docs/rfcs/) is the project's constitutional memory.

### Vetos
Any maintainer can veto a PR within their domain for technical reasons (correctness, security, license). A veto requires written rationale and is overridable only by the Sovereign, in writing.

## RFC process

Required for changes that:
- Add a new `m*` module
- Change a public API (`@mosadd/*` exports)
- Add or remove a provider
- Modify governance

Follow the RFC template in [`docs/rfcs/0000-template.md`](./docs/rfcs/0000-template.md). RFCs go through lazy consensus + Sovereign ratification.

## Release cadence

- **Patch releases** (`3.0.0` → `3.0.1`) — as needed, security fixes within 24h
- **Minor releases** (`3.0.x` → `3.1.0`) — monthly
- **Major releases** (`3.x.x` → `4.0.0`) — when breaking changes accumulate, typically annually

Releases use [Changesets](https://github.com/changesets/changesets). Every PR with a public API change requires a changeset.

## Security

Vulnerability disclosure: see [SECURITY.md](./SECURITY.md). Email `security@mosadd.com` privately. We respond within 48h.

## Funding

mosadd is **self-funded** — by the team behind the commercial hub at `mcp.mosadd.com` and `hub.mosadd.com`, which pays for full-time maintenance. We take **no venture capital, no private equity, no public-market money — ever** ([MANIFESTO.md](./MANIFESTO.md)). Money that can outvote the mission is money we do not take.

Open source contributions are welcomed and credited in the open ledger ([REALM.md](./REALM.md), [HALL_OF_FAME.md](./HALL_OF_FAME.md)) but unpaid today; see REALM.md for what is (and is not yet) promisable.

## Trademark

"mosadd" and the mosadd logo are trademarks, held by the Sovereign. The Apache-2.0 license does **not** grant trademark rights. You may not use the name in a way that implies endorsement without permission. See [TRADEMARK.md](./TRADEMARK.md).

## Forks

You're free to fork under Apache-2.0. We ask that:
- You rename the fork (don't call it "mosadd")
- You make clear it's a fork (in README and package name)
- You contribute back when feasible

The right to fork is the community's ultimate check on the Sovereign — and we keep it intact on purpose.

## Changes to this document

Changes to governance require an RFC and the Sovereign's ratification. The succession provisions live in [REALM.md](./REALM.md#succession--absorption-proofing).
