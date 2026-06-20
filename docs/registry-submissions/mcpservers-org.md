# mcpservers.org — submission draft

**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — A human OS. Add.",
  "description": "Operating system for human communications. 64 live MCP tools — mDM 1:1 direct messages end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content), plus channels, email, push-to-talk, and knowledge recall.",
  "repo": "https://github.com/Hei33enberg/mosadd-os",
  "homepage": "https://mosadd.com",
  "npm": "@mosadd/mcp",
  "license": "Apache-2.0",
  "author": "mosadd contributors",
  "install": "npx -y @mosadd/mcp",
  "tools_count": 64,
  "categories": ["communication", "messaging", "voice", "email"],
  "tags": ["agents", "claude", "cursor", "anthropic", "open-source", "apache-2", "threat-classification"]
}
```

## PR description (if MDX-style listing)

> ## Add mosadd MCP server
>
> An OS for human communications, MCP-native. 64 live tools across 5 modules (mDM incl. voice, mIRC, mp0st, mTALK, mRAG), plus a pure defensive threat-event classification engine (`threat_catalog` / `threat_classify`).
>
> **Differentiator:** `mDM_send` delivers a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content. One MCP call from any agent, and the same wire format is used by the mosadd app so agent↔app DMs interoperate end-to-end.
>
> Repo: https://github.com/Hei33enberg/mosadd-os
> NPM: `@mosadd/mcp`
> License: Apache-2.0
> Install: `npx -y @mosadd/mcp`
