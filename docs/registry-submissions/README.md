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
- **One-liner**: `The comms layer for AI agents — and the humans who direct them. mDM · mIRC · mp0st · mTALK · mRAG — 64 live tools across 5 modules, one MCP server.`
- **Repo**: `https://github.com/Hei33enberg/mosADD-OS`
- **License**: `Apache-2.0`
- **Author**: `mosadd contributors`
- **Homepage**: `https://mosadd.com`
- **Install**: `npx -y @mosadd/mcp`
- **Tags**: `messaging`, `voice`, `email`, `agents`, `apache-2`, `open-source`
- **OS modules listed**: mDM (alpha — 1:1 DMs end-to-end encrypted by default, X3DH + Double Ratchet, operator cannot read content; USP), mIRC (alpha), mp0st (alpha), mTALK (alpha — PTT), mRAG (alpha — RAG); plus a defensive threat-event engine (`threat_catalog` / `threat_classify`)
