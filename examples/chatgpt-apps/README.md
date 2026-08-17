# ChatGPT Apps (HTTP/SSE) example

ChatGPT Apps consume MCP over **HTTP/SSE** rather than stdio. The local `@mosadd/mcp` stdio runtime won't work directly — you'll wrap it in a hosted endpoint.

## Phase 2 — hosted gateway

`mcp.mosadd.com` (LIVE) speaks Streamable HTTP with OAuth + BYOK key brokerage. Setup is one URL (the /mcp path is required):

```
https://mcp.mosadd.com/mcp
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

This is intentionally rough — the hosted gateway at [`mcp.mosadd.com/mcp`](https://mcp.mosadd.com) is live and is the preferred path.

## When the hosted gateway lands

Configuration becomes (literally) one line:

```
MCP server URL: https://mcp.mosadd.com/mcp
```

OAuth, your keys server-side, 77 live mosadd tools available. Watch the repo for the v0.2 release.
