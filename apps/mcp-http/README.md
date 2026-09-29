# apps/mcp-http — moved

The gateway behind the older `https://mcp.mosadd.com/mcp` endpoint is part of the hosted service, so its code left this
public repository on 2026-09-29 (history up to commit `69e8b0d` stays here). The client side stays MIT: `packages/mcp`,
`packages/m0s` and the skills.

`vercel.json` in this folder fails its build on purpose: a `vercel deploy` started from an old checkout of this path
stops with an error instead of replacing the running gateway.
