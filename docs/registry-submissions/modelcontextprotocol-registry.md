# modelcontextprotocol/registry — submission draft

**Target repo:** https://github.com/modelcontextprotocol/registry
**Submission path:** `servers/community/mosadd-mcp.yaml` (or whatever the current schema expects — check repo README at submission time)

## Payload (YAML, draft)

```yaml
name: "@mosadd/mcp"
displayName: "mosadd — A human OS. Add."
description: |
  Operating system for human communications. Exposes mosadd OS modules
  (mDM, mIRC, mp0st, mTALK, mRAG) as MCP tools — 64 live tools across 5
  modules, plus a defensive threat-event classification engine. RFC 0001
  naming convention m<MODULE>_<operation>. Apache-2.0, vendor-agnostic by design.
homepage: "https://mosadd.com"
repository: "https://github.com/Hei33enberg/mosadd-os"
license: "Apache-2.0"
author:
  name: "mosadd contributors"
  url: "https://mosadd.com"
runtime:
  command: "npx"
  args: ["-y", "@mosadd/mcp"]
  env:
    MOSADD_SUPABASE_URL:
      description: "Supabase project URL (BYOK mode)"
      required: true
    MOSADD_SUPABASE_ANON_KEY:
      description: "Supabase anon key (BYOK mode)"
      required: true
    MOSADD_USER_JWT:
      description: "User session JWT (BYOK mode — Phase 2 replaces with OAuth)"
      required: true
tools:
  # mDM — Direct Messages
  - name: "mDM_list_contacts"
    description: "List the user's mosadd contacts"
  - name: "mDM_send"
    description: "Send a direct message (supports multi-thread per contact USP)"
  - name: "mDM_list"
    description: "Read DM thread history"
  - name: "mDM_respond_request"
    description: "Accept or reject an incoming DM request"
  # mIRC — Persistent channels
  - name: "mIRC_create"
    description: "Create a persistent Discord/Slack-style channel"
  - name: "mIRC_list"
    description: "List available channels"
  - name: "mIRC_get"
    description: "Get details of a single channel"
  - name: "mIRC_update"
    description: "Update channel metadata (owner only)"
  - name: "mIRC_delete"
    description: "Delete a channel (owner only)"
  # mp0st — Email
  - name: "mp0st_send"
    description: "Send email from <userId>@mosadd.com"
  - name: "mp0st_view"
    description: "Read an email by message_id"
  # threat — defensive threat-event classification engine
  - name: "threat_catalog"
    description: "Enumerate the defensive threat-event taxonomy"
  - name: "threat_classify"
    description: "Classify a communication-threat event (pure defensive, no surveillance)"
tags:
  - messaging
  - voice
  - email
  - agents
  - communication
  - open-source
  - apache-2
```

## PR description

> ## Add mosadd MCP server (`@mosadd/mcp`)
>
> mosadd is an operating system for human communications, distributed as an MCP server that exposes semantic primitives — `mDM` for 1:1 direct messages that are end-to-end encrypted by default (X3DH + Double Ratchet; the operator cannot read message content), `mIRC` for persistent channels, `mp0st` for email, `mTALK` for push-to-talk, `mRAG` for knowledge recall — through 64 tools today (more channels coming).
>
> **Repo:** https://github.com/Hei33enberg/mosadd-os
> **License:** Apache-2.0
> **Install:** `npx -y @mosadd/mcp`
>
> Differentiators:
> - **OS-level semantic primitives**, not vendor wrappers. RFC 0001 formalizes the `m<MODULE>_<operation>` naming convention.
> - **mDM_send** — single MCP call delivers a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet), so the operator cannot read message content. The same wire format is used by the mosadd app, so agent↔app DMs interoperate end-to-end.
> - **Vendor-agnostic provider abstraction** — same primitives work over Supabase today, with a forked LiveKit + nwaku (p2p) backbone in follow-ups. Bring your own keys or self-host.
> - **Defensive threat-event engine** — `threat_classify` is a pure, surveillance-free classifier over a communication-threat taxonomy (`threat_catalog`). It scores events you pass it; it does not monitor anyone.
>
> Happy to address any review comments. Maintainer contact: see CODEOWNERS in the repo.
