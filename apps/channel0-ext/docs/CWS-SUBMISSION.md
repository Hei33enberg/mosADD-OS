# Chrome Web Store submission — channel 0 [mIRC]

Everything you need to copy/paste into the CWS Developer Dashboard, plus the
permission justifications Google asks for under MV3 review.

## One-time prerequisites (owner action)

- [ ] Pay the **$5 one-time CWS developer registration fee** at
  https://chrome.google.com/webstore/devconsole/register
- [ ] Verify the publisher domain `mosadd.dev` (Search Console TXT record)
- [ ] Create the listing draft (Add new item → upload the `.zip` from below)

## Build the upload zip

```bash
cd apps/channel0-ext
npm run build
cd dist
zip -r ../channel0-ext-v0.5.0.zip .
```

Upload `channel0-ext-v0.5.0.zip` as a fresh item.

## Store listing fields

### Name
```
channel 0 [mIRC] — with mosadd inside
```

### Short description (132 char max)
```
Anonymous live chat scoped to whichever domain you are on. Open it on any site to talk to everyone there right now.
```
(127 chars — fits.)

### Detailed description
```
channel 0 [mIRC] turns every website on earth into a live IRC-style chat
room.

Open it on zalando.pl and you are instantly in #zalando.pl with every
other shopper there right now. Switch to allegro.pl — you are in
#allegro.pl. The channel auto-creates the moment the first user joins.
No accounts. No email. No phone. Just a random nick and you are in.

PRIVACY-FIRST
• No accounts. No tracking. No browsing history collected.
• We only ever see the registrable domain (zalando.pl), never the
  full URL or page content.
• Random per-install device token, hashed server-side, used only for
  rate limit + ban.
• No third-party fingerprinting library.

POWERED BY THE MOSADD KERNEL
The same Cloudflare Worker + Durable Object backbone that powers the
mosadd developer toolkit (https://mosadd.dev). One DO per channel,
hibernatable WebSockets, async flush to a durable system-of-record.
Proven at internet scale.

ANTI-SPAM
SHA-256 proof-of-work hashcash at join time. Invisible to humans
(~100ms once on first visit), brutal to bot fleets.

DOMAIN OWNERS
If you own a domain and want to disable the chat on it, you can do
that for free by verifying ownership via DNS TXT at
https://mosadd.dev/channel0#own-a-domain. Branded "official" channels
are a paid tier.

OPEN SOURCE
Apache-2.0 licensed. Code at:
https://github.com/Hei33enberg/mosadd-os/tree/main/apps/channel0-ext

Privacy policy: https://mosadd.dev/channel0/privacy
```

### Category
```
Social & Communication
```

### Language
```
English (primary), Polish (translated)
```

### Support email
```
support@mosadd.dev
```

### Privacy policy URL
```
https://mosadd.dev/channel0/privacy
```

### Homepage URL
```
https://mosadd.dev/channel0
```

## Single purpose (required by CWS)

```
The single purpose of this extension is to provide a live, anonymous
chat that is scoped to the registrable domain of the page the user is
viewing. Every user on the same domain joins the same chat room. No
other behavior is performed.
```

## Permission justifications

Copy each into the corresponding "justification" textarea in the CWS dashboard.

### `host_permissions: <all_urls>`
```
channel 0 is a per-domain chat. To run the chat panel on the page the
user is currently viewing, the content script must be injectable on
any website. The script only reads document.location.hostname to
compute the room name and renders a chat panel inside a closed shadow
root. It does NOT read page DOM, page text, form values, cookies, or
any other site data. It opens a WebSocket only to the mosadd-operated
backbone (mosadd-edge.mr-brics-33.workers.dev).
```

### `permissions: activeTab`
```
Used by the side panel and the popup-style settings overlay to read
the active tab's URL so we can compute the registrable domain for the
room. Only the hostname is used.
```

### `permissions: tabs`
```
The side panel listens for tab activation / URL changes via
chrome.tabs.onActivated and chrome.tabs.onUpdated so that switching
tabs auto-switches the visible chat room to the new domain's room.
Only the URL field is read.
```

### `permissions: sidePanel`
```
The recommended (and default) way to open the chat: clicking the
toolbar icon opens the chat in the native Chrome side panel rather
than as a floating overlay, so it does not obscure page content.
```

### `permissions: storage`
```
chrome.storage.local stores the random device token (UUID v4) used
for rate-limit / ban. chrome.storage.sync stores per-domain nick
overrides and bubble position so they roam between browsers.
```

## Screenshots (5 max, 1280x800 or 640x400)

Owner: take five screenshots from a real install and upload them. Suggested:

1. **Side panel on a popular site** — Show the brutalist mIRC chrome
   with `mIRC #zalando.pl`, the pre-join nick form, and the green
   "ENTER" button visible.
2. **Chat in action** — Two messages between two nicks, presence
   "2 ONLINE" in the header, the kratownica background visible.
3. **Floating panel mode** — Showing the alternate UX with the
   draggable bubble in the corner and the chat panel above it.
4. **Settings overlay** — Settings tab with the "Open chat in" segmented
   control toggled between Side panel / Floating panel.
5. **Domain owner disable** — A screenshot of mosadd.dev/channel0
   showing the "I own a domain" section.

## Promo tile (small, 440x280)

`public/assets/promo-440x280.png` — already in the build. Drag-and-drop it
into the dashboard.

## Marquee promo tile (1400x560)

Owner: generate from the same source / style or skip (optional).

## Pre-publish checklist

- [ ] Privacy policy URL returns 200 (after mosadd.dev redeploy): `curl -I https://mosadd.dev/channel0/privacy`
- [ ] Single-purpose statement matches manifest behavior (it does — only domain-scoped chat)
- [ ] PoW gate live (CHANNEL0_POW_BITS=12 set on Supabase channel0-join secrets — verified 2026-06-03)
- [ ] Non-affiliation banner rendered in every chat panel ("Independent chat — DOMAIN is not affiliated. Powered by mosadd.")
- [ ] Report flow + auto-hide (C1-2 LINEAR-2697 — TODO before public launch)
- [ ] Profanity filter + link-flood throttle (C1-3 LINEAR-2698 — TODO before public launch)
- [ ] Counsel review of public-launch posture (legal-safety UI C1-6 — banner already in)

## Review timeline expectation

MV3 first-time review takes 1-3 weeks for an extension with `<all_urls>`. Plan accordingly.
