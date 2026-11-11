# Community

How to take part in **mosADD OS**, the MIT client for the agentic messenger. The charter is [REALM.md](../REALM.md). The docs-site copy is [docs/realm.md](../docs/realm.md).

## Surfaces that exist

[community/surfaces.json](./surfaces.json) is the allow-list. Docs may only point at rooms listed there.

| Surface | URL |
|---|---|
| GitHub Discussions | https://github.com/Hei33enberg/mosADD-OS/discussions |
| GitHub Issues | https://github.com/Hei33enberg/mosADD-OS/issues |

There is no Discord, and no other official chat. A vulnerability goes to [SECURITY.md](../SECURITY.md), privately.

## What to open an issue about

The installer (`packages/m0s`), the tool definitions (`packages/mcp`), Irondome (`packages/threat-engine`), the examples, the skills, and the docs.

The hub at `mcp.mosadd.dev` is not in this repository. A pull request cannot change its meters, its database, or who it bills. Say what you observed (`initialize`, `tools/list`, a status code) and the date.

## Ledger

[realm.json](./realm.json) records levels. The founder is `crown`, off the ladder. Everyone else:

| Level | Title |
|---|---|
| L1 | Squire — one substantive merged pull request |
| L2 | Knight — three or more |
| L3 | Baron / Baroness — maintainer |
| L4 | Herald — named by the Crown |
| L5 | Peer of the Realm — a certified integration |

"Substantive" is a feature, a hard fix, or a deep refactor. The label on the pull request is what the ledger job counts. The human list is [HALL_OF_FAME.md](../HALL_OF_FAME.md).

## Before you send the pull request

- [docs/words.md](../docs/words.md): Irondome classifies, it does not "detect 193 threats."
- Hub **0.3.9** / 103 tools (measured 2026-11-11) is not `@mosadd/mcp` **3.0.0-alpha.56** / 85 tools, and not installer **0.3.1**.
- Do not add a page that pretends to be the mosadd.com marketing site. The app has its own plans. This repo documents the client and the hub contract.
- No keys in the diff. Placeholders only.

[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) · [LICENSE](../LICENSE) (MIT since 2026-09-29; older releases were Apache-2.0)
