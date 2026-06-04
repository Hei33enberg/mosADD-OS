# `mosadd-os/skins/` — community skin library for the embed widget

This directory holds visual skins for the `<script>`-based mosadd embed widget (see `apps/embed/`). Skins are **Apache-2.0** and **free** — no marketplace, no rev-share. We curate quality, the community contributes the variety.

## Format: `.mosaddskin`

A skin is a directory (or zipped directory with the `.mosaddskin` extension) with:

```
my-skin/
├── manifest.json
├── style.css              # the actual CSS (overrides default tokens)
├── preview.png            # optional, 600×400 — shown in the gallery
└── assets/                # optional, fonts/sounds/images referenced from style.css
    └── (anything)
```

### `manifest.json`

```json
{
  "name": "retro-irc-1990",
  "version": "1.0.0",
  "author": "@you",
  "license": "Apache-2.0",
  "description": "Pure 1990s mIRC look — pixel font, beige bg, red accent.",
  "base_skin": "default",
  "preview": "preview.png",
  "tags": ["retro", "irc", "mirc"]
}
```

Required fields: `name`, `version`, `license`. Everything else optional.

`base_skin: "default"` means: load the default CSS first (gives you all the `.m-*` class names + CSS variables), then your `style.css` is appended and overrides what it touches. Setting `base_skin: null` gives you a blank canvas (you own the whole render — only for advanced cases).

### `style.css` — what you can change

The default skin (`apps/embed/src/skins/default.css`) defines CSS variables and the `.m-*` class structure. The simplest skin only overrides the variables:

```css
:host, .m-root {
  --m-bg: #f4eeda;
  --m-fg: #1a1a1a;
  --m-primary: #b91c1c;
  --m-font: "VT323", monospace;
  --m-radius: 0;
}
```

More involved skins can restyle individual elements (`.m-msg`, `.m-nick`, `.m-stream`, `.m-input`, `.m-badge`, etc.). See the default skin for the structure.

## Submitting a skin

1. Fork [`Hei33enberg/mosadd-os`](https://github.com/Hei33enberg/mosadd-os).
2. Create `skins/<your-skin-name>/`.
3. Add `manifest.json`, `style.css`, optional `preview.png` + `assets/`.
4. Run the validator (TBD): `npm run validate-skins`.
5. Open a PR. We review for quality + safety (no remote-loaded assets, no script execution, no PII collection).

Approved skins ship with the next embed bundle release and become selectable as `data-skin="<name>"`.

## License rules

- Your skin = Apache-2.0 (same as the rest of the repo). Means: anyone can use it on any site (including commercial). Attribution preserved through the manifest.
- Don't ship copyrighted fonts/images you don't have rights to redistribute. Use SIL-licensed fonts (Google Fonts open-license set) and self-made art.
- No skin can include JavaScript. CSS + assets only.

## Phase 1 — what ships first

These five are in `apps/embed/src/skins/` and bundled into `v1.js` directly (so a creator can use them with `data-skin="<name>"` zero-config):

- `default` — mosadd brand frame + mIRC retro chat (the OOTB look)
- `retro-irc-1990` — full vintage mIRC (planned, post-Phase-1)
- `terminal` — green-on-black hacker terminal (planned)
- `minimal-dark` — modern dark, no scanlines (planned)
- `minimal-light` — modern light, day-mode (planned)

Skins added to `skins/` via PR are fetched lazily by the widget when a creator references them by name from the gallery.

## License

Apache-2.0. Each skin retains its `manifest.json` `license` field (must be Apache-2.0 or MIT to be accepted).
