# mosADD Studio (mosadd.dev)

Describe a messenger in one sentence. The studio picks the closest template, applies what the sentence
asks for, validates the result with [`@mosadd/messenger`](../../packages/messenger), and shows a phone
preview with the theme and blocks. **[ SHIP ]** saves `messenger.json` and lists what will be built.

It is a static page: no backend, no account, nothing leaves the browser.

```bash
node apps/studio/scripts/build.mjs           # builds apps/studio/dist (index.html, studio.css, studio.js)
node apps/studio/scripts/build.mjs --serve   # builds and serves http://127.0.0.1:4177
node apps/studio/scripts/smoke.mjs           # build + page/bundle consistency check
```

Deploy `apps/studio/dist` to any static host.

Deep links, handy for sharing and screenshots: `?d=<sentence>&mode=light&tab=mirc`.

## What works today

- Eight templates (crew PTT, community, security and events, logistics, construction, one person with
  agents, crisis without internet, school or club), chosen by rules from the sentence.
- Name, agent on or off, offline links, joining mode, language and theme mode picked up from the sentence.
- Live validation (shape, consistency, WCAG AA contrast, honest copy and trademark), block switches,
  a measured contrast table, a phone preview with a working hold-to-talk button.

## What does not exist yet

- The fit is rules, not a model. `fitMessenger` has a `refine` hook for a model; none is wired.
- **[ SHIP ]** does not build or publish apps. It saves the description they will be built from.
- No accounts, no saved messengers, no hosting.
