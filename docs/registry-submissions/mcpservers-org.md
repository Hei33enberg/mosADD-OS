# mcpservers.org — submission draft

**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — A human OS. Add.",
  "description": "Operating system for human communications. 38 MCP tools across direct messages, ephemeral rooms with no-account guest links, channels, email, push-to-talk, and knowledge recall.",
  "repo": "https://github.com/Hei33enberg/mosadd-os",
  "homepage": "https://mosadd.dev",
  "npm": "@mosadd/mcp",
  "license": "Apache-2.0",
  "author": "mosadd contributors",
  "install": "npx -y @mosadd/mcp",
  "tools_count": 38,
  "categories": ["communication", "messaging", "voice", "email"],
  "tags": ["agents", "claude", "cursor", "anthropic", "open-source", "apache-2"]
}
```

## PR description (if MDX-style listing)

> ## Add mosadd MCP server
>
> An OS for human communications, MCP-native. 38 tools today (mDM, mIRC, mROOM, mAIL, mTALK, mKB), with mCALL / mIRL / bridges (Telegram, Discord, Matrix, Slack, Signal) landing in Phase 1 follow-ups.
>
> **Differentiator:** `mROOM_create_guest_link` generates a short-lived no-signup URL — one MCP call from any agent, no other registered server exposes this.
>
> Repo: https://github.com/Hei33enberg/mosadd-os
> NPM: `@mosadd/mcp`
> License: Apache-2.0
> Install: `npx -y @mosadd/mcp`
