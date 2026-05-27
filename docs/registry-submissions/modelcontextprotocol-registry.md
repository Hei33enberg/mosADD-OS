# modelcontextprotocol/registry — submission draft

**Target repo:** https://github.com/modelcontextprotocol/registry
**Submission path:** `servers/community/m0ssad-mcp.yaml` (or whatever the current schema expects — check repo README at submission time)

## Payload (YAML, draft)

```yaml
name: "@m0ssad/mcp"
displayName: "mosadd — A human OS. Add."
description: |
  Operating system for human communications. Exposes mosadd OS modules
  (mDM, mIRC, mROOM, mAIL today; mTALK / mCALL / mIRL / bridges in Phase 1
  follow-up) as MCP tools. 17 tools, RFC 0001 naming convention
  m<MODULE>_<operation>. Apache-2.0, vendor-agnostic by design.
homepage: "https://mosadd.dev"
repository: "https://github.com/Hei33enberg/mosadd-os"
license: "Apache-2.0"
author:
  name: "mosadd contributors"
  url: "https://mosadd.dev"
runtime:
  command: "npx"
  args: ["-y", "@m0ssad/mcp"]
  env:
    M0SSAD_SUPABASE_URL:
      description: "Supabase project URL (BYOK mode)"
      required: true
    M0SSAD_SUPABASE_ANON_KEY:
      description: "Supabase anon key (BYOK mode)"
      required: true
    M0SSAD_USER_JWT:
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
  # mROOM — Ephemeral private rooms
  - name: "mROOM_create"
    description: "Create an ephemeral private room with TTL"
  - name: "mROOM_create_guest_link"
    description: "USP: short-lived no-signup join URL for non-mosadd users"
  - name: "mROOM_join"
    description: "Join an existing private room"
  - name: "mROOM_leave"
    description: "Leave a private room"
  - name: "mROOM_close"
    description: "Close a private room (founder only)"
  - name: "mROOM_list"
    description: "List rooms the user belongs to"
  # mAIL — Email
  - name: "mAIL_send"
    description: "Send email from <userId>@mosadd.com"
  - name: "mAIL_view"
    description: "Read an email by message_id"
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

> ## Add mosadd MCP server (`@m0ssad/mcp`)
>
> mosadd is an operating system for human communications, distributed as an MCP server that exposes semantic primitives — `mDM` for direct messages, `mROOM` for ephemeral rooms with guest links, `mIRC` for persistent channels, `mAIL` for email — through 17 tools today (more channels coming).
>
> **Repo:** https://github.com/Hei33enberg/mosadd-os
> **License:** Apache-2.0
> **Install:** `npx -y @m0ssad/mcp`
>
> Differentiators:
> - **OS-level semantic primitives**, not vendor wrappers. RFC 0001 formalizes the `m<MODULE>_<operation>` naming convention.
> - **mROOM_create_guest_link** — single MCP call generates a short-lived no-signup join URL. To my knowledge no other registered server exposes this.
> - **Vendor-agnostic provider abstraction** — same primitives work over Supabase today, LiveKit fork + Telnyx (PSTN) + nwaku (p2p) + Dendrite (Matrix federation) in Phase 1 follow-up.
> - **Threat-radar middleware** hooks (167-event taxonomy) — emitted from every operation, scored server-side by the commercial hub (Phase 2).
>
> Happy to address any review comments. Maintainer contact: see CODEOWNERS in the repo.
