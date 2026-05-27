# Examples

Quickstart configs for the agent runtimes that consume `@m0ssad/mcp`.

| Folder | Runtime | Transport |
|---|---|---|
| [`claude-code/`](claude-code/) | Claude Code | stdio (local) |
| [`cursor/`](cursor/) | Cursor | stdio (local) |
| [`chatgpt-apps/`](chatgpt-apps/) | ChatGPT Apps | HTTP/SSE (hosted via Phase 2 `mcp.mosadd.com`) |
| [`vercel-ai/`](vercel-ai/) | Vercel AI SDK (Node.js) | in-process via `@m0ssad/ai/vercel` |
| [`langchain/`](langchain/) | LangChain (Node.js) | in-process via `@m0ssad/ai/langchain` |
| [`anthropic/`](anthropic/) | Anthropic SDK (Node.js) | in-process via `@m0ssad/ai/anthropic` |

## Other runtimes

- **Windsurf**: same as Cursor — drop `mcp.json` in `~/.codeium/windsurf/mcp.json`.
- **Cline**: same shape as Cursor — Cline reads `~/.cline/mcp_servers.json`.
- **Goose**: edit `~/.config/goose/profiles.yaml`, add an MCP entry pointing at `npx -y @m0ssad/mcp`.
- **Bolt / Lovable / v0.dev**: HTTP/SSE only — wait for `mcp.mosadd.com` or self-host the bridge in `chatgpt-apps/README.md`.
- **Custom Anthropic/OpenAI agent**: use `@m0ssad/ai/anthropic`, `@m0ssad/ai/openai`, etc. — adapters via subpath exports (Phase 1 follow-up, [LINEAR-2153](https://linear.app/ip-ra/issue/LINEAR-2153)).

## What you get

17 MCP tools across 4 channels:

- **mDM** (4): list_contacts, send, list, respond_request
- **mIRC** (5): create, list, get, update, delete
- **mROOM** (6): create, create_guest_link ★, join, leave, close, list
- **mAIL** (2): send, view

All names follow [RFC 0001](../docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>`. Full reference: [packages/mcp/README.md](../packages/mcp/README.md).
