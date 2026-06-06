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
        description: "Your mosadd session token (Phase 2 replaces with OAuth via hub.mosadd.com)"
        format: password
    required:
      - MOSADD_SUPABASE_URL
      - MOSADD_SUPABASE_ANON_KEY
      - MOSADD_USER_JWT
```

## Listing copy

**Title:** mosadd — A human OS. Add.

**Tagline:** Operating system for human communications. DMs, rooms with guest links, channels, email, push-to-talk, knowledge recall — 52 tools today.

**Long description:**

mosadd is the OS for human communications: instead of stitching Twilio + LiveKit + Resend + Matrix yourself, you call OS-level semantic primitives — `mROOM.create_with_link` instead of provisioning a LiveKit room + generating a JWT + emailing the URL + signing the alias.

**52 live tools across 6 live modules (3.0.0-alpha):**
- mDM (12 tools) — Encrypted direct messages + 1:1 voice, multi-thread per contact (USP)
- mIRC (20 tools) — Discord/Slack-style persistent encrypted channels
- mROOM (9 tools) — Ephemeral rooms with no-account guest join links (USP)
- mTALK (5 tools) — Push-to-talk voice with agent-in-room
- mAIL (4 tools) — Email from `<userId>@mosadd.com`
- mRAG (2 tools) — Encrypted knowledge base, RAG recall

Plus the embeddable `@mosadd/threat-engine` — a 167-event threat radar.

**License:** Apache-2.0. **Repo:** https://github.com/Hei33enberg/mosadd-os

**Tags:** messaging, voice, email, agents, communication, claude, cursor, anthropic, mcp, open-source
