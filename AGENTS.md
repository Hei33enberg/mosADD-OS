# AGENTS.md — contributing to mosadd-os as (or with) an AI agent

mosADD is the comms layer for AI agents — so agents are first-class **contributors** here, not just users. A PR authored by or with an agent counts the same as any other ([REALM.md](./REALM.md)); the ledger records the account that signed the work. This file is the deterministic context your agent needs.

## Build, test, verify

```bash
pnpm install --frozen-lockfile   # Node ≥20, pnpm ≥9
pnpm -r build                    # build all packages (emits dist/*.d.ts — typecheck needs it)
pnpm -r typecheck
pnpm -r test --if-present
pnpm lint
node scripts/check-skill-lint.mjs   # skills frontmatter + marketplace sync + version + honesty lint
```

These are the local quality gates — run them before every PR. The workflow files in [.github/workflows/](./.github/workflows/) encode the same checks, but **GitHub Actions is currently switched off for this repo** (a deliberate cost decision), so a green GitHub page proves nothing either way: maintainers re-run the gates locally on every PR before merging. **Build before typecheck** — `@mosadd/ai` needs `@mosadd/mcp`'s built declarations.

## Hard rules (reviewer-enforced — run the local gates above)

- **One concern per PR.** Conventional commits (`feat(mDM): …`). DCO sign-off (`git commit -s`). Tests for new code — cover the lines you changed (there is no automated coverage gate yet; reviewers check). Public-API changes must be called out explicitly in the PR description (a Changesets flow is planned but the tooling is not in this repo yet).
- **Tool naming:** `m<MODULE>_<operation>` snake_case per [RFC 0001](./docs/rfcs/0001-module-naming.md). New module or skill ⇒ RFC first ([CONTRIBUTING.md](./CONTRIBUTING.md)).
- **Encryption honesty:** mDM 1:1 is E2EE; **open** channels/rooms/mail are server-readable, and the mosadd.com app group-key-encrypts **private/password** channel **text** on supported clients (the toolkit posts server-readable today); **all channel voice is server-relayed (never E2EE)**. Never claim blanket encryption, never call open channels or any channel voice end-to-end — check every claim against [docs/security/e2ee-posture.md](./docs/security/e2ee-posture.md) ("What copy is allowed to say"). The honesty lint (`node scripts/check-skill-lint.mjs`) fails on banned blanket phrases — run it locally; maintainers run it on every PR.
- **Skills:** one directory per skill under `skills/`, `SKILL.md` with `name` + `description` frontmatter, registered in the root `.claude-plugin/marketplace.json` (plugin entry `mosadd`, plugin manifest at `skills/.claude-plugin/plugin.json`). `skills/coordinate/SKILL.md` is canonical and vendored byte-identical into the `mosadd-agent` repo — don't edit it casually.
- **Don't touch:** `pnpm-lock.yaml` by hand; `HALL_OF_FAME.md` between the `REALM:BEGIN/END` markers (generated); version strings (they're lint-synced across README ↔ skills/.claude-plugin/plugin.json ↔ packages/mcp).

## Spec-grade issues

Issues labeled `good-first-issue` are written so an agent can execute them deterministically: context, acceptance criteria, exact files, and the verify command. If an issue you're picking up lacks these, ask in the issue — don't guess scope.

## Coordinate while you work

This repo dogfoods its own layer. If your agent runs the [`mosadd-coordinate`](./skills/coordinate/SKILL.md) skill (or you install `@mosadd/mcp`), it can post status to the project's coordination channel while it works — plan, progress, blockers — so humans and other agents see it live. Use marker prefixes from the skill (`[claim]`, `[status]`, `[need-human]`, `[done]`).

## PR etiquette for agents

- State in the PR description that it was authored with an agent, and which one (there's a field in the template). This is celebrated, not penalized — agent-assisted merges make the digest leaderboard.
- Never fabricate benchmark numbers, test output, or links. Paste real command output.
- If a local gate fails, read the output and fix forward — the scripts are written to give you deterministic feedback. (GitHub Actions is off; don't wait for checks that will never run.)
