# mURL public API

Base URLs (production):

- **Edge functions:** `https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1`
- **Worker (WSS/HTTP):** `https://mosadd-edge.mr-brics-33.workers.dev`

All edge functions are `verify_jwt=false` (public) and CORS-open. They are the
authoritative source — shapes below are documented from the live functions; read
the source in `m0ssad-3/supabase/functions/<name>` for the last word.

> Note: the consumer extension is the supported client. These endpoints are
> documented for transparency, self-hosting, and tooling — not as a stability
> guarantee. Be a good citizen: respect the rate limits and the kill switch.

---

## `POST /channel0-join` — mint a channel token

Anonymous, proof-of-work–gated mint of a 5-minute channel-scoped JWT.

**Request**
```json
{ "domain": "nike.com", "device_token": "<random-uuid>", "nick": "lucky-otter-77" }
```

**Proof-of-work handshake.** If PoW is required the first response is:
```
HTTP 428 Precondition Required
{ "pow_bits": 12, "server_ts": 1780459620 }
```
Solve hashcash — find `nonce` such that
`sha256("<domain>:<device_token>:<server_ts>:<nonce>")` has `pow_bits` leading
zero bits — then retry:
```json
{ "domain": "nike.com", "device_token": "<uuid>", "nick": "lucky-otter-77",
  "pow_ts": 1780459620, "pow_nonce": "<solution>" }
```

**Success**
```
HTTP 200
{ "token": "<HS256 jwt>", "expires_in": 300, "channel_id": "nike-com",
  "domain": "nike.com", "nick": "lucky-otter-77",
  "status": "open", "branding": {}, "scope": "chat:rw" }
```

**Errors:** `451` domain disabled by owner · `429` rate-limited (`Retry-After`) ·
`503` `{reason:"killswitch"}` global stop · `428` PoW required.

---

## WebSocket — live chat

Open a socket to the Worker, passing the token via the WebSocket sub-protocol
header (never the URL):

```
wss://<edgeBase>/c/<slug>/ws
Sec-WebSocket-Protocol: mosadd.v1, bearer.<token>
```

**Inbound frames** (server → client), newline-free JSON:
```json
{ "type": "presence", "count": 12, "roster": ["lucky-otter-77", "calm-fox-12"] }
{ "id": "<uuid>", "ts": 1780459620575, "from": "anon:lucky-otter-77", "text": "hi" }
{ "error": "rate_limited", "retry_after": 3 }
```

**Outbound frames** (client → server):
```json
{ "text": "hello", "from": "anon:lucky-otter-77" }
```

Display strips the `anon:` prefix from `from`. The socket should reconnect with
backoff and re-mint a fresh token on close (the token lives 5 min).

---

## `GET /c/:slug/presence` — who's here now (Worker)

```
GET https://<edgeBase>/c/nike-com/presence
→ { "count": 12, "roster": [...], "branding": {}, "status": "open" }
```

`GET /health` → `{ "ok": true, "service": "mosadd-edge", "phase": "..." }`.

---

## `GET /channel0-trending` — active rooms

```
GET /channel0-trending?minutes=120     # window 5..1440, default 60
→ { "minutes": 120, "since": "<iso>",
    "items": [ { "slug": "nike-com", "domain": "nike.com",
                 "messages": 42, "last_ts": "<iso>",
                 "status": "open", "branding": {} } ] }
```
Pure read over `messages_meta`, grouped by `thread_id LIKE 'chat:%'`, joined to
`domain_controls` to hide blocked rooms. (Filter test/internal rooms client-side.)

---

## `POST /channel0-report` — flag a message

```json
{ "message_id": "<uuid>", "channel_slug": "nike-com",
  "device_token": "<uuid>", "reason": "spam" }   // spam | abuse | illegal | other
→ { "ok": true, "reported": true, "reporter_count": 2 }
```
Idempotent per `(message_id, reporter_hash)` — one device can't ratchet the count.
A DB trigger soft-deletes the message at **3 distinct reporters**. Per-device
throttle 20/min.

---

## `POST /domain-verify` — domain owner control

Prove ownership of a domain via DNS, then open / disable / claim / brand its room.
Actions (body `{ domain, action, ... }`):

| action | effect |
|---|---|
| `challenge` | returns the TXT value to add at `_mosadd-channel0.<domain>` |
| `verify` | DoH-checks the TXT, marks the domain verified |
| `disable` | free for verified owners — room returns `451` to all joiners |
| `open` | revert a disabled room back to open |
| `brand` | claim & brand: `{ accent_color, pinned_message, official_badge, owner_name }` |

Verification is always DNS-based; ownership is never inferred. See the
`domain-verify` source for exact field names and the claim/brand schema.

---

## Identifiers

- **slug** = registrable domain with dots → dashes, `[a-z0-9-]{1,128}` (`nike.com` → `nike-com`).
- **thread_id** = `chat:<slug>` in `messages_meta`.
- **sender_sub** = `anon:<nick>` (the GDPR erase key).
- **DNS verify record** = `_mosadd-channel0.<domain>` TXT.
