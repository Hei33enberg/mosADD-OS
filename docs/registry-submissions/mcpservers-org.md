# mcpservers.org — submission draft

**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — A human OS. Add.",
  "description": "Operating system for human communications. 17 MCP tools across direct messages, ephemeral rooms with no-account guest links, channels, and email.",
  "repo": "https://github.com/Hei33enberg/mosadd-os",
  "homepage": "https://mosadd.dev",
  "npm": "@m0ssad/mcp",
  "license": "Apache-2.0",
  "author": "mosadd contributors",
  "install": "npx -y @m0ssad/mcp",
  "tools_count": 17,
  "categories": ["communication", "messaging", "voice", "email"],
  "tags": ["agents", "claude", "cursor", "anthropic", "open-source", "apache-2"]
}
```

## PR description (if MDX-style listing)

> ## Add mosadd MCP server
>
> An OS for human communications, MCP-native. 17 tools today (mDM, mIRC, mROOM, mAIL), with mTALK / mCALL / mIRL / bridges (Telegram, Discord, Matrix, Slack, Signal) landing in Phase 1 follow-ups.
>
> **Differentiator:** `mROOM_create_guest_link` generates a short-lived no-signup URL — one MCP call from any agent, no other registered server exposes this.
>
> Repo: https://github.com/Hei33enberg/mosadd-os
> NPM: `@m0ssad/mcp`
> License: Apache-2.0
> Install: `npx -y @m0ssad/mcp`
