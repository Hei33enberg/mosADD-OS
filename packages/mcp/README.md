# @mosadd/mcp

MCP server for [mosadd](https://mosadd.dev) — exposes the OS modules (m\*) as Model Context Protocol tools so any agent runtime can talk to mosadd: Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, Bolt, Goose, Manus, custom.

> **3.0.0-alpha** — `mDM` only, wired to the m0ssad-3 Supabase backend as a strangler-fig step. Phase 1 full will add mTALK / mAIL / mCALL / mIRC / mIRL / mROOM + bridges. Phase 2 routes through the hosted gateway at `mcp.mosadd.com` with the 167-event radar in front.

## Install

### Claude Code

```bash
claude mcp add mosadd npx -- -y @mosadd/mcp
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@mosadd/mcp"],
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
MOSADD_SUPABASE_URL=... MOSADD_SUPABASE_ANON_KEY=... MOSADD_USER_JWT=... npx @mosadd/mcp
```

## BYOK — get your env values

While the hosted gateway is in development, the alpha runs in **local BYOK mode** — you supply your own Supabase credentials to talk to your own m0ssad-3 backend.

- `MOSADD_SUPABASE_URL` — your Supabase project URL (e.g. `https://abc.supabase.co`)
- `MOSADD_SUPABASE_ANON_KEY` — the public anon key from project settings
- `MOSADD_USER_JWT` — a Supabase session token for your mosadd user. Get it from the browser:
  1. Sign in to mosadd.com
  2. Open DevTools → Application → Local Storage → `sb-<ref>-auth-token`
  3. Copy the `access_token` field

In Phase 2, run `mosadd login` to OAuth into hub.mosadd.com — no JWT-juggling required.

## Tools shipped in alpha

| Tool | Description |
|---|---|
| `mDM_list_contacts` | List your mosadd contacts (returns `identity_id` to use elsewhere) |
| `mDM_send` | Send a DM. `{ to: identity_id, text, thread_label?, reply_to_id? }` |
| `mDM_list` | Read DM thread |
| `mDM_respond_request` | Accept/reject incoming DM request |

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
m0ssad-3 Edge Function
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
| `MOSADD_SUPABASE_URL` | Supabase project URL | yes |
| `MOSADD_SUPABASE_ANON_KEY` | Supabase anon key | yes |
| `MOSADD_USER_JWT` | User session token | yes (for tools that touch user data) |
| `MOSADD_API_KEY` | Hub API key (Phase 2 hosted mode) | no |
| `MOSADD_HUB_URL` | Override hub url | no |
| `MOSADD_MODE` | `local` / `cloud` / `self-host` | no (auto-detected) |
| `MOSADD_LOG_LEVEL` | `debug` / `info` / `warn` / `error` | no (default `info`) |

## License

Apache-2.0. See repo [LICENSE](https://github.com/Hei33enberg/mosadd-os/blob/main/LICENSE) and [NOTICE](https://github.com/Hei33enberg/mosadd-os/blob/main/NOTICE).
