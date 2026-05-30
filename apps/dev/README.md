# @m0ssad/dev — mosadd.dev developer portal

Developer portal at **[mosadd.dev](https://mosadd.dev)**. Next.js 15 + Fumadocs.

Companion site to [mosadd.com](https://mosadd.com) (end-user app) and [github.com/Hei33enberg/mosadd-os](https://github.com/Hei33enberg/mosadd-os) (OSS toolkit).

## Local dev

```bash
# From monorepo root
npm install
npm run dev --workspace @m0ssad/dev
```

Open http://localhost:3000.

## Content

All MDX in `content/docs/**`. Tree:

```
content/docs/
├── index.mdx              # /docs landing
├── quickstart.mdx         # /docs/quickstart
├── mcp.mdx                # /docs/mcp
├── modules/
│   ├── index.mdx          # /docs/modules
│   ├── mdm.mdx
│   ├── mtalk.mdx
│   └── mroom.mdx
├── sdk/
│   └── index.mdx
└── rfcs.mdx
```

Each directory needs a `meta.json` to define order in sidebar.

## Deployment

Separate Vercel project from apps/web:
- Project name: `mosadd-dev`
- Framework: Next.js (auto-detected via `vercel.json`)
- Root Directory: `apps/dev`
- Custom domains: `mosadd.dev`, `m0ssad.dev` (latter redirects → former)

## Adding new docs

1. Drop MDX file in `content/docs/<path>.mdx` with frontmatter `{ title, description }`
2. Add slug to nearest `meta.json` `pages` array
3. PR — site rebuilds on merge to main

## Status

Pre-alpha scaffold. Hero page + 3 module docs (mDM, mTALK, mROOM) + MCP overview + SDK adapters + RFC index.

Roadmap: full module reference (mAIL, mCALL, mIRC, mIRL + bridges), provider integration guides, deployment guides, Algolia search.
