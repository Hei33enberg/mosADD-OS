# @mosadd/dev — mosadd.dev developer portal

Developer portal at **[mosadd.dev](https://mosadd.dev)**. Next.js 15 (App Router) + Tailwind v4. Standalone app (not part of the pnpm workspace) — built directly by Vercel.

Companion to [mosadd.com](https://mosadd.com) (end-user app) and [github.com/Hei33enberg/mosadd-os](https://github.com/Hei33enberg/mosadd-os) (the OSS toolkit it documents).

## Brand / design

This portal follows the mosadd brand contract — source of truth: `m0ssad-3/docs/BRANDBOOK.md` + `m0ssad-3/apps/web/src/index.css`.

- **JetBrains Mono only** (loaded via `next/font` in `app/layout.tsx`).
- **HSL design tokens** in `app/global.css` (`:root` + Tailwind v4 `@theme inline`): pure black background, neon-green primary (`145 100% 50%`), brutalist radius. Never hardcode hex — use semantic utilities (`bg-background`, `text-primary`, `border-border`, `text-muted-foreground`).
- Dark-only. Motifs: grid background, scanlines, HUD corner brackets, glow, terminal cursor (utility classes in `global.css`).
- Wordmark: `mosadd™` lockup via `app/_components/Logo.tsx` — never paired with an icon.

## Structure

App Router pages under `app/` (TSX, not MDX):

```
app/
├── (home)/page.tsx          # landing
├── layout.tsx               # font + grid backdrop + header/footer
├── global.css               # brand tokens + motifs
├── _components/             # Logo, SiteHeader, SiteFooter, Prose, Terminal
├── docs/{mcp,quickstart,sdk,rfcs,security}/page.tsx
├── docs/modules/{,mdm,mirc,mroom,mail,mtalk}/page.tsx
├── {download,examples,community,changelog,pricing,status}/page.tsx
└── opengraph-image.tsx / twitter-image.tsx
```

`download` + `changelog` pull live data from the GitHub Releases API (ISR).

## Local dev

```bash
cd apps/dev
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deployment

Vercel project `mosadd-dev`, Root Directory `apps/dev`, connected to `Hei33enberg/mosADD-OS`. Custom domains `mosadd.dev` (+ `m0ssad.dev` → 308 redirect).
