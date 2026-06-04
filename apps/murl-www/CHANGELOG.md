# mURL site (murl.mosadd.com) — changelog

## 1.0.0 — Launch demo (2026-06-04)

First investor-launch-ready release of the standalone consumer site. Live at
**https://murl.mosadd.com** (Vercel project `murl-www`, root `apps/murl-www`).

### Site
- **Hero** with the live, animated chat panel in the **real extension look**
  (`.c0-*` IRC rows — `[hh:mm] <nick> text`, neon `#00ff7a`, 24px grid) — pixel-
  faithful to the shipped side panel. Responsive (clamped headline, no overflow).
- **ExtensionDemo** — the centerpiece: faux browser frame + floating bubble +
  full side panel 1:1, animated PL conversation on `#strajkpolski.org`.
- **Browser install buttons** — Chrome (primary) + Edge / Brave / Opera / Firefox
  with brand logos, "coming soon" until store listings exist (`BROWSERS` in
  `lib/site.ts`). No consumer-facing GitHub (that lives only in `/developers`).
- **Trending rooms** — demo ranking of the world's busiest sites with plausible,
  gently-animated "online" counts (`DEMO_MODE` in `lib/site.ts`); live
  `channel0-trending` path preserved behind the flag.
- **How it works**, **Use cases**, **Trust strip** (+ "from the makers of mosADD"),
  **FAQ**, **/privacy**, **/abuse**, **/[domain]** deep-links, **/developers**
  (funnels devs to mIRC), SEO (sitemap/robots/llms.txt/OG image).

### Brand
- Tokens verified identical to mosadd.com / mosadd.dev (black, `145 100% 50%`,
  JetBrains Mono, `--radius 0.25rem`). Consumer-warmth layer (room-accent hues,
  live animations) added on top.

### Owner flips for go-live
- Set per-browser store URLs + `live: true` in `lib/site.ts` when published.
- Set `DEMO_MODE = false` once real rooms have traffic (trending goes live).
- Optional: `NEXT_PUBLIC_POSTHOG_KEY` for the consumer funnel.

### Notes
- The chat/buttons/demo are client components — they render after JS, so raw-HTML
  curl can't see them; verify in a browser or via the page JS bundle.
- Deploy: `vercel deploy --prod` from `apps/murl-www` (not git-connected).
