# `@mosadd/edge` — Cloudflare Worker + Durable Object per channel

The scale backbone for mIRC (persistent text channels). One `ChannelDO` instance per channel name, globally scheduled by Cloudflare. WebSocket fan-out, recent-message ring in DO storage. See plan file "SCALE ARCHITECTURE" + `LINEAR-2675`.

## Phases
- **E1 (DONE, LIVE):** raw WS + broadcast + history endpoint. `LINEAR-2677`.
- **E2 (DONE, LIVE):** hub-key auth + per-key rate limit + DO-local key cache. `LINEAR-2678`.
- **E3 (DONE, code; needs CF_INGEST_SECRET to activate flush):** async flush DO→Supabase `message-ingest-batch` via DO alarm() — Supabase = system-of-record. `LINEAR-2679`.
- **E4:** client cut-over (`apps/web`, `@mosadd/mcp`, StrajkPolski relay) per-channel flag. ← `LINEAR-2680`
<!-- mROOM killed (LINEAR-3414); mIRC is the sole text-channel consumer of the edge DO. -->
- **E5:** DNS `chat.mosadd.com` via Vercel CNAME, monitoring. ← `LINEAR-2681`
- **E6 (DONE, this build):** per-channel scoped JWT auth via `Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>`. Server-side `hub-mint-channel-token` (Supabase Edge Function) exchanges a hub key for a 5-min, channel-scoped HS256 JWT. Browsers hold only the JWT — the hub key never leaves the server. Closes Strajk HANDOFF-14 (no `?k=hub_key` in URLs leaking to CDN logs). `LINEAR-2675`.

## Auth precedence on `GET /c/:channelId/ws`
1. **`Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>`** — E6 recommended.
2. **`Authorization: Bearer mosadd_sk_live_…`** — server-side relays / MCP.
3. **`?k=mosadd_sk_live_…`** — **DEPRECATED** (URL is logged by CF / every CDN).

## Secrets
The DO talks to two Supabase paths; each path uses a shared secret. Set all in 3 places (GitHub → CI → Worker, AND Supabase Edge Function secrets where the verifier lives).

| Secret | What for | Set on Supabase? | GH Action pushes to Worker? |
|---|---|---|---|
| `CF_INGEST_SECRET` | E3 flush — DO→`message-ingest-batch` shared secret | Yes (verified by `message-ingest-batch`) | Yes |
| `CHANNEL_TOKEN_SECRET` | E6 — HS256 secret for the scoped-JWT mint/verify pair | Yes (used by `hub-mint-channel-token` to SIGN) | Yes (Worker uses it to VERIFY locally) |

Without `CF_INGEST_SECRET`: E1/E2/E6 work; E3 flush is a no-op (messages sit in `pending` until the secret arrives, then drain).
Without `CHANNEL_TOKEN_SECRET`: E1/E2/E3 work; the Worker rejects every scoped-token WS attempt — clients must use the hub-key paths.

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
