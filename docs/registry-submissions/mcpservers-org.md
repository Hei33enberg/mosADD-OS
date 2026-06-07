# mcpservers.org — submission draft

**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — A human OS. Add.",
  "description": "Operating system for human communications. 64 live MCP tools across direct messages, ephemeral rooms with no-account guest links, channels, email, push-to-talk, knowledge recall, and agent-native per-domain chat.",
  "repo": "https://github.com/Hei33enberg/mosadd-os",
  "homepage": "https://mosadd.dev",
  "npm": "@mosadd/mcp",
  "license": "Apache-2.0",
  "author": "mosadd contributors",
  "install": "npx -y @mosadd/mcp",
  "tools_count": 64,
  "categories": ["communication", "messaging", "voice", "email"],
  "tags": ["agents", "claude", "cursor", "anthropic", "open-source", "apache-2"]
}
```

## PR description (if MDX-style listing)

> ## Add mosadd MCP server
>
> An OS for human communications, MCP-native. 64 live tools across 7 modules (mDM incl. voice, mIRC, mROOM, mAIL, mTALK, mRAG, mURL), plus the embeddable 167-event threat-engine.
>
> **Differentiator:** `mROOM_create_guest_link` generates a short-lived no-signup URL — one MCP call from any agent, no other registered server exposes this.
>
> Repo: https://github.com/Hei33enberg/mosadd-os
> NPM: `@mosadd/mcp`
> License: Apache-2.0
> Install: `npx -y @mosadd/mcp`
