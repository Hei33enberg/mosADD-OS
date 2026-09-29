# apps/embed — moved

The widget served at `https://embed.mosadd.com/v1.js` is part of the hosted service, so its code left this public
repository on 2026-09-29 (history up to commit `69e8b0d` stays here). Skins for it stay MIT in [`skins/`](../../skins/).

`vercel.json` in this folder fails its build on purpose: a `vercel deploy` started from an old checkout of this path
stops with an error instead of replacing the running widget.
