# mURL — anonymous live chat for every website

[![License](https://img.shields.io/badge/license-Apache--2.0-00ff7f)](../../LICENSE) ·
**Site:** [murl.mosadd.com](https://murl.mosadd.com) ·
**By:** [mosADD](https://mosadd.dev) ·
Codename `channel0` (internal — see [naming](#naming))

> Open the extension on any website and you join a live, anonymous chat **scoped
> to that site's domain**. Walk onto `nike.com` → instantly in `#nike.com` with
> everyone else who's there right now, regardless of sub-page. The room
> **auto-creates the moment the first person arrives**. No account, no email, one click.

This is the open-source heart of mURL: a Chrome MV3 extension plus a small,
stateless backend that rides the same real-time backbone as the [mosADD](https://mosadd.dev)
comms toolkit (Cloudflare Workers + Durable Objects, Supabase as system-of-record).

> **mURL is a consumer app — not a developer platform.** It's open source for
> transparency, audit, and contributions (this repo). If you want to *add chat to
> your own product* or build chat for AI agents, that's **mIRC / the mosADD
> toolkit** → [mosadd.dev](https://mosadd.dev) (embeddable, encrypted, MCP).

- 📦 **Extension** — this folder (`apps/channel0-ext/`)
- 🌐 **Edge worker** — [`apps/edge`](../edge) (Cloudflare Worker + `ChannelDO`)
- 🔌 **Backend edge functions** — `channel0-join`, `channel0-report`, `channel0-trending`, `domain-verify`, `domain-channel-ensure`, `channel0-owner-stats` (Supabase, Deno)
- 🖥️ **Consumer site** — [`apps/murl-www`](../murl-www) → murl.mosadd.com

## Docs for developers

| Doc | What |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | How the whole thing fits together, end to end |
| [API.md](./docs/API.md) | Public HTTP + WebSocket API reference (join, trending, report, WSS protocol, domain control) |
| [SELF-HOSTING.md](./docs/SELF-HOSTING.md) | Run your own mURL backend |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to build, test, and contribute |
| [MODERATION-SOP.md](./docs/MODERATION-SOP.md) | Trust & safety operator runbook |

## Architecture at a glance

```
 Browser extension                Cloudflare edge                 Supabase
 ┌──────────────────┐  join+PoW   ┌────────────────────┐  ensure  ┌──────────────────┐
 │ content script   │ ──────────► │ channel0-join       │ ───────► │ domain_controls  │
 │  • normalize URL │  anon JWT   │  mints 5-min HS256  │  block?  │ channels         │
 │  • device token  │ ◄────────── │  channel-scoped JWT │          │ rate_limit_*     │
 │  • nick/avatar   │   WSS (token via Sec-WebSocket-Protocol)     │ messages_meta    │
 └────────┬─────────┘ ──────────► ┌────────────────────┐  flush   └──────────────────┘
          │  live msgs + presence │ Worker → ChannelDO  │ ───────► message-ingest-batch
          └───────────────────────│  idFromName(slug)   │
                                  │  WS fan-out + ring  │  GET /c/:slug/presence
                                  └────────────────────┘
```

A registrable domain (eTLD+1) like `nike.com` becomes the Worker route slug
`nike-com`; `ChannelDO.idFromName(slug)` gives auto-create at zero cost. The
browser never holds a secret key — it only ever gets a short-lived,
channel-scoped JWT. Full detail in [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Quick start (build + sideload)

```bash
npm --prefix apps/channel0-ext install
npm --prefix apps/channel0-ext run build      # → apps/channel0-ext/dist/
# Chrome → chrome://extensions → enable Developer mode → Load unpacked → pick dist/
```

Point a local install at `wrangler dev` + a local Supabase without rebuilding —
override the endpoints in extension storage:

```js
chrome.storage.sync.set({
  "channel0.endpoints": {
    joinUrl:  "http://localhost:54321/functions/v1/channel0-join",
    edgeBase: "http://127.0.0.1:8787",
  },
});
```

## What's shipped (v0.14)

- ✅ Anonymous per-domain rooms, auto-create, presence ("who's here now")
- ✅ Deterministic nick + per-install device token (rate-limit/ban key, **not** a fingerprint)
- ✅ Proof-of-work on join (hashcash, `crypto.getRandomValues`)
- ✅ WS auto-reconnect with backoff + token re-mint (no dropped sessions)
- ✅ Report → auto-hide at 3 distinct reporters; per-device + per-IP + per-WS rate limits
- ✅ Server-side flood/spam filters + global & per-domain kill switches
- ✅ Non-affiliation banner + 16+ age gate + abuse/DMCA + GDPR delete-by-sub
- ✅ Domain owners can verify (DNS TXT) → claim/brand or disable their room
- ✅ i18n (en, pl)

## Self-hosting

mURL's backend is a handful of stateless Deno edge functions + one Cloudflare
Worker. You can run the whole thing on your own Cloudflare + Supabase. See
[SELF-HOSTING.md](./docs/SELF-HOSTING.md).

## Naming

User-facing brand is **mURL**. The codebase keeps the original `channel0-*`
identifiers (file paths, edge-fn slugs, env vars, DB tables, the
`_mosadd-channel0` DNS verify record, `thread_id = chat:<slug>`). This split is
deliberate — renaming the internals would mean migrating live secrets, redeploying
the Worker, and invalidating verified-owner DNS records, for zero user value.

## License

Apache-2.0. Part of the [mosADD-OS](https://github.com/Hei33enberg/mosadd-os)
monorepo. Built by [mosADD](https://mosadd.dev). Independent of the websites the
extension appears on.
