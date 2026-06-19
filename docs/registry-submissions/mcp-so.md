# mcp.so — submission draft

**Target:** https://mcp.so
**Method:** Submit via web form at https://mcp.so/submit, or PR to their repo (check landing page at submission time).

## Listing fields

```
Server name:    mosadd-mcp
Display name:   mosadd — A human OS. Add.
Author:         mosadd contributors
GitHub:         https://github.com/Hei33enberg/mosadd-os
NPM:            https://www.npmjs.com/package/@mosadd/mcp
Website:        https://mosadd.com
License:        Apache-2.0
Language:       TypeScript
Runtime:        Node.js >=20
Transport:      stdio (HTTP/SSE via mcp.mosadd.com in Phase 2)
Install:        npx -y @mosadd/mcp
```

## Short description (≤200 chars)

Operating system for human communications. 64 live MCP tools across end-to-end-encrypted direct messages with sealed sender, channels, email, push-to-talk, and knowledge recall. Apache-2.0, vendor-agnostic.

## Long description

mosadd treats human communication as an OS treats IPC: orthogonal primitives accessible through a uniform syscall layer. Instead of integrating Twilio + LiveKit + Resend + Matrix yourself, your agent calls `mIRC_create` then `mIRC_post_message` once and gets a working persistent channel — or `mDM_send` for an end-to-end-encrypted direct message where the relay never learns the sender (sealed sender).

**Shipped in 3.0.0-alpha (5 live modules):**
- **mDM** — End-to-end-encrypted direct messages with sealed sender + voice, multi-thread per contact (USP — unlike WhatsApp/Telegram)
- **mIRC** — Persistent channels (Discord/Slack semantics)
- **mp0st** — Email from `<userId>@mosadd.com`
- **mTALK** — Push-to-talk + LLM-in-room
- **mRAG** — Knowledge base RAG recall

Plus a pure defensive threat-event classification engine (`threat_catalog` / `threat_classify`) — classifies communication-threat events you feed it, with no surveillance.

## Categories

Communication · Messaging · Voice · Agents · Open Source
