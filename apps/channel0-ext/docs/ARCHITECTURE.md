# mURL architecture

End-to-end design of mURL (codename `channel0`). Everything here is open source
in this monorepo; nothing in the browser ever holds a secret key.

## The one-paragraph version

A registrable domain becomes a chat room. The extension normalizes the page's
host to an eTLD+1 (`www.nike.com/men` → `nike.com`), slugifies it (`nike-com`),
asks a public edge function (`channel0-join`) for a short-lived, channel-scoped
JWT, then opens a WebSocket to a Cloudflare Worker. The Worker routes the socket
to one Durable Object **per slug** (`ChannelDO.idFromName(slug)`), which fans out
messages, keeps a ring buffer of recent history, tracks presence, and flushes
asynchronously to Supabase as the durable system-of-record.

## Components

### 1. Extension (`apps/channel0-ext`, Chrome MV3)
- **content script** (`src/content/index.ts`) — injects a closed shadow-root chat
  panel + draggable bubble on every site; runs the one-time 16+ age gate; answers
  the deep-link probe from the landing pages.
- **side panel** (`src/sidepanel/`) — the full chat surface + settings + trending.
- **shared chat shell** (`src/shared/chat-shell.ts`) — mounts the chat UI, owns the
  connect/reconnect loop, presence, compose, report.
- **libs** (`src/lib/`): `domain.ts` (normalize), `nick.ts` (deterministic
  adjective-noun-NN + hue), `pow.ts` (hashcash), `client.ts` (join + WSS),
  `identity-store.ts` (device token + per-domain nick), `config.ts` (endpoints),
  `moderation.ts` (report + client-side flood throttle), `i18n.ts`.
- Built with Vite into two outputs: `content.js` as a self-contained IIFE (content
  scripts can't resolve cross-origin module imports) and the side panel/background
  as ES modules.

### 2. Identity (anonymous + lightweight trust)
- **nick** — deterministic from `(deviceToken, domain)` via FNV-1a, e.g.
  `lucky-otter-77`, with a per-room accent hue. Stored per domain; editable.
- **device token** — a random per-install UUID (`crypto.randomUUID`). The server
  only ever sees a salted SHA-256 hash of it. Used **only** as a rate-limit / ban
  key. Deliberately **not** a browser fingerprint — no fingerprinting library.

### 3. `channel0-join` (Supabase edge fn, `verify_jwt=false`)
The anonymous token mint. Flow:
1. Killswitch check (`CHANNEL0_KILLSWITCH`) → `503`.
2. `domain_controls` lookup → if `blocked`, `451`.
3. Device-ban check (hashed token).
4. **Proof-of-work** gate: first call answers `428` with `{pow_bits, server_ts}`;
   the client solves hashcash (`sha256(domain:token:ts:nonce)` with N leading
   zero bits, default 12) and retries with `{pow_ts, pow_nonce}`.
5. Per-device + per-IP rate-limit via the atomic `increment_rate_limit_bucket` RPC.
6. Mints an HS256, channel-scoped JWT (`sub = anon:<nick>`, `scope = chat:rw`,
   `exp = +5min`) signed with `CHANNEL_TOKEN_SECRET` — the **same** signer the hub
   uses, refactored into `_shared/channel-token.ts`.

### 4. Cloudflare Worker + `ChannelDO` (`apps/edge`)
- Validates the JWT (HS256, `exp`, `channel_id` match) presented via
  `Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>` — **never** a token in the URL.
- `ChannelDO` (one per slug): hibernatable WebSocket fan-out, 100-message ring
  buffer for instant history, presence roster, per-socket rate-limit + server-side
  flood/spam filters, async batched flush to Supabase.
- A cold DO fires `domain-channel-ensure` once (upserts the `channels` row, returns
  `{status, branding}`, cached ~60s) so the room can be branded/blocked.
- `GET /c/:slug/presence` returns `{count, roster, branding, status}`.

### 5. Persistence (`message-ingest-batch` → `messages_meta`)
The DO flushes batches to `message-ingest-batch`, which writes rows to
`messages_meta` with `thread_id = chat:<slug>`. `sender_sub` carries `anon:<nick>`
so GDPR erase-by-sub (`dsr_erase_embed_sub`) can wipe a subject's messages.

### 6. Trust & safety
- Client: instant non-affiliation banner, link-flood throttle, soft profanity nudge.
- Server (authoritative): PoW, rate limits, flood/spam validators, burst + repeat
  trackers, `channel0-report` → `channel_reports` → DB trigger auto-hides a message
  at **3 distinct reporters** (soft-delete `messages_meta.deleted_at`).
- Kill switches: global (`CHANNEL0_KILLSWITCH`) + per-domain (`domain_controls.status`).
- See [MODERATION-SOP.md](./MODERATION-SOP.md).

### 7. Domain control (owner monetization, opt-in)
`domain-verify` lets an owner prove control via a DNS TXT record
(`_mosadd-channel0.<domain>`, checked over DoH) and then **open** (default, free),
**disable** (free → room returns 451), or **claim & brand** (theme, pinned message,
official badge, analytics). Verification is always DNS, never inference.

## Data flow (happy path)

```
open nike.com
  → normalizeDomain → {domain:"nike.com", slug:"nike-com"}
  → POST channel0-join {domain, device_token, nick}
       ← 428 {pow_bits:12, server_ts}        (first time)
  → solve PoW → POST channel0-join {..., pow_ts, pow_nonce}
       ← 200 {token, expires_in:300, channel_id:"nike-com", status:"open", branding}
  → WSS edgeBase/c/nike-com/ws  [Sec-WebSocket-Protocol: mosadd.v1, bearer.<token>]
       ← {type:"presence", count, roster}
       ← {id, ts, from:"anon:<nick>", text}   (history from ring, then live)
  → send {text, from:"anon:<nick>"}
  → (async) DO → message-ingest-batch → messages_meta(thread_id=chat:nike-com)
```

On any unexpected socket close the shell reconnects with exponential backoff and
**re-runs join**, minting a fresh token — so an expired 5-min token self-heals.
