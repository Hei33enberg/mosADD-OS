# @mosadd/channel0-ext — "channel 0 [mIRC]" browser extension

Anonymous live chat scoped to the domain you're on. Walk onto `zalando.pl` → instantly in `#zalando.pl` with everyone else who's there right now, regardless of subpage. **The channel auto-creates the moment the first user joins.**

> Store name: **channel 0 [mIRC] — with mosadd inside**
> Codename: `channel0` · Epic: [LINEAR-2688](https://linear.app/ip-ra/issue/LINEAR-2688)

## How it works (P0)

```
content script ─► channel0-join (Supabase edge fn) ─► HS256 channel token (5 min)
              ─► WSS to Cloudflare Worker /c/<slug>/ws (token in Sec-WebSocket-Protocol)
              ─► live messages + presence (ChannelDO ring + WS fan-out)
              ─► flushed async to messages_meta (durable system-of-record)
```

A registrable domain (eTLD+1) like `zalando.pl` becomes the Worker route slug `zalando-pl`. `ChannelDO.idFromName(slug)` is what gives us auto-create at zero cost.

## Local dev

```bash
pnpm -C apps/channel0-ext install
pnpm -C apps/channel0-ext build        # → dist/
# Chrome → chrome://extensions → enable Developer mode → Load unpacked → pick dist/
```

Point at `wrangler dev` + a local Supabase by overriding endpoints in `chrome.storage.sync`:

```js
chrome.storage.sync.set({
  "channel0.endpoints": {
    joinUrl:  "http://localhost:54321/functions/v1/channel0-join",
    edgeBase: "http://127.0.0.1:8787",
  },
});
```

## P0 verification (two-browser smoke)

1. `wrangler dev` the Worker (`apps/edge`).
2. `supabase functions serve channel0-join` (m0ssad-3 repo, with `CHANNEL_TOKEN_SECRET`).
3. Load `dist/` as unpacked extension in two Chrome profiles.
4. Open the same domain in both → confirm:
   - Each side sees the other in the presence count.
   - Messages appear live both ways.
   - Reloading shows recent history (DO ring buffer).
   - A row lands in `messages_meta` with `thread_id=chat:<slug>` (after flush).

## Trust & safety (what's in P0 vs P1)

- ✅ Non-affiliation banner in every panel.
- ✅ "Powered by mosadd" badge — the brand-energizer.
- ✅ Per-device + per-IP rate-limit at the mint endpoint.
- ✅ Per-WS rate-limit in the Worker.
- ✅ 451 propagation if a verified domain owner has disabled the channel.
- ⏳ Proof-of-work (P1, [LINEAR-2696](https://linear.app/ip-ra/issue/LINEAR-2696)).
- ⏳ Report/moderation (P1, [LINEAR-2697](https://linear.app/ip-ra/issue/LINEAR-2697)).
- ⏳ Profanity + link-flood filter (P1, [LINEAR-2698](https://linear.app/ip-ra/issue/LINEAR-2698)).
- ⏳ Age gate + DMCA/abuse contact UI (P1, [LINEAR-2701](https://linear.app/ip-ra/issue/LINEAR-2701)) — **public-launch gate**.

## Legal posture

The extension overlays a chat scoped to a third-party domain. Every panel renders:

> Niezależny czat — niezwiązany z {domain}. Powered by mosadd.

Verified domain owners can disable their channel for free via [mosadd.dev/domains](https://mosadd.dev) (C2-1, [LINEAR-2702](https://linear.app/ip-ra/issue/LINEAR-2702)). Paid Claim/Brand is the monetization track — owner verification gate at DNS TXT, never inference.
