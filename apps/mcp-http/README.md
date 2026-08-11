# @mosadd/mcp-http — hosted MCP gateway (mcp.mosadd.com)

Serves the full `@mosadd/mcp` tool surface (77 tools across 4 modules — mDM/mIRC/mURL/mAYL — plus capabilities) over
**Streamable HTTP**, so remote / server-side agents (n8n, your own backend,
hosted Claude, ChatGPT) can use mosadd without running the stdio binary locally.

> ⚠ **This gateway serves the PUBLISHED package, not the repo.** `@mosadd/mcp` is a plain
> registry dependency in `package.json` (this app is a standalone Vercel project with Root
> Directory `apps/mcp-http`, and `apps/*` is deliberately NOT a member of
> `pnpm-workspace.yaml`), so `npm install` pulls the tarball from npmjs.com. Whatever is
> merged in `packages/mcp` reaches a caller only after `npm publish`. Measured 2026-08-11:
> the repo registered **77** tools while npm's newest, `3.0.0-alpha.32` (published
> 2026-07-19), registered **71** — six tools existed in git for three weeks and had never
> reached a single client. The number above tracks the SOURCE; the number a caller actually
> gets tracks the version pinned in `package.json`. **After every publish, bump that pin and
> re-run `npm install` here so `package-lock.json` follows** — the lock had been left on
> `3.0.0-alpha.23` (2026-06-26) while `package.json` asked for `.32`.

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

`tools/list` returns exactly what the PINNED `@mosadd/mcp` registers — 71 on the current
pin `3.0.0-alpha.32`, 77 once `3.0.0-alpha.33` is published and the pin is bumped. Verified: `initialize` → 200,
`tools/list` → the module set (mDM/mIRC/mURL/mAYL + mTALK/mRAG capabilities + comms_* +
threat_*; mCALL unregistered), `tools/call mIRC_list` → real backend response, bad key →
401. Live probe 2026-08-11 against `https://mcp.mosadd.com/mcp` with no key → `401` +
`WWW-Authenticate: Bearer realm="mosadd"`, so the gateway is up and gated; the tool count
behind that gate is whatever the pinned version ships.

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

1. ✅ Dependency is `@mosadd/mcp` pinned to an EXACT **published** version — currently
   `3.0.0-alpha.32` (the newest on npm as of 2026-08-11). The repo's `packages/mcp` is
   already at `3.0.0-alpha.33` and registers 77 tools, but that version is NOT on npm yet,
   so the pin here stays at `.32` on purpose: pinning an unpublished version would make
   `npm install` fail with `ETARGET` and break any redeploy of this gateway. The order is
   fixed — **publish `@mosadd/mcp@3.0.0-alpha.33` FIRST (release / `publish.yml` dispatch),
   THEN bump this pin to `.33` + re-run `npm install` so the lock follows.** Its
   `@mosadd/{crypto,protocol,providers}` deps are on npm too, so a plain `npm install`
   resolves with NO monorepo/workspace resolution. That decoupling is what makes the deploy
   simple AND what makes it stale: this app cannot see `packages/mcp` on disk. `npm run
   build` (tsc) is green.
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
