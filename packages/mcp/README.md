# @m0ssad/mcp

Model Context Protocol (MCP) server for mosadd. Exposes the mosadd OS modules — `mDM`, `mTALK`, `mAIL`, `mCALL`, `mIRC`, `mIRL`, `mROOM`, and bridges — to any agent runtime.

> **A module of [mosadd](https://github.com/mosadd/os) — a human OS for communications.**

## Install

### As a local stdio server (Claude Code, Cursor, Cline, Windsurf, ...)

Add to your MCP config:

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@m0ssad/mcp"],
      "env": {
        "MOSADD_API_KEY": "your-key-from-hub.mosadd.com"
      }
    }
  }
}
```

### Hosted (ChatGPT Apps, Lovable, Bolt, custom HTTP clients)

Point your client at `https://mcp.mosadd.com` and authenticate with OAuth.
See [docs/hosted-mcp.md](../../docs/hosted-mcp.md).

## Exposed tools

Each `m*` module exposes a family of tools. Names follow `m{MODULE}_{operation}`:

### `mDM` — Direct messages

- `mDM_send` — send a DM (with optional thread, optional E2E)
- `mDM_list` — list recent DMs (with pagination, optional thread filter)
- `mDM_respond_request` — accept/reject a DM request from a stranger

### `mTALK` — Push-to-talk (Phase 1 — kill feature)

- `mTALK_start_session` — open a PTT session
- `mTALK_push` / `mTALK_release` — semantic PTT
- `mTALK_speak` — agent injects synthesized speech into the room

### `mAIL` — Email (Phase 1)

- `mAIL_send`, `mAIL_view`, `mAIL_list`

### `mCALL` — PSTN (Phase 1, requires DID acquisition)

- `mCALL_start_pstn`, `mCALL_end_pstn`, `mCALL_list_did`

### `mIRC` — Persistent channels (Phase 1)

- `mIRC_create_channel`, `mIRC_join`, `mIRC_send_message`, `mIRC_list_channels`

### `mROOM` — Ephemeral rooms (Phase 1)

- `mROOM_create`, `mROOM_guest_token`, `mROOM_list_participants`

### `mIRL` — Live-stream after-parties (Phase 1)

- `mIRL_create_after_party`, `mIRL_list_attendees`

### Bridges (Phase 1)

- `mMATRIX_send`, `mDISCORD_send`, `mTELEGRAM_send` (Phase 1 MVP)
- `mSLACK_send`, `mSIGNAL_send` (Phase 1 P1)

## Usage example

```ts
// Claude Code session
await use_mcp_tool({
  server: "mosadd",
  tool: "mDM_send",
  arguments: {
    to: "alice@mosadd",
    text: "Have you seen the build log?",
    thread_id: "incident-2026-05-26"
  }
});
```

## Configuration

Environment variables:

- `MOSADD_API_KEY` — required for cloud mode (issued by hub.mosadd.com)
- `MOSADD_HUB_URL` — defaults to `https://mcp.mosadd.com`
- `MOSADD_MODE` — `cloud` (default) | `local` | `self-host`
- `MOSADD_LOG_LEVEL` — `debug` | `info` | `warn` | `error`

For BYOK provider keys (Telnyx, Resend, etc.), use the hub dashboard or set:
- `MOSADD_TELNYX_API_KEY`
- `MOSADD_RESEND_API_KEY`
- ...

## Status

**Pre-alpha.** Only `mDM_send`, `mDM_list`, `mDM_respond_request` have working stubs. Other tools return `{ error: "not yet implemented" }`. Track progress in [LINEAR-2143](https://linear.app/ip-ra/issue/LINEAR-2143).

## License

[Apache-2.0](../../LICENSE). Patent grant included.
