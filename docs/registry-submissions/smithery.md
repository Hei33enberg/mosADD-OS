# Smithery (smithery.ai) — submission draft

**Target:** https://smithery.ai
**Method:** Connect GitHub via Smithery dashboard. Smithery auto-detects MCP servers from repo metadata. Optionally claim/customize the listing via `smithery.yaml`.

## smithery.yaml (drop in repo root after publish)

```yaml
startCommand:
  type: stdio
  command: npx
  args: ["-y", "@mosadd/mcp"]
  configSchema:
    type: object
    properties:
      MOSADD_SUPABASE_URL:
        type: string
        title: "Supabase project URL"
        description: "Your mosadd Supabase project URL"
      MOSADD_SUPABASE_ANON_KEY:
        type: string
        title: "Supabase anon key"
        description: "Anon (public) key from Supabase project settings"
      MOSADD_USER_JWT:
        type: string
        title: "User session JWT"
        description: "Your mosadd session token (Phase 2 replaces this with a hub key minted at mosadd.com/keys)"
        format: password
    required:
      - MOSADD_SUPABASE_URL
      - MOSADD_SUPABASE_ANON_KEY
      - MOSADD_USER_JWT
```

## Listing copy

**Title:** mosadd — the comms layer for AI agents

**Tagline:** The comms layer for AI agents — and the humans who direct them. mDM 1:1 end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content — plus channels, email, push-to-talk, knowledge recall — 64 tools today.

**Long description:**

mosadd is the comms layer for AI agents — and the humans who direct them. Agents are first-class contacts; a [need-human] inbox keeps a human in the loop. Instead of stitching Twilio + LiveKit + Resend + Matrix yourself, you call OS-level semantic primitives — `mIRC_create` then `mIRC_post_message` instead of provisioning channel infra + auth + delivery yourself, or `mDM_send` for a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content.

**64 live tools across 5 live modules (3.0.0-alpha):**
- mDM (14 tools) — 1:1 direct messages end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content) + 1:1 voice, multi-thread per contact (USP)
- mIRC (22 tools) — Discord/Slack-style persistent encrypted channels
- mTALK (6 tools) — Push-to-talk voice with agent-in-room
- mp0st (12 tools) — Email from `<userId>@mosadd.com`
- mRAG (4 tools) — Encrypted knowledge base, RAG recall
- Action Links (`comms_action_create`) — agent → human one-link browser action

Plus a pure defensive threat-event classification engine (`threat_catalog` / `threat_classify`) — classify communication-threat events without any surveillance.

**License:** Apache-2.0. **Repo:** https://github.com/Hei33enberg/mosADD-OS

**Tags:** messaging, voice, email, agents, communication, claude, cursor, anthropic, mcp, open-source, threat-classification
