# `@mosadd/embed` — mIRC widget for any website

Drop-in chat embed. Six lines of HTML on your blog / Webflow / WordPress / news site → real-time mIRC channel. Visitors can join with just a nick (anonymous) or log in with mosadd for cross-site identity. Backed by Cloudflare Durable Objects (sub-100ms fan-out, scales per-channel).

## Quickstart (for a creator)

1. Sign in at https://mosadd.dev/hub
2. Create an embed key — set the channel name + the domain(s) you'll embed on.
3. Paste these 6 lines into your site:

```html
<div id="mosadd-mirc"
     data-channel="my-channel"
     data-position="sidebar-right">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="m_pk_live_…">
</script>
```

That's it. Visitors get the default `mosadd-mIRC` skin (mosadd-branded frame, retro mIRC chat inside). No build, no React, no framework.

## Attributes

| attribute | values | default | description |
|---|---|---|---|
| `data-channel` | string | `default` | Channel id — visitors share a room per channel. |
| `data-position` | `inline` / `sidebar-left` / `sidebar-right` / `floating-bl` / `floating-br` / `fullscreen` | `inline` | Where the widget renders. |
| `data-skin` | `default` / `retro-irc-1990` / `terminal` / `minimal-dark` / `minimal-light` / URL to `.mosaddskin` | `default` | Visual skin. URL skin = Pro+ tier. |
| `data-anon` | `true` / `false` | `true` | Allow visitors with just a nick (no account). |
| `data-locale` | `en` / `pl` | `en` | UI language. |
| `data-title` | string | `mIRC` | Header title. |

## What gets sent to the browser

- A publishable key `m_pk_live_…` — safe to ship in HTML, scoped to one creator + an allow-list of domains.
- **Never** your hub key (`mosadd_sk_live_…`) — that stays server-side, gates only the MCP toolkit.

When a visitor opens the page, the widget POSTs the publishable key + their channel + their anonymous sub to `mirc-embed-token`. The server validates the request's Origin against the key's allow-list, checks the channel + MAT cap, and mints a 5-min channel-scoped JWT. The browser opens a WS to the Cloudflare DO with that JWT (`Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>`) — exactly the same auth path documented for Strajk in HANDOFF-15. The hub key never enters the browser.

## Pricing

See [mosadd.dev/pricing](https://mosadd.dev/pricing). The unit is **MAT** — Monthly Active Talkers (unique senders per month). Viewers are free, messages are not metered. Free tier covers 1,000 MAT — enough for a small community blog.

Self-host the whole thing for $0 forever (the Worker + this bundle are Apache-2.0).

## Skin Shop

Browse + apply skins at [mosadd.dev/skins](https://mosadd.dev/skins). Live editor at [mosadd.dev/skins/editor](https://mosadd.dev/skins/editor). Contribute a skin via PR to [`mosadd-os/skins/`](https://github.com/Hei33enberg/mosadd-os/tree/main/skins).

## Local dev

```sh
npm install
npm run build           # → dist/v1.js
npm run dev             # watch mode
```

Open `examples/strajk-style.html` in a browser to render the widget with the default skin against the prod backend (you'll need a test publishable key with your `file://` origin in the allow-list).

## Hosting

CDN target: `https://embed.mosadd.com/v1.js`. Served from Vercel via the same `mosadd-os/apps/dev` deployment (rewrite `/v1.js` → `apps/embed/dist/v1.js`) or as its own Vercel project — TBD when DNS lands.

## License

Apache-2.0. Bundle source = `src/`. Default skin = `src/skins/default.css`.
