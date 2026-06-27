# @mosadd/mcp

MCP server for [mosADD](https://mosadd.com) — **the comms layer for AI agents and the humans who direct them.** Exposes the OS modules (m\*) — **mDM (1:1 E2EE), mIRC (in-app channels), mURL (open/embeddable text rooms), and mAYL (email 3.0)** — as Model Context Protocol tools so any agent runtime can talk to mosadd: Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, Bolt, Goose, Manus, custom.

> **3.0.0-alpha.23** — **61 live tools across 5 live modules** (mDM incl. voice + files, mIRC, mp0st, mTALK, mRAG) + agent→user action links + the `comms_capabilities` discovery tool + the defensive `threat_*` engine, wired to the mosADD backend (BYOK) as a strangler-fig step. Phase 2 routes through the hosted gateway at `mcp.mosadd.com` with the 166-event radar in front.

## Connect your agent

Three ways to authenticate, friendliest first — all three end with the same ~61 tools.

### 1. `mosadd login` — recommended (one command, stays logged in)

Sign in once; the session is saved to `~/.mosadd/session.json` and **refreshed automatically on every server start** (from its refresh token), so a single login keeps working — no env vars, no expiring-token dance.

```bash
npx -y @mosadd/mcp@alpha login
# prompts for your Supabase URL + anon key (both public) and your mosADD email + password
```

Then register the server with **no env block**:

```bash
# Claude Code
claude mcp add mosadd -- npx -y @mosadd/mcp@alpha
```

```json
// Claude Desktop / Cursor / Cline / Windsurf — mcpServers config, no env needed
{
  "mcpServers": {
    "mosadd": { "command": "npx", "args": ["-y", "@mosadd/mcp@alpha"] }
  }
}
```

`npx @mosadd/mcp@alpha whoami` shows who you're signed in as; `… logout` clears it.

### 2. `MOSADD_API_KEY` — headless / CI (one long-lived key)

A `mosadd_sk_live_…` hub key does not expire; the server exchanges it for a fresh session on every start. Best for servers, cron, and our own `mosadd-agent`.

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@mosadd/mcp@alpha"],
      "env": { "MOSADD_API_KEY": "mosadd_sk_live_…" }
    }
  }
}
```

Mint a key at **[mosadd.com/keys](https://mosadd.com/keys)** — the hub shows it once, in the `mosadd_sk_live_…` format above. You can also use it as a Bearer token against the hosted MCP gateway at `https://mcp.mosadd.com/mcp`.

### 3. BYOK + `MOSADD_USER_JWT` — advanced / debugging

Bring your own Supabase URL + anon key + a raw session token. **The JWT expires (~1h)** — prefer option 1 or 2 for anything ongoing.

- `MOSADD_SUPABASE_URL` — your Supabase project URL (e.g. `https://abc.supabase.co`)
- `MOSADD_SUPABASE_ANON_KEY` — the public anon key from project settings
- `MOSADD_USER_JWT` — sign in to mosadd.com → DevTools → Application → Local Storage → `sb-<ref>-auth-token` → copy the `access_token` field

In Phase 2 the hosted gateway at `mcp.mosadd.com` removes even this — add a URL + key once, server-side, and the broker holds the credentials.

## Tools shipped in alpha

**61 live tools across 5 live modules** (mDM, mIRC, mp0st, mTALK, mRAG) + agent→user action links + the `comms_capabilities` discovery tool + the defensive `threat_*` engine. Highlights per module:

| Module | Tools | What it does |
|---|---|---|
| **mDM** (14) | `mDM_list_contacts`, `mDM_send`, `mDM_send_unencrypted`, `mDM_edit`, `mDM_delete`, `mDM_list`, `mDM_publish_keys`, `mDM_respond_request`, `mDM_call_start/answer/end`, `mDM_voice_note`, `mDM_send_voice`, `mDM_send_file` | 1:1 text, voice notes, calls + file/voice attachments. Multi-thread per contact. `mDM_send` is end-to-end encrypted by default (X3DH / Double Ratchet, `mosadd.e2ee.v2`); the operator cannot read message content |
| **mIRC** (22) | `mIRC_create/list/get/update/delete`, member RBAC (`mIRC_join/leave/kick/ban/unban/set_role/set_ptt/approve_request/reject_request/request_access`), `mIRC_post_message`, `mIRC_list_messages`, edge (`mIRC_mint_channel_token`, `mIRC_send_edge`, `mIRC_history_edge`), `mIRC_send_voice/file` | Persistent Discord/Slack-style channels + the agent-coordination edge transport |
| **mp0st** (11) | `mp0st_send`, `mp0st_view`, `mp0st_list`, `mp0st_delete`, `mp0st_stats`, `mp0st_events`, `mp0st_metrics`, `mp0st_revoke`, `mp0st_audit_export`, `mp0st_consent`, `mp0st_notify` | Mail; every user gets `<id>@mosadd.com`. `mp0st_revoke` recalls secure-reader access; `mp0st_audit_export` emits an HMAC-SHA256-signed engagement audit; `mp0st_consent` manages recipient tracking opt-outs (GDPR); `mp0st_notify` pulls the inbound-mail feed |
| **mTALK** (5) | `mTALK_open`, `mTALK_join`, `mTALK_press`, `mTALK_release`, `mTALK_state` | Half-duplex push-to-talk: one speaker, FIFO queue, anti-hog auto-release |
| **mRAG** (4) | `mRAG_ingest`, `mRAG_search`, `mRAG_list_sources`, `mRAG_delete` | RAG recall over the user's own data (hybrid vector + BM25) |
| **comms_** (3) | `comms_action_create`, `comms_action_frame_get`, `comms_capabilities` | `comms_action_create` mints an agent→user one-link browser action (Tier 1); `comms_action_frame_get` fetches a framed action; `comms_capabilities` is one-call discovery of every tool's transport `requires` flag |
| **threat_** (2) | `threat_catalog`, `threat_classify` | Pure defensive threat-event classification engine — enumerate the catalog and classify an operation against it |

Counts by module prefix sum to **56 channel tools**; the 3 `comms_*` tools and 2 `threat_*` tools make **61 callable** in total. `mCALL` (telephony), `mROOM`, `mURL` — and the `mp0st_send_as_agent` provenance, `mTALK_ingest_ptt` PTT-ingest, and `comms_embed_create` (embed-keys EF undeployed) scaffolds — exist in the source but are **not registered**, so agents only ever see tools that actually work.

All tool names follow [RFC 0001](https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>` snake_case.

## Try it (60-second demo)

In Claude Code with env vars set:

> List my mosadd contacts.

Claude calls `mDM_list_contacts` → you see your contact list.

> Send "hello from Claude" to <id> with thread label `notes`.

Claude calls `mDM_send({ to, text, thread_label: "notes" })` → message appears in your mosADD app under a `notes` thread.

## Architecture

```
Agent (Claude / Cursor / ...)
        │
        │ stdio MCP
        ▼
@mosadd/mcp server  (this package)
        │
        │ supabase.functions.invoke('message-send', ...)
        │ + Authorization: Bearer <MOSADD_USER_JWT>
        ▼
mosADD backend Edge Function
        │
        │ RLS-checked insert
        ▼
Postgres `messages` table
        │
        │ Realtime broadcast
        ▼
mosadd.com app (receiver)
```

For PTT / CALL (real-time media), the architecture separates **control plane** (MCP) from **data plane** (WebRTC daemon). See [docs/architecture/control-data-plane.md](https://github.com/Hei33enberg/mosadd-os/blob/main/docs/architecture/control-data-plane.md) when it lands.

## Configuration via env vars

| Env | Description | Required |
|---|---|---|
| `MOSADD_SUPABASE_URL` | Supabase project URL — DM / IRC / mail / KB backend | yes (BYOK) |
| `MOSADD_SUPABASE_ANON_KEY` | Supabase anon key | yes (BYOK) |
| `MOSADD_USER_JWT` | User session token | yes (for tools that touch user data) |
| `MOSADD_RESEND_API_KEY` | Resend API key — enables `mp0st` outbound | no (mp0st disabled if unset) |
| `MOSADD_LIVEKIT_URL` | LiveKit `wss://…` URL — enables `mTALK` voice | no (voice disabled if unset) |
| `MOSADD_LIVEKIT_API_KEY` | LiveKit API key | no (with `…_URL` / `…_API_SECRET`) |
| `MOSADD_LIVEKIT_API_SECRET` | LiveKit API secret | no |
| `MOSADD_API_KEY` | Hub API key (Phase 2 hosted mode) | no |
| `MOSADD_HUB_URL` | Override hub url | no |
| `MOSADD_MODE` | `local` / `cloud` / `self-host` | no (auto-detected) |
| `MOSADD_LOG_LEVEL` | `debug` / `info` / `warn` / `error` | no (default `info`) |

Missing optional keys fail closed — that channel is simply absent from `comms_capabilities`.

## License

Apache-2.0. See repo [LICENSE](https://github.com/Hei33enberg/mosadd-os/blob/main/LICENSE) and [NOTICE](https://github.com/Hei33enberg/mosadd-os/blob/main/NOTICE).
