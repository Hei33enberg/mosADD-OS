# The mosADD Realm

The Realm is the mosADD contributor community and its open ledger — the people (and agents) who build, run, defend, and spread the layer, and the written rules for how their work is recognized, rewarded, and protected from capture.

One principle governs everything here: **the crown holds the DNA, the realm holds the infrastructure.** The founder keeps the vision, the name, and the final word ([GOVERNANCE.md](./GOVERNANCE.md)); the community holds the running code, the mirrors, the merge rights, and the credit. That split is deliberate — it is what makes this project hard to buy and hard to capture (see [Succession](#succession--absorption-proofing)).

Every realm title below carries its plain open-source equivalent. The theme is flavor; the rights are real.

## Roles

| Realm role | OSS equivalent | Rights | How you get it |
|---|---|---|---|
| **Citizen** | community member | read, post, participate in Discussions and community rooms | show up |
| **Squire** | first-time contributor | listed in the ledger, triage credit | first merged substantive PR |
| **Knight** | recognized contributor | row in the [Hall of Fame](./HALL_OF_FAME.md), early-access alphas | 3+ substantive PRs |
| **Baron / Baroness** | area maintainer | merge rights in an area, RFC voice | the [MAINTAINERS.md](./MAINTAINERS.md) path |
| **Herald** | ambassador / devrel | official community voice, content amplified, hosts events | sustained propagation, named by the Crown |
| **Warden** | security researcher | Hall of Fame security lane | accepted disclosure per [SECURITY.md](./SECURITY.md) |
| **Peer of the Realm** | certified partner | listing on mosadd.com, named in the operational chain | certified integration or field deployment |
| **The Crown** | founder / BDFL | vision, final word, trademark | see [GOVERNANCE.md](./GOVERNANCE.md) |

## Levels

Levels are earned, public, and recorded in the ledger ([HALL_OF_FAME.md](./HALL_OF_FAME.md)). "Substantive" means what [HALL_OF_FAME.md](./HALL_OF_FAME.md) says it means: features, hard bug fixes, deep refactors — not typo fixes, dep bumps, or trivial cleanups.

| Level | Title | Criteria |
|---|---|---|
| **L0** | Citizen | joined the community — zero barrier |
| **L1** | Squire | 1 merged substantive PR, **or** sustained issue triage / Discussions help |
| **L2** | Knight | land 3+ PRs that the maintainers consider substantive (features, hard bug fixes, deep refactors) → Hall of Fame row |
| **L3** | Baron / Baroness | land 5+ substantive PRs in one area over 3+ months, with demonstrated review judgement → merge rights (the [MAINTAINERS.md](./MAINTAINERS.md) gate; maintained adapters/providers count) |
| **L4** | Herald | sustained propagation — talks, integrations, content, community support — recognized and named by the Crown |
| **L5** | Peer of the Realm | organization or individual running a certified integration or field deployment |

Agents can climb too. A PR authored by (or with) an AI agent counts the same as any other — see [AGENTS.md](./AGENTS.md). The ledger records the account that signed the work.

## Rewards

| Level | Available now | When hub pricing ships | Phase 3 (owner-gated) |
|---|---|---|---|
| L1 Squire | ledger listing, welcome shout-out | — | — |
| L2 Knight | Hall of Fame row, early access to alphas | hub-key perk allowance | — |
| L3 Baron | merge rights, direct channel to the founder | gateway credits | — |
| L4 Herald | official voice, content amplified, event hosting | hosted-plan perks | — |
| L5 Peer | listing on mosadd.com, co-marketing | partner terms | revenue share (if ever offered) |

What we promise now is what exists now: recognition, rights, and access. Perks tied to hosted plans arrive when hub pricing ships (it is on the [roadmap](./docs/roadmap.md), unshipped). Anything financial beyond that is Phase 3 — see below — and is **not promised**.

## The three economic phases

**Phase 1 — the open ledger (now).** Non-financial. Contributions earn levels, levels earn recognition and rights. Everything is public in [HALL_OF_FAME.md](./HALL_OF_FAME.md) and machine-readable in `community/realm.json`.

**Phase 2 — infrastructure participation (as decentralization ships).** As the P2P direction lands (nwaku backbone — experimental, on the roadmap), community members will be able to run real pieces of the layer: mirrors, relays, nodes, failover domains. Participation is rewarded in kind — hub perks and the Herald/Peer track — not in cash.

**Phase 3 — a stake for co-creators (future, owner-gated).** The long-term intent is that the people who build and carry the layer hold a real stake in it. Any instrument that makes that true — equity-like, token-like, revenue-share — has serious legal weight (securities law; MiCA in the EU) and will be designed with counsel, announced by the Crown, and offered explicitly, or not at all. **Nothing on this page is an offer, a token, a promise of future value, or a basis for expecting one.** Contribute for Phase 1 and Phase 2; treat Phase 3 as intent, not contract.

## Succession & absorption-proofing

The fastest-growing open-source project of 2026 was captured without anyone buying it: everything — brand, accounts, roadmap, decisions — lived in one founder, so hiring the founder was acquiring the project. We are structured so that cannot work here:

- **The crown is not the infrastructure.** Vision and trademark sit with the founder; running code, merge rights, and credit sit with the realm. Hiring the founder does not transfer either side.
- **The rules survive the ruler.** Governance, this charter, and the RFC record are versioned in Git. A fork carries the rules (but not the name — see [TRADEMARK.md](./TRADEMARK.md)).

Hardening checklist — these are **owner actions**, listed openly so the community can hold the Crown to them:

- [ ] Move the repo from a personal account to a GitHub **organization** with 2+ owners
- [ ] Second owner on the npm `@mosadd` scope
- [ ] Registrar redundancy for the project domains
- [ ] Treasury with multiple signatories, once a treasury exists
- [ ] Evaluate a **Swiss Verein** (association) in Plan-les-Ouates to hold the trademark and domains
- [ ] Written succession plan (private), with a one-paragraph public summary added here once signed

## Level up now

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and pick a [`good first issue`](https://github.com/Hei33enberg/mosADD-OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
2. Say hello in [GitHub Discussions](https://github.com/Hei33enberg/mosADD-OS/discussions) or the mosADD community room (see [README → Contributing](./README.md#contributing)).
3. Bringing an agent? Start with [AGENTS.md](./AGENTS.md) — your agent can post its progress to the project's coordination channel while it works.

The ledger is waiting.
