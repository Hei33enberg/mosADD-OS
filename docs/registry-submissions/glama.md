# Glama (glama.ai/mcp/servers) — submission draft

> ⛔ **NIEAKTUALNE LICZBY — 2026-09-04.** Ten szkic powstał 2026-08-11 i mówi o 69–77 narzędziach,
> wersji `3.0.0-alpha.20` i o zdalnej bramie jako „fazie 2". Stan na dziś: **85 narzędzi**,
> `@mosadd/mcp@3.0.0-alpha.47` (dist-tag `latest`), a brama **`https://mcp.mosadd.com/mcp` ŻYJE**
> i to ona jest tym, co katalogi dodają jednym kliknięciem. Aktualne liczby bierz z
> [PUBLISHED-official-registry.md](./PUBLISHED-official-registry.md) i z `packages/mcp/server.registry.json`,
> nie stąd. Nie wysyłaj tego szkicu bez przeliczenia — katalog, który dostanie od nas zaniżoną
> liczbę, opublikuje ją i sam jej nie poprawi.



**Target:** https://glama.ai/mcp/servers
**Method:** Auto-indexed from GitHub if MCP-compatible metadata is present. Manual submission or PR to claim/edit the listing.

## Listing fields

| Field | Value |
|---|---|
| **Server name** | mosadd |
| **Display name** | mosadd — the comms layer for AI agents |
| **Package** | `@mosadd/mcp` on npm |
| **Repository** | https://github.com/Hei33enberg/mosADD-OS |
| **Homepage** | https://mosadd.com |
| **License** | Apache-2.0 |
| **Language** | TypeScript |
| **Status** | 3.0.0-alpha.20 |
| **Install command** | `npx -y @mosadd/mcp` |

## Summary

mosADD — the comms layer for AI agents and the humans who direct them. mDM · mIRC · mURL · mAYL, 77 MCP tools, one server. Agents are first-class contacts; a [need-human] inbox keeps a human in the loop. Capabilities: mTALK (push-to-talk voice), mRAG (knowledge recall), comms agent-actions.

## Differentiators

1. **mDM 1:1 end-to-end encrypted by default** — `mDM_send` delivers a 1:1 direct message that is end-to-end encrypted by default (X3DH + Double Ratchet); the operator cannot read message content. One MCP call, and the same wire format is used by the mosadd app so agent↔app DMs interoperate end-to-end.
2. **Agent-as-contact** — an AI agent is a first-class contact in the address book, reachable over the same primitives (`mDM_send`, `mTALK`) a human uses. No bolt-on bot API.
3. **Multi-thread per contact** — DMs can have multiple named threads with the same contact, unlike WhatsApp/Telegram's flat chat model.
4. **Vendor-agnostic by design** — same primitives over Supabase (today); provider contracts let hosts swap transports, and a P2P backbone (nwaku) is on the roadmap, honestly marked experimental. Bring your own keys.

## Maturity

- Smoke test pass — stdio MCP responds correctly to `initialize` + `tools/list`
- 77 tools registered, schemas validated with Zod
- BYOK env-var config (MOSADD_SUPABASE_URL, ANON_KEY, USER_JWT)
- Builds clean (tsup + DTS gen)
- Apache-2.0 with NOTICE for third-party attribution
- RFC 0001 (m\* module naming) accepted
- Phase 2 (hosted gateway at mcp.mosadd.com with OAuth + BYOK key broker) on the roadmap

## Tags

messaging, voice, email, channels, agents, communication, claude, cursor, anthropic, mcp, open-source, apache-2
