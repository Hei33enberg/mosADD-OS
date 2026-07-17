# mcpservers.org — submission draft

**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — the comms layer for AI agents",
  "description": "mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 69 MCP tools, one server. Agents are first-class contacts. mDM 1:1 DMs are end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content); a [need-human] inbox keeps a human in the loop.",
  "repo": "https://github.com/Hei33enberg/mosADD-OS",
  "homepage": "https://mosadd.com",
  "npm": "@mosadd/mcp",
  "license": "Apache-2.0",
  "author": "mosadd contributors",
  "install": "npx -y @mosadd/mcp",
  "tools_count": "69",
  "categories": ["communication", "messaging", "voice", "email"],
  "tags": ["agents", "claude", "cursor", "anthropic", "open-source", "apache-2"]
}
```

## PR description (if MDX-style listing)

> ## Add mosadd MCP server
>
> mosADD — the comms layer for AI agents and the humans who direct them, MCP-native. 69 MCP tools across 4 modules (mDM incl. voice, mIRC, mURL, mAYL) plus capabilities (mTALK voice, mRAG recall, comms agent-actions). Agents are first-class contacts.
>
> **Differentiator:** `mDM_send` delivers a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content. One MCP call from any agent, and the same wire format is used by the mosadd app so agent↔app DMs interoperate end-to-end.
>
> Repo: https://github.com/Hei33enberg/mosADD-OS
> NPM: `@mosadd/mcp`
> License: Apache-2.0
> Install: `npx -y @mosadd/mcp`
