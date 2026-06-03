# `@mosadd/edge` — Cloudflare Worker + Durable Object per channel

The scale backbone for mIRC/mROOM (text channels). One `ChannelDO` instance per channel name, globally scheduled by Cloudflare. WebSocket fan-out, recent-message ring in DO storage. See plan file "SCALE ARCHITECTURE" + `LINEAR-2675`.

## Phases
- **E1 (this prototype):** raw WS + broadcast + history endpoint. No auth, no persistence to Supabase. Goal = load-test one channel, prove ≥ low-thousands concurrent writers without latency cliff.
- **E2:** edge auth (hub API key) + per-key metering/caps. ← `LINEAR-2678`
- **E3:** async flush → Supabase `messages_meta` (SoR for search/RAG/compliance). ← `LINEAR-2679`
- **E4:** client cut-over (`apps/web`, `@mosadd/mcp`, StrajkPolski relay) per-channel flag. ← `LINEAR-2680`
- **E5:** DNS `chat.mosadd.com` via Vercel CNAME, monitoring. ← `LINEAR-2681`

## Deploy
CI handles it: every push to `main` that touches `apps/edge/**` runs `.github/workflows/deploy-edge.yml` → `wrangler deploy` using the `CLOUDFLARE_API_TOKEN` secret.

## Endpoints
- `GET  /health` — liveness.
- `GET  /c/:channelId/ws` — WebSocket upgrade; messages arrive as JSON `{id, ts, from, text}`.
- `POST /c/:channelId/send` — JSON `{text, from?}` → broadcast + persist in recent ring.
- `GET  /c/:channelId/history?limit=N` — last N (≤100) messages from the DO ring.

## Load test (after deploy)
```sh
EDGE=https://mosadd-edge.<account>.workers.dev npm run loadtest:1ch -- 500 30000
```
Prints connect-count, fan-out ratio, p50/p95/p99 broadcast latency.
