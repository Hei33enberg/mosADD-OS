# Cursor example

Setup mosadd MCP server in Cursor.

## Install

Copy [`mcp.json`](./mcp.json) to `~/.cursor/mcp.json` (or merge if you already have other MCP servers configured), then fill in the three env vars at the bottom.

How to get the values:

- `MOSADD_SUPABASE_URL`: from https://supabase.com → your project → Settings → API → "Project URL"
- `MOSADD_SUPABASE_ANON_KEY`: same page → "anon public" key
- `MOSADD_USER_JWT`:
  1. Sign in to https://mosadd.com
  2. Open DevTools → Application → Local Storage
  3. Find key `sb-<projectref>-auth-token`
  4. Copy the `access_token` field from the JSON value

Restart Cursor. The agent now has 38 mosadd tools (mDM, mIRC, mROOM, mAIL, mTALK, mKB).

## Try it

In Cursor chat, ask:

> Use mosadd to list my contacts.

The agent should call `mDM_list_contacts` and return your roster.

## Troubleshooting

- "Tool not found": Cursor didn't load the MCP server. Check `cursor` logs or restart.
- `MissingSupabaseEnvError`: env vars didn't propagate. Restart Cursor with the file saved.

For the full tool catalogue, see [packages/mcp/README.md](../../packages/mcp/README.md).
