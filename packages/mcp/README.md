# @mosadd/mcp

MCP server for [mosadd](https://mosadd.dev) — exposes the OS modules (m\*) as Model Context Protocol tools so any agent runtime can talk to mosadd: Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, Bolt, Goose, Manus, custom.

> **3.0.0-alpha.4** — **52 live tools across 6 live modules** (mDM incl. voice, mIRC, mROOM, mAIL, mTALK, mKB) + the `comms_capabilities` discovery tool, wired to the mosadd backend (BYOK) as a strangler-fig step. The package also registers **mCALL** ×7 (carrier-pending — Telnyx / LiveKit SIP trunk needed) for a total of **60 registered tools**. Roadmap: wire a carrier for mCALL, ship mIRL, add bridges. Phase 2 routes through the hosted gateway at `mcp.mosadd.com` with the 167-event radar in front.

## Install

### Claude Code

```bash
claude mcp add mosadd -- npx -y @mosadd/mcp@alpha
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@mosadd/mcp@alpha"],
      "env": {
        "MOSADD_SUPABASE_URL": "https://<your-project>.supabase.co",
        "MOSADD_SUPABASE_ANON_KEY": "<anon key>",
        "MOSADD_USER_JWT": "<your session JWT>"
      }
    }
  }
}
```

### Standalone

```bash
MOSADD_SUPABASE_URL=... MOSADD_SUPABASE_ANON_KEY=... MOSADD_USER_JWT=... npx @mosadd/mcp@alpha
```

## BYOK — get your env values

While the hosted gateway is in development, the alpha runs in **local BYOK mode** — you supply your own Supabase credentials to talk to your own mosadd backend.

- `MOSADD_SUPABASE_URL` — your Supabase project URL (e.g. `https://abc.supabase.co`)
- `MOSADD_SUPABASE_ANON_KEY` — the public anon key from project settings
- `MOSADD_USER_JWT` — a Supabase session token for your mosadd user. Get it from the browser:
  1. Sign in to mosadd.com
  2. Open DevTools → Application → Local Storage → `sb-<ref>-auth-token`
  3. Copy the `access_token` field

In Phase 2, run `mosadd login` to OAuth into hub.mosadd.com — no JWT-juggling required.

## Tools shipped in alpha

**52 live tools across 6 live modules** (mDM, mIRC, mROOM, mAIL, mTALK, mKB) + the `comms_capabilities` discovery tool. The package also registers **mCALL** ×7 (carrier-pending) — total **60 registered tools**. Highlights per module:

| Module | Tools | What it does |
|---|---|---|
| **mDM** (12) | `mDM_list_contacts`, `mDM_send`, `mDM_send_unencrypted`, `mDM_edit`, `mDM_delete`, `mDM_list`, `mDM_publish_keys`, `mDM_respond_request` + 4 voice ops | 1:1 text + voice. Multi-thread per contact, X3DH / Double-Ratchet E2EE on `mDM_send` |
| **mIRC** (20) | `mIRC_create/list/get/update/delete`, member RBAC ops, `mIRC_post_message`, `mIRC_list_messages` + admin | Persistent Discord/Slack-style channels |
| **mROOM** (9) | `mROOM_create`, **`mROOM_create_guest_link`**, `mROOM_join/leave/close/list`, `mROOM_send_message`, `mROOM_list_messages` | Ephemeral rooms + single-call no-account guest links |
| **mTALK** (5) | `mTALK_open`, `mTALK_join`, `mTALK_press`, `mTALK_release`, `mTALK_state` | Half-duplex push-to-talk: one speaker, FIFO queue, anti-hog auto-release |
| **mAIL** (4) | `mAIL_send`, `mAIL_view`, `mAIL_list`, `mAIL_delete` | Mail; every user gets `<id>@mosadd.com` |
| **mKB** (2) | `mKB_ingest`, `mKB_search` | RAG recall over the user's own data (hybrid vector + BM25) |
| **mCALL** (7, _carrier-pending_) | `mCALL_start_pstn`, `mCALL_end_pstn`, `mCALL_acquire_number`, `mCALL_my_numbers`, `mCALL_extend_number`, `mCALL_release_number`, `mCALL_answer` | Outbound + inbound PSTN with burner numbers + vocoder. Wire a Telnyx or LiveKit SIP trunk to flip live. |

All tool names follow [RFC 0001](https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>` snake_case.

## Try it (60-second demo)

In Claude Code with env vars set:

> List my mosadd contacts.

Claude calls `mDM_list_contacts` → you see your contact list.

> Send "hello from Claude" to <id> with thread label `notes`.

Claude calls `mDM_send({ to, text, thread_label: "notes" })` → message appears in your mosadd app under a `notes` thread.

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
mosadd backend Edge Function
        │
        │ RLS-checked insert
        ▼
Postgres `messages` table
        │
        │ Realtime broadcast
        ▼
mosadd.com app (receiver)
```

For PTT / CALL / ROOM (real-time media), the architecture separates **control plane** (MCP) from **data plane** (WebRTC daemon). See [docs/architecture/control-data-plane.md](https://github.com/Hei33enberg/mosadd-os/blob/main/docs/architecture/control-data-plane.md) when it lands.

## Configuration via env vars

| Env | Description | Required |
|---|---|---|
| `MOSADD_SUPABASE_URL` | Supabase project URL — DM / IRC / ROOM / KB backend | yes (BYOK) |
| `MOSADD_SUPABASE_ANON_KEY` | Supabase anon key | yes (BYOK) |
| `MOSADD_USER_JWT` | User session token | yes (for tools that touch user data) |
| `MOSADD_RESEND_API_KEY` | Resend API key — enables `mAIL` outbound | no (mAIL disabled if unset) |
| `MOSADD_LIVEKIT_URL` | LiveKit `wss://…` URL — enables `mTALK` / `mROOM` voice | no (voice disabled if unset) |
| `MOSADD_LIVEKIT_API_KEY` | LiveKit API key | no (with `…_URL` / `…_API_SECRET`) |
| `MOSADD_LIVEKIT_API_SECRET` | LiveKit API secret | no |
| `MOSADD_TELNYX_API_KEY` | Telnyx API key — enables `mCALL` PSTN | no (mCALL disabled if unset) |
| `MOSADD_API_KEY` | Hub API key (Phase 2 hosted mode) | no |
| `MOSADD_HUB_URL` | Override hub url | no |
| `MOSADD_MODE` | `local` / `cloud` / `self-host` | no (auto-detected) |
| `MOSADD_LOG_LEVEL` | `debug` / `info` / `warn` / `error` | no (default `info`) |

Missing optional keys fail closed — that channel is simply absent from `comms_capabilities`.

## License

Apache-2.0. See repo [LICENSE](https://github.com/Hei33enberg/mosadd-os/blob/main/LICENSE) and [NOTICE](https://github.com/Hei33enberg/mosadd-os/blob/main/NOTICE).
