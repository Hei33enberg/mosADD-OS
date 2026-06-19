# @mosadd/dev — mosadd.dev developer portal

Developer portal at **[mosadd.dev](https://mosadd.dev)**. Next.js 15 (App Router) + Tailwind v4. Standalone app (not part of the pnpm workspace) — built directly by Vercel.

Companion to [mosadd.com](https://mosadd.com) (end-user app) and [github.com/Hei33enberg/mosadd-os](https://github.com/Hei33enberg/mosadd-os) (the OSS toolkit it documents).

## Brand / design

This portal follows the mosadd brand contract — source of truth: the mosadd brand book (`app/global.css` is the canonical token set in this repo).

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
├── docs/modules/{,mdm,mirc,mail,mtalk,mrag,threat-engine}/page.tsx
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

Vercel project `mosadd-dev`, Root Directory `apps/dev`, connected to `Hei33enberg/mosadd-os`. Custom domain `mosadd.dev`.
