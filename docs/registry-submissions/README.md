# MCP registry submissions

> **STAN 2026-09-04.** Kanał podstawowy jest ZAŁATWIONY: mosADD siedzi w **oficjalnym rejestrze MCP**
> jako `com.mosadd/mosadd-mcp` (status `active`, `remotes: https://mcp.mosadd.com/mcp`) — jak i dlaczego,
> patrz [PUBLISHED-official-registry.md](./PUBLISHED-official-registry.md).
>
> Glama, mcp.so, Smithery, PulseMCP i mcpservers.org **indeksują się z tego rejestru same**, więc szkice
> w tym folderze są od dziś **awaryjne**: użyj ich tylko dla katalogu, którego po ~24 h od publikacji
> nadal w nim nie ma. Zmierzone 04.09 11:00 UTC (11 h po publikacji): żaden jeszcze nie zassał —
> to jest normalne, ich indeksery chodzą własnym rytmem. Sprawdź ponownie, zanim zaczniesz wypełniać
> formularze.
>
> ⛔ Szkice niosą liczby z sierpnia (69–77 narzędzi, alpha.20). Dziś jest **85** i **alpha.47**.
> Każdy ma o tym baner na górze — przelicz przed wysyłką.
>
> ⛔ Katalog konektorów w samym Claude to ODDZIELNA sprawa, która NIE czyta rejestru MCP:
> [claude-connectors-directory.md](./claude-connectors-directory.md). Blokuje ją plan konta, nie kod.

`@mosadd/mcp` is on npm at **`@mosadd/mcp@alpha.20`** (live, no longer waiting on a publish token); submit it to the major MCP registries so people can discover it. GitHub repo `Hei33enberg/mosADD-OS` is now indexable (description rewritten post-pivot + 13 topics added 2026-06-22 incl. `mcp`, `model-context-protocol`, `e2ee`, `ai-agents`, `claude`, `anthropic`, `cursor`) — Glama auto-indexes from GitHub when MCP-compatible metadata is present, so this materially helps discovery before any explicit submission.

| Registry | URL | Method | Status |
|---|---|---|---|
| **Official MCP Registry** | https://github.com/modelcontextprotocol/registry | PR to `servers/` | Draft ready ([entry.md](./modelcontextprotocol-registry.md)) |
| **mcp.so** | https://mcp.so | Auto-detect from GitHub (claim via PR or web form) | Draft ready ([entry.md](./mcp-so.md)) |
| **Smithery** | https://smithery.ai | Auto-detect — connect GitHub, runs metadata extraction | Draft ready ([entry.md](./smithery.md)) |
| **Glama** | https://glama.ai/mcp/servers | Auto-detect or PR | Draft ready ([entry.md](./glama.md)) |
| **mcpservers.org** | https://mcpservers.org | PR to repo | Draft ready ([entry.md](./mcpservers-org.md)) |
| **Anthropic plugins** | https://github.com/anthropics/claude-plugins-official | PR after beta period | Wait for ≥10 GitHub stars first |

## Workflow per submission

1. After `pnpm publish` succeeds and the version is live on npmjs.com
2. Open a PR per registry using the prepared `entry.md` content as the payload
3. Track responses; respond to maintainer questions within 24 h
4. Update `docs/registry-submissions/<registry>.md` with the merged PR URL

## Shared submission payload

Most registries want the same fields. Keep these consistent:

- **Name**: `@mosadd/mcp`
- **Display name**: `mosadd — the comms layer for AI agents`
- **One-liner**: `mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 77 MCP tools, one server. Agents are first-class contacts.`
- **Repo**: `https://github.com/Hei33enberg/mosADD-OS`
- **License**: `Apache-2.0`
- **Author**: `mosadd contributors`
- **Homepage**: `https://mosadd.com`
- **Install**: `npx -y @mosadd/mcp`
- **Tags**: `messaging`, `voice`, `email`, `agents`, `apache-2`, `open-source`
- **OS modules listed**: mDM (alpha — 1:1 DMs end-to-end encrypted by default, X3DH + Double Ratchet, operator cannot read content; USP), mIRC (alpha), mURL (alpha — open/embeddable text rooms), mAYL (alpha — email 3.0; was mp0st); plus capabilities mTALK (PTT voice) and mRAG (knowledge recall)
