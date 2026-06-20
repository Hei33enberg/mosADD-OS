# MCP registry submissions

Once `@mosadd/mcp` is on npm (currently dry-run-ready, waiting on the publish token), submit it to the major MCP registries so people can discover it.

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
- **Display name**: `mosadd — A human OS. Add.`
- **One-liner**: `Operating system for human communications. mDM · mIRC · mp0st · mTALK · mRAG — 64 live tools across 5 modules, one MCP server.`
- **Repo**: `https://github.com/Hei33enberg/mosadd-os`
- **License**: `Apache-2.0`
- **Author**: `mosadd contributors`
- **Homepage**: `https://mosadd.com`
- **Install**: `npx -y @mosadd/mcp`
- **Tags**: `messaging`, `voice`, `email`, `agents`, `apache-2`, `open-source`
- **OS modules listed**: mDM (alpha — 1:1 DMs end-to-end encrypted by default, X3DH + Double Ratchet, operator cannot read content; USP), mIRC (alpha), mp0st (alpha), mTALK (alpha — PTT), mRAG (alpha — RAG); plus a defensive threat-event engine (`threat_catalog` / `threat_classify`)
