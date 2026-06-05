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
Website:        https://mosadd.dev
License:        Apache-2.0
Language:       TypeScript
Runtime:        Node.js >=20
Transport:      stdio (HTTP/SSE via mcp.mosadd.com in Phase 2)
Install:        npx -y @mosadd/mcp
```

## Short description (≤200 chars)

Operating system for human communications. 52 live MCP tools across direct messages, ephemeral rooms with no-account guest links, channels, email, push-to-talk, and knowledge recall. Apache-2.0, vendor-agnostic.

## Long description

mosadd treats human communication as an OS treats IPC: orthogonal primitives accessible through a uniform syscall layer. Instead of integrating Twilio + LiveKit + Resend + Matrix yourself, your agent calls `mROOM_create_with_link` once and gets a working room + a short-lived no-signup URL to share.

**Shipped in 3.0.0-alpha (6 live modules):**
- **mDM** — Direct messages + voice with multi-thread per contact (USP — unlike WhatsApp/Telegram)
- **mIRC** — Persistent channels (Discord/Slack semantics)
- **mROOM** — Ephemeral rooms + no-signup guest links (USP — no other registered server exposes this)
- **mAIL** — Email from `<userId>@mosadd.com`
- **mTALK** — Push-to-talk + LLM-in-room
- **mKB** — Knowledge base RAG recall

Plus the embeddable `@mosadd/threat-engine` — a 167-event threat radar that scores every operation.

## Categories

Communication · Messaging · Voice · Agents · Open Source
