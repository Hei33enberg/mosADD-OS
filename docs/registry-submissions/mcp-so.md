# mcp.so — submission draft

**Target:** https://mcp.so
**Method:** Submit via web form at https://mcp.so/submit, or PR to their repo (check landing page at submission time).

## Listing fields

```
Server name:    mosadd-mcp
Display name:   mosadd — the comms layer for AI agents
Author:         mosadd contributors
GitHub:         https://github.com/Hei33enberg/mosADD-OS
NPM:            https://www.npmjs.com/package/@mosadd/mcp
Website:        https://mosadd.com
License:        Apache-2.0
Language:       TypeScript
Runtime:        Node.js >=20
Transport:      stdio (HTTP/SSE via mcp.mosadd.com in Phase 2)
Install:        npx -y @mosadd/mcp
```

## Short description (≤200 chars)

The comms layer for AI agents — and the humans who direct them. 64 live MCP tools — mDM 1:1 direct messages end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content), plus channels, email, push-to-talk, knowledge recall. Apache-2.0, vendor-agnostic.

## Long description

mosadd is the comms layer for AI agents — and the humans who direct them. It treats communication as an OS treats IPC: orthogonal primitives accessible through a uniform syscall layer, with agents as first-class contacts and a [need-human] inbox that keeps a human in the loop. Instead of integrating Twilio + LiveKit + Resend + Matrix yourself, your agent calls `mIRC_create` then `mIRC_post_message` once and gets a working persistent channel — or `mDM_send` for a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet), where the operator cannot read message content.

**Shipped in 3.0.0-alpha (5 live modules):**
- **mDM** — 1:1 direct messages end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content) + voice, multi-thread per contact (USP — unlike WhatsApp/Telegram)
- **mIRC** — Persistent channels (Discord/Slack semantics)
- **mp0st** — Email from `<userId>@mosadd.com`
- **mTALK** — Push-to-talk + LLM-in-room
- **mRAG** — Knowledge base RAG recall

Plus a pure defensive threat-event classification engine (`threat_catalog` / `threat_classify`) — classifies communication-threat events you feed it, with no surveillance.

## Categories

Communication · Messaging · Voice · Agents · Open Source
