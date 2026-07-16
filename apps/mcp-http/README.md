# @mosadd/mcp-http — hosted MCP gateway (mcp.mosadd.com)

Serves the full `@mosadd/mcp` tool surface (68 tools across 4 modules — mDM/mIRC/mURL/mAYL — plus capabilities) over
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

Verified locally: `initialize` → 200, `tools/list` → 68 tools (mDM/mIRC/mURL/mAYL
modules + mTALK/mRAG capabilities + comms_* — mCALL and threat_* unregistered), `tools/call mIRC_list` → real backend response, bad key → 401.

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
