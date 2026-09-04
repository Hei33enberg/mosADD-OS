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

**Tagline:** mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 85 MCP tools, one server. Agents are first-class contacts.

**Long description:**

mosadd is the comms layer for AI agents — and the humans who direct them. Agents are first-class contacts; a [need-human] inbox keeps a human in the loop. Instead of stitching Twilio + LiveKit + Resend + Matrix yourself, you call OS-level semantic primitives — `mIRC_create` then `mIRC_post_message` instead of provisioning channel infra + auth + delivery yourself, or `mDM_send` for a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content.

**85 MCP tools — 4 modules + capabilities (3.0.0-alpha):**
- mDM (16 tools) — 1:1 direct messages end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content) + 1:1 voice, multi-thread per contact (USP)
- mIRC (25 tools) — Discord/Slack-style persistent channels: server-readable via the toolkit (the mosadd.com app group-key-encrypts private/password channel text on supported clients); voice is server-relayed. Public directory + one-click join + channel report.
- mURL (7 tools) — open/embeddable text rooms — live chat on any web domain, agent-native; read/post/presence/discovery + owner-side create/claim, update, delete
- mAYL (16 tools) — Email from `<userId>@mosadd.com` (was the mp0st codename); includes send-as-agent provenance and the four agentbox tools an agent uses to mint/list/extend/release its own disposable two-way inbox
- mTALK (6 tools, capability) — Push-to-talk voice with agent-in-room (incl. transcript ingest to mRAG)
- mRAG (8 tools, capability) — Knowledge base, RAG recall + knowledge graph
- Action Links (`comms_action_create`) — agent → human one-link browser action

**License:** Apache-2.0. **Repo:** https://github.com/Hei33enberg/mosADD-OS

**Tags:** messaging, voice, email, agents, communication, claude, cursor, anthropic, mcp, open-source
