# @mosadd/mcp-http — hosted MCP gateway (mcp.mosadd.com)

Serves the full `@mosadd/mcp` tool surface (73 tools across 4 modules — mDM/mIRC/mURL/mAYL — plus capabilities) over
**Streamable HTTP**, so remote / server-side agents (n8n, your own backend,
hosted Claude, ChatGPT) can use mosadd without running the stdio binary locally.

## How it works

Per request:

1. Read the caller's API key: `Authorization: Bearer mosadd_sk_live_…`.
2. Exchange it for a short-lived Supabase session via `hub-key-exchange`.
3. Spin up a **stateless** MCP server + `StreamableHTTPServerTransport`.
4. Run the whole request inside that session's `AsyncLocalStorage` context
   (`runWithSupabaseEnv`), so every tool call resolves the **caller's** creds —
   never a shared/global env. That is what makes one process safe to serve many
   tenants concurrently (required for serverless).

## Local dev

```bash
npm install            # installs the published @mosadd/mcp@alpha
npm run dev            # http://localhost:3030/mcp
# To test against unpublished local package changes: npm link ../../packages/mcp
```

Smoke it like a real MCP HTTP client:

```bash
KEY=mosadd_sk_live_...
curl -s http://localhost:3030/mcp \
  -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Verified locally: `initialize` → 200, `tools/list` → 73 tools (mDM/mIRC/mURL/mAYL
modules + mTALK/mRAG capabilities + comms_* — mCALL and threat_* unregistered), `tools/call mIRC_list` → real backend response, bad key → 401.

## Adding it as a CONNECTOR (OAuth) — not just a key in a header

A bearer key is enough for Claude Code on a terminal and for n8n. It is NOT enough to appear in a
host's connector list (Claude, ChatGPT): those add a server **by URL** and expect OAuth 2.1 with
dynamic client registration. Since 2026-07-30 this gateway supports both.

What a host does, with nothing pasted by the user:

1. `POST /mcp` with no key → **401 + `WWW-Authenticate: … resource_metadata="…"`**
2. `GET /.well-known/oauth-protected-resource` → names the authorization server (this origin)
3. `GET /.well-known/oauth-authorization-server` → authorize / token / register endpoints
4. `POST /oauth/register` (RFC 7591) → a `client_id`, no secret, PKCE required
5. `GET /oauth/authorize?…` → 302 to `https://mosadd.com/oauth/authorize`, where the user signs in
   and approves
6. `POST /oauth/token` with the code + PKCE verifier → an access token

**The access token IS a `mosadd_sk_live_…` hub key.** That is the whole design: the resource server
keeps ONE auth path, the connector shows up in the user's key list, revoking it is revoking the key,
and usage accounting already counts these calls. The authorization server itself is the
`hub-oauth` edge function in the mosADD repo; the `/oauth/*` and `/.well-known/*` routes here are
rewrites onto it so discovery sees one issuer, `https://mcp.mosadd.com`, as the spec requires.

Smoke it:

```bash
curl -s https://mcp.mosadd.com/.well-known/oauth-protected-resource
curl -si -X POST https://mcp.mosadd.com/mcp -H 'Content-Type: application/json'   -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | grep -i www-authenticate
```

## Deploy (mcp.mosadd.com)

This is a standalone Vercel project (Root Directory `apps/mcp-http`).

1. ✅ Dependency is already `@mosadd/mcp@^3.0.0-alpha.20` (published — exports
   `runWithSupabaseEnv`; its `@mosadd/{crypto,protocol,providers}` deps are on npm
   too, so a plain `npm install` resolves with NO monorepo/workspace resolution).
   `npm run build` (tsc) is green.
2. Create the Vercel project: **New Project → import `Hei33enberg/mosadd-os` →
   Root Directory `apps/mcp-http` → Deploy** (team `hei33enberg`). ← owner (dashboard).
3. Add the domain **`mcp.mosadd.com`** (Project → Domains; Vercel-managed DNS →
   CNAME auto). ← owner (dashboard).
4. Update `/mcp` + `/docs` on mosadd.com with the hosted "HTTP" option next to stdio.

Client config (once live):

```jsonc
// any MCP client that supports Streamable HTTP
{ "url": "https://mcp.mosadd.com/mcp",
  "headers": { "Authorization": "Bearer mosadd_sk_live_…" } }
```
