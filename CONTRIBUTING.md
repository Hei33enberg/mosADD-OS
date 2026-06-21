# Contributing to mosadd

We're building **the comms layer for AI agents — and the humans who direct them**. We welcome contributions of any size — bug reports, feature ideas, code, docs, RFCs, providers, skills, examples.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Quick start (dev setup)

```bash
git clone https://github.com/Hei33enberg/mosadd-os.git
cd mosadd-os
pnpm install
pnpm build
pnpm test
```

You need Node ≥20 and pnpm ≥9.

## How to contribute

### Reporting bugs

Open an issue using the **Bug Report** template. Include:
- Reproduction steps
- Expected vs actual behavior
- mosadd version (`pnpm list @mosadd/mcp`)
- Node version and OS

### Proposing a new `m*` module

This is a **major contribution**. Follow the RFC process:

1. Open an issue with title `RFC: m{NAME}` describing the use case
2. After community input, copy [`docs/rfcs/0000-template.md`](./docs/rfcs/0000-template.md) to `docs/rfcs/0XXX-m{NAME}.md`
3. Open a PR for the RFC. We do **lazy consensus** — silence for 3 business days = approval
4. After RFC is merged, implementation PR can land

### Pull requests

- **One concern per PR.** Don't mix refactors with features.
- **Conventional commits** for messages: `feat(mDM): add multi-thread support`
- **Changeset required.** Run `pnpm changeset` and pick the semver bump. PRs without changesets are blocked.
- **DCO sign-off.** Add `Signed-off-by: Your Name <email>` to commits (use `git commit -s`).
- **Tests required** for new code. Coverage threshold 90% on changed lines.
- **Lint clean.** `pnpm lint` must pass.
- **Type-check clean.** `pnpm typecheck` must pass.

### Adding a provider

Providers live in `packages/providers/`. Each provider implements one of the channel interfaces (`DmProvider`, `RoomProvider`, `CallProvider`, ...).

See `packages/providers/README.md` for the contract and reference implementation.

## Architecture

See [`docs/architecture/`](./docs/architecture/) for design docs:
- [`human-os.md`](./docs/architecture/human-os.md) — the OS framing rationale
- [`phase-2-hub.md`](./docs/architecture/phase-2-hub.md) — Phase 2 hub architecture
- [`phase-3-shells.md`](./docs/architecture/phase-3-shells.md) — Phase 3 shells architecture

Additional architecture docs (control-data-plane, fork-strategy, identity-recovery, anti-abuse, threat-radar) are TODO — see the index.

## Communication

- **GitHub Discussions** — design questions, ideas
- **GitHub Issues** — bugs, RFCs, concrete proposals
- **Discord** (link in README) — chat, help, real-time coordination

## License

By contributing, you agree that your contributions will be licensed under Apache-2.0, the same as the project. Patent grant applies.

## Recognition

Maintainers per channel are listed in [`GOVERNANCE.md`](./GOVERNANCE.md). A `CONTRIBUTORS.md` will be generated for the first stable release.
