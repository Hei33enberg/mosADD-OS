# @mosadd/mcp-http — hosted MCP gateway (mcp.mosadd.com)

Serves the full `@mosadd/mcp` tool surface (the 6 live modules, 70 tools) over
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
npm install            # links the local ../../packages/mcp via file:
npm run dev            # http://localhost:3030/mcp
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

Verified locally: `initialize` → 200, `tools/list` → 70 tools (mDM/mIRC/mROOM/
mTALK/mAIL/mRAG — mURL/mCALL unregistered), `tools/call mROOM_list` → real backend response, bad key → 401.

## Deploy (mcp.mosadd.com)

This is a standalone Vercel project (Root Directory `apps/mcp-http`).

1. **Switch the dependency** from `file:../../packages/mcp` to
   `@mosadd/mcp@alpha` (the published package — needs ≥ 3.0.0-alpha.6, which
   exports `runWithSupabaseEnv`). The monorepo `file:` ref is for local dev only.
2. Deploy to Vercel; add the domain **`mcp.mosadd.com`** (Vercel-managed DNS →
   CNAME auto). ← owner step.
3. Update `/mcp` + `/docs` on mosadd.com with the hosted "HTTP" option next to stdio.

Client config (once live):

```jsonc
// any MCP client that supports Streamable HTTP
{ "url": "https://mcp.mosadd.com/mcp",
  "headers": { "Authorization": "Bearer mosadd_sk_live_…" } }
```
