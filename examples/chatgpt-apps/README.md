# ChatGPT Apps (HTTP/SSE) example

ChatGPT Apps consume MCP over **HTTP/SSE** rather than stdio. The local `@mosadd/mcp` stdio runtime won't work directly — you'll wrap it in a hosted endpoint.

## Phase 2 — hosted gateway

`mcp.mosadd.com` (coming in Phase 2 — [LINEAR-2158](https://linear.app/ip-ra/issue/LINEAR-2158)) will speak HTTP/SSE with OAuth + BYOK key brokerage. Then setup is one URL:

```
https://mcp.mosadd.com/sse
```

Sign in once via OAuth, hub stores your provider keys, ChatGPT Apps gets a streaming MCP endpoint.

## Today — bridge stdio to HTTP locally

While the hosted gateway is in development, you can bridge the stdio MCP to HTTP yourself using [`mcp-proxy`](https://github.com/sparfenyuk/mcp-proxy):

```bash
npm install -g mcp-proxy
MOSADD_SUPABASE_URL=... \
MOSADD_SUPABASE_ANON_KEY=... \
MOSADD_USER_JWT=... \
mcp-proxy --sse-port 3333 -- npx -y @mosadd/mcp
```

The proxy exposes `http://localhost:3333/sse`. Use a tunneling tool (cloudflared, ngrok) to give it a public URL, then point ChatGPT Apps at that URL.

This is intentionally rough — it's a stopgap until [`mcp.mosadd.com`](https://mcp.mosadd.com) is live.

## When the hosted gateway lands

Configuration becomes (literally) one line:

```
MCP server URL: https://mcp.mosadd.com/sse
```

OAuth, your keys server-side, 68 live mosadd tools available. Watch the repo for the v0.2 release.
