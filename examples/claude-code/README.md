# Claude Code example

Setup mosadd MCP server in Claude Code so the agent can send DMs, manage rooms, channels, and email on your behalf.

## Install — hosted gateway (recommended)

Mint a hub key at [mosadd.com/keys](https://mosadd.com/keys) (`mosadd_sk_live_…`, shown once), then:

```bash
claude mcp add --transport http mosadd https://mcp.mosadd.com/mcp --header "Authorization: Bearer mosadd_sk_live_…"
```

One command, no local process, revocable from /keys. Restart Claude Code.

## Install — local stdio (BYOK)

```bash
claude mcp add mosadd -e MOSADD_SUPABASE_URL=https://abc.supabase.co -e MOSADD_SUPABASE_ANON_KEY=eyJhbGc... -e MOSADD_USER_JWT=eyJhbGc... -- npx -y @mosadd/mcp@alpha
```

This runs the published `@mosadd/mcp` package from npm, pinned to the `alpha` channel (installs are reproducible and don't track unreviewed commits). **Honest status:** the currently published alpha runs local stdio in BYOK mode only — you supply Supabase credentials for your own mosadd backend, and the user JWT below is short-lived. The repo already carries stdio hub-key auth (`MOSADD_API_KEY`) and a `mosadd login` flow; they reach npm with the next publish, which retires the JWT-juggling below.

**How to get the JWT (BYOK mode only):**
1. Sign in to https://mosadd.com
2. Open DevTools → Application → Local Storage → key `sb-<ref>-auth-token`
3. Copy the `access_token` value (expires after about an hour — the hosted-gateway path above avoids this entirely)

## Try it

In Claude Code, with the MCP server connected:

> List my mosadd contacts.

Claude calls `mDM_list_contacts` and shows your contact list.

> Create a channel called "ops" and post a kickoff message.

Claude calls `mIRC_create` then `mIRC_post_message` → your channel is live with the first message posted.

> Send Bob an email with subject "Quote" and body "Attached is the quote."

Claude calls `mAYL_send`.

## All tools available

See [packages/mcp/README.md](../../packages/mcp/README.md) for the full list (77 tools across the four modules — mDM · mIRC · mURL · mAYL — plus capabilities: mTALK voice, mRAG, comms_).

## Troubleshooting

- `MissingSupabaseEnvError`: your env vars aren't reaching the MCP server. Verify `claude mcp get mosadd` shows them.
- `Unable to resolve current user`: your `MOSADD_USER_JWT` expired. Sign back in to mosadd.com and grab a fresh token.
- `Access denied`: RLS rejected the call (you don't own the resource). Confirm the contact/channel/room is yours.
