# Glama (glama.ai/mcp/servers) — submission draft

**Target:** https://glama.ai/mcp/servers
**Method:** Auto-indexed from GitHub if MCP-compatible metadata is present. Manual submission or PR to claim/edit the listing.

## Listing fields

| Field | Value |
|---|---|
| **Server name** | mosadd |
| **Display name** | mosadd — A human OS. Add. |
| **Package** | `@mosadd/mcp` on npm |
| **Repository** | https://github.com/Hei33enberg/mosadd-os |
| **Homepage** | https://mosadd.dev |
| **License** | Apache-2.0 |
| **Language** | TypeScript |
| **Status** | 3.0.0-alpha.0 |
| **Install command** | `npx -y @mosadd/mcp` |

## Summary

mosadd is an MCP-native operating system for human communications. **59 live tools across 6 live modules** in alpha (mDM, mIRC, mROOM, mAIL, mTALK, mRAG), plus the embeddable `@mosadd/threat-engine` 167-event radar.

## Differentiators

1. **Semantic OS primitives** vs vendor-wrappers. `mROOM_create_guest_link` is one MCP call; competitors require composing 4-5 SDKs.
2. **No-account join links** — generate a short-lived URL that lets a guest enter a room without signing up for mosadd. No other registered MCP server exposes this.
3. **Multi-thread per contact** — DMs can have multiple named threads with the same contact, unlike WhatsApp/Telegram's flat chat model.
4. **167-event threat radar** middleware — every operation emits events; Phase 2 hub scores them and can block abuse, deepfakes, prompt-injection cross-platform.
5. **Vendor-agnostic by design** — same primitives over Supabase (today), with a forked LiveKit + nwaku P2P backbone in follow-ups. Your keys or self-host.

## Maturity

- Smoke test pass — stdio MCP responds correctly to `initialize` + `tools/list`
- 59 tools registered, schemas validated with Zod
- BYOK env-var config (MOSADD_SUPABASE_URL, ANON_KEY, USER_JWT)
- Builds clean (tsup + DTS gen)
- Apache-2.0 with NOTICE for third-party attribution
- RFC 0001 (m\* module naming) accepted
- Phase 2 (hosted gateway at mcp.mosadd.com with OAuth + BYOK key broker) on the roadmap

## Tags

messaging, voice, email, rooms, channels, agents, communication, claude, cursor, anthropic, mcp, open-source, apache-2
