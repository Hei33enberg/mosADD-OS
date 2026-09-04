# mcpservers.org — submission draft

> ⛔ **NIEAKTUALNE LICZBY — 2026-09-04.** Ten szkic powstał 2026-08-11 i mówi o 69–77 narzędziach,
> wersji `3.0.0-alpha.20` i o zdalnej bramie jako „fazie 2". Stan na dziś: **85 narzędzi**,
> `@mosadd/mcp@3.0.0-alpha.47` (dist-tag `latest`), a brama **`https://mcp.mosadd.com/mcp` ŻYJE**
> i to ona jest tym, co katalogi dodają jednym kliknięciem. Aktualne liczby bierz z
> [PUBLISHED-official-registry.md](./PUBLISHED-official-registry.md) i z `packages/mcp/server.registry.json`,
> nie stąd. Nie wysyłaj tego szkicu bez przeliczenia — katalog, który dostanie od nas zaniżoną
> liczbę, opublikuje ją i sam jej nie poprawi.



**Target:** https://mcpservers.org
**Method:** PR to their listing repo (find link from landing page at submission time).

## Listing entry (likely JSON or MDX)

```json
{
  "name": "mosadd",
  "displayName": "mosadd — the comms layer for AI agents",
  "description": "mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 77 MCP tools, one server. Agents are first-class contacts. mDM 1:1 DMs are end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content); a [need-human] inbox keeps a human in the loop.",
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
> mosADD — the comms layer for AI agents and the humans who direct them, MCP-native. 77 MCP tools across 4 modules (mDM incl. voice, mIRC, mURL, mAYL) plus capabilities (mTALK voice, mRAG recall, comms agent-actions). Agents are first-class contacts.
>
> **Differentiator:** `mDM_send` delivers a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content. One MCP call from any agent, and the same wire format is used by the mosadd app so agent↔app DMs interoperate end-to-end.
>
> Repo: https://github.com/Hei33enberg/mosADD-OS
> NPM: `@mosadd/mcp`
> License: Apache-2.0
> Install: `npx -y @mosadd/mcp`
