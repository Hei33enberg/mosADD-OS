# Self-hosting mURL

mURL's backend is intentionally small and stateless: one Cloudflare Worker (with
a Durable Object) and a handful of Deno edge functions on Supabase. You can run
the whole stack on your own infrastructure and point a local/custom build of the
extension at it.

> This is a power-user / contributor guide. The hosted mURL (murl.mosadd.com) is
> free and needs none of this.

## What you need

- A **Cloudflare** account with Workers Paid (Durable Objects require it).
- A **Supabase** project (Postgres + Edge Functions).
- Node 18+ and the Supabase CLI / Wrangler.

## 1. Database

Apply the migrations that create the mURL tables + RPCs (in
`m0ssad-3/supabase/migrations`): `domain_controls`, `channel_reports` (+ its
auto-hide trigger), `rate_limit_buckets` + `increment_rate_limit_bucket`, and
`messages_meta` with `sender_sub` + `dsr_erase_embed_sub`.

## 2. Edge functions (Supabase, `verify_jwt=false`)

Deploy: `channel0-join`, `domain-channel-ensure`, `channel0-report`,
`channel0-trending`, `domain-verify`, `channel0-owner-stats`, `message-ingest-batch`.

Secrets:

| Secret | Used by | Notes |
|---|---|---|
| `CHANNEL_TOKEN_SECRET` | join, Worker | HS256 signing key for channel JWTs — must match the Worker |
| `CF_INGEST_SECRET` | ingest, Worker, ensure | shared secret so only your Worker can flush |
| `CHANNEL0_DEVICE_SALT` | join, report | salt for hashing device tokens |
| `CHANNEL0_POW_BITS` | join | PoW difficulty (default 12) |
| `CHANNEL0_KILLSWITCH` | join | set `1` for an emergency global stop |
| `CHANNEL0_VERIFY_SECRET` | domain-verify | derives the DNS TXT challenge value |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | several | standard |

## 3. Cloudflare Worker (`apps/edge`)

```bash
cd apps/edge
# set CHANNEL_TOKEN_SECRET + CF_INGEST_SECRET as Worker secrets
npx wrangler secret put CHANNEL_TOKEN_SECRET
npx wrangler secret put CF_INGEST_SECRET
npx wrangler deploy
```

The Worker needs the `ChannelDO` Durable Object binding (see `wrangler.toml`) and
the ingest/ensure function URLs. `CHANNEL_TOKEN_SECRET` **must** equal the value
used by `channel0-join`, or token validation fails.

## 4. Point the extension at your stack

Build the extension and override the endpoints at runtime — no rebuild needed:

```js
chrome.storage.sync.set({
  "channel0.endpoints": {
    joinUrl:  "https://<your-project>.supabase.co/functions/v1/channel0-join",
    edgeBase: "https://<your-worker>.workers.dev",
  },
});
```

Or change the defaults in `src/lib/config.ts` and rebuild.

## 5. Verify

1. `GET <edgeBase>/health` → `{ ok: true }`.
2. `POST <joinUrl>` with a fake `device_token` → `428` (PoW gate works).
3. Load `dist/` unpacked in two Chrome profiles, open the same site → presence +
   live messages both ways, history on reload, a row in `messages_meta`.

## Cost & abuse notes

DO-per-domain auto-scales, but a viral spike across many domains needs the same
quota/spend discipline as any Worker-Paid project. Keep the rate limits and the
PoW gate on; they're the cost guard. The kill switch (`CHANNEL0_KILLSWITCH=1`) is
your emergency brake.
