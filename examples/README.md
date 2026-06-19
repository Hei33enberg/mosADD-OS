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
| [`hermes/`](hermes/) | Hermes Agent (long-running gateway / Docker / VPS) | stdio (local) |

## Other runtimes

- **Windsurf**: same as Cursor — drop `mcp.json` in `~/.codeium/windsurf/mcp.json`.
- **Cline**: same shape as Cursor — Cline reads `~/.cline/mcp_servers.json`.
- **Goose**: edit `~/.config/goose/profiles.yaml`, add an MCP entry pointing at `npx -y @mosadd/mcp`.
- **Bolt / Lovable / v0.dev**: HTTP/SSE only — wait for `mcp.mosadd.com` or self-host the bridge in `chatgpt-apps/README.md`.
- **Custom Anthropic/OpenAI agent**: use `@mosadd/ai/anthropic`, `@mosadd/ai/openai`, etc. — adapters via subpath exports (Phase 1 follow-up, [LINEAR-2153](https://linear.app/ip-ra/issue/LINEAR-2153)).

## What you get

**64 live MCP tools across 5 live channel modules** (+ comms + the defensive threat engine):

- **mDM** (14): list_contacts, publish_keys, send, send_unencrypted, edit, delete, list, respond_request + voice ops — E2EE DMs with sealed sender
- **mIRC** (22): create, list, get, update, delete, join, request_access, leave, approve_request, reject_request, kick, ban, unban, set_role, set_ptt, post_message, list_messages + admin ops
- **mp0st** (12): send, view, list, delete, stats, events, metrics, revoke, audit_export, consent, notify, send_as_agent
- **mTALK** (6): open, join, press, release, state — half-duplex push-to-talk
- **mRAG** (4): ingest, search, list_sources, delete — RAG recall over your own data
- **comms** (4): comms_action_create, comms_action_frame_get, comms_capabilities, comms_embed_create
- **threat** (2): threat_catalog, threat_classify — pure defensive threat-event classification engine

All names follow [RFC 0001](../docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>`. Full reference: [packages/mcp/README.md](../packages/mcp/README.md).
