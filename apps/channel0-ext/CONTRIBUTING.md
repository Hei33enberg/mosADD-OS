# Contributing to mURL

mURL (codename `channel0`) is open source (Apache-2.0) and part of the
[mosADD-OS](https://github.com/Hei33enberg/mosadd-os) monorepo. Issues and PRs
welcome.

## Project layout

```
apps/channel0-ext/        # this extension (Chrome MV3, Vite)
  src/content/            # content script (shadow-root panel + bubble + age gate)
  src/sidepanel/          # side panel (chat + settings + trending)
  src/shared/             # chat shell + styles
  src/lib/                # domain, nick, pow, client, identity, moderation, i18n
  public/                 # manifest.json, _locales/, assets/
  docs/                   # ARCHITECTURE, API, SELF-HOSTING, MODERATION-SOP
apps/edge/                # Cloudflare Worker + ChannelDO
apps/murl-www/            # consumer site (murl.mosadd.com)
```
Backend edge functions live in the `m0ssad-3` repo under `supabase/functions/`.

## Build & check

```bash
npm --prefix apps/channel0-ext install
npm --prefix apps/channel0-ext run typecheck   # tsc --noEmit
npm --prefix apps/channel0-ext run build        # → dist/
```

Load `dist/` via `chrome://extensions → Developer mode → Load unpacked`. See the
[README](./README.md) for pointing a dev build at `wrangler dev` + local Supabase,
and [SELF-HOSTING.md](./docs/SELF-HOSTING.md) for the backend.

## Conventions

- **Naming:** user-facing strings say **mURL**; code identifiers stay `channel0-*`
  (paths, edge-fn slugs, env vars, DB tables, the `_mosadd-channel0` DNS record).
  Don't rename the internals — see the README "Naming" note for why.
- **Privacy first:** no fingerprinting, no reading host-page DOM/content, message
  text always rendered via `textContent` (never `innerHTML`), nonces via
  `crypto.getRandomValues`. New code must keep these invariants.
- **i18n:** user-facing copy goes through `src/lib/i18n.ts` + `public/_locales/`
  (en + pl). Add a key to all three.
- **Security/abuse:** the server is authoritative; client filters are UX only.
- Keep `typecheck` + `build` green; bump `public/manifest.json` `version` for a
  releasable change.

## Reporting security issues

Please **don't** open a public issue for a vulnerability. Email
`security@mosadd.dev` (or see the repo Security policy). Abuse/DMCA on the live
service: see [murl.mosadd.com/abuse](https://murl.mosadd.com/abuse).
