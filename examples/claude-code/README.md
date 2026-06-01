# Claude Code example

Setup mosadd MCP server in Claude Code so the agent can send DMs, manage rooms, channels, and email on your behalf.

## Install

```bash
claude mcp add mosadd npx -- -y @mosadd/mcp
```

This adds an entry to your Claude Code MCP config pointing at `npx -y @mosadd/mcp`. Restart Claude Code.

## Configure (BYOK)

The alpha runs in BYOK mode — you supply Supabase credentials for your own mosadd backend.

Edit your Claude Code MCP config (find with `claude mcp list`, then edit the file at `~/.config/claude-code/mcp.json` or platform equivalent):

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@mosadd/mcp"],
      "env": {
        "MOSADD_SUPABASE_URL": "https://abc.supabase.co",
        "MOSADD_SUPABASE_ANON_KEY": "eyJhbGc...",
        "MOSADD_USER_JWT": "eyJhbGc..."
      }
    }
  }
}
```

**How to get the JWT:**
1. Sign in to https://mosadd.com
2. Open DevTools → Application → Local Storage → key `sb-<ref>-auth-token`
3. Copy the `access_token` value

Phase 2 replaces this with `mosadd login` OAuth — no JWT-juggling.

## Try it

In Claude Code, with the MCP server connected:

> List my mosadd contacts.

Claude calls `mDM_list_contacts` and shows your contact list.

> Create a room and give me a guest link for "Alice".

Claude calls `mROOM_create` then `mROOM_create_guest_link` → you get a URL to share.

> Send Bob an email with subject "Quote" and body "Attached is the quote."

Claude calls `mAIL_send`.

## All tools available

See [packages/mcp/README.md](../../packages/mcp/README.md) for the full list (38 tools across mDM / mIRC / mROOM / mAIL / mTALK / mKB).

## Troubleshooting

- `MissingSupabaseEnvError`: your env vars aren't reaching the MCP server. Verify `claude mcp get mosadd` shows them.
- `Unable to resolve current user`: your `MOSADD_USER_JWT` expired. Sign back in to mosadd.com and grab a fresh token.
- `Access denied`: RLS rejected the call (you don't own the resource). Confirm the contact/channel/room is yours.
