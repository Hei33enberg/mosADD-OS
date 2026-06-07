# Examples

Quickstart configs for the agent runtimes that consume `@mosadd/mcp`.

| Folder | Runtime | Transport |
|---|---|---|
| [`claude-code/`](claude-code/) | Claude Code | stdio (local) |
| [`cursor/`](cursor/) | Cursor | stdio (local) |
| [`chatgpt-apps/`](chatgpt-apps/) | ChatGPT Apps | HTTP/SSE (hosted via Phase 2 `mcp.mosadd.com`) |
| [`vercel-ai/`](vercel-ai/) | Vercel AI SDK (Node.js) | in-process via `@mosadd/ai/vercel` |
| [`langchain/`](langchain/) | LangChain (Node.js) | in-process via `@mosadd/ai/langchain` |
| [`anthropic/`](anthropic/) | Anthropic SDK (Node.js) | in-process via `@mosadd/ai/anthropic` |

## Other runtimes

- **Windsurf**: same as Cursor — drop `mcp.json` in `~/.codeium/windsurf/mcp.json`.
- **Cline**: same shape as Cursor — Cline reads `~/.cline/mcp_servers.json`.
- **Goose**: edit `~/.config/goose/profiles.yaml`, add an MCP entry pointing at `npx -y @mosadd/mcp`.
- **Bolt / Lovable / v0.dev**: HTTP/SSE only — wait for `mcp.mosadd.com` or self-host the bridge in `chatgpt-apps/README.md`.
- **Custom Anthropic/OpenAI agent**: use `@mosadd/ai/anthropic`, `@mosadd/ai/openai`, etc. — adapters via subpath exports (Phase 1 follow-up, [LINEAR-2153](https://linear.app/ip-ra/issue/LINEAR-2153)).

## What you get

**64 live MCP tools across 7 modules** (+ the `comms_capabilities` discovery tool):

- **mDM** (12): list_contacts, publish_keys, send, send_unencrypted, edit, delete, list, respond_request + 4 voice ops
- **mIRC** (20): create, list, get, update, delete, join, request_access, leave, approve_request, reject_request, kick, ban, unban, set_role, set_ptt, post_message, list_messages + admin ops
- **mROOM** (9): create, create_guest_link ★, join, leave, close, list, send_message, list_messages + admin
- **mTALK** (5): open, join, press, release, state — half-duplex push-to-talk
- **mAIL** (11): send, view, list, delete, stats, events, metrics, revoke, audit_export, consent, notify
- **mRAG** (4): ingest, search, list_sources, delete — RAG recall over your own data
- **mURL** (3): read_channel, post, presence — real-time chat attached to any web domain, agent-native

All names follow [RFC 0001](../docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>`. Full reference: [packages/mcp/README.md](../packages/mcp/README.md).
