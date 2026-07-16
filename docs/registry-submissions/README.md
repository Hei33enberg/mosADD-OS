# MCP registry submissions

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
- **One-liner**: `mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 68 MCP tools, one server. Agents are first-class contacts.`
- **Repo**: `https://github.com/Hei33enberg/mosADD-OS`
- **License**: `Apache-2.0`
- **Author**: `mosadd contributors`
- **Homepage**: `https://mosadd.com`
- **Install**: `npx -y @mosadd/mcp`
- **Tags**: `messaging`, `voice`, `email`, `agents`, `apache-2`, `open-source`
- **OS modules listed**: mDM (alpha — 1:1 DMs end-to-end encrypted by default, X3DH + Double Ratchet, operator cannot read content; USP), mIRC (alpha), mURL (alpha — open/embeddable text rooms), mAYL (alpha — email 3.0; was mp0st); plus capabilities mTALK (PTT voice) and mRAG (knowledge recall)
