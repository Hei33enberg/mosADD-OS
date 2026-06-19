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
| **Homepage** | https://mosadd.com |
| **License** | Apache-2.0 |
| **Language** | TypeScript |
| **Status** | 3.0.0-alpha.16 |
| **Install command** | `npx -y @mosadd/mcp` |

## Summary

mosadd is an MCP-native operating system for human communications. **64 live tools across 5 live modules** in alpha (mDM, mIRC, mp0st, mTALK, mRAG), plus a pure defensive threat-event classification engine (`threat_catalog` / `threat_classify`).

## Differentiators

1. **End-to-end encryption with sealed sender** — `mDM_send` delivers a fully E2EE direct message where the relay never learns who sent it. One MCP call; no other registered server exposes sealed-sender DMs.
2. **Agent-as-contact** — an AI agent is a first-class contact in the address book, reachable over the same primitives (`mDM_send`, `mTALK`) a human uses. No bolt-on bot API.
3. **Multi-thread per contact** — DMs can have multiple named threads with the same contact, unlike WhatsApp/Telegram's flat chat model.
4. **Defensive threat-event engine** — `threat_classify` is a pure, surveillance-free classifier over communication-threat events (`threat_catalog` enumerates the taxonomy). It scores events you feed it; it does not monitor anyone.
5. **Vendor-agnostic by design** — same primitives over Supabase (today), with a forked LiveKit + nwaku P2P backbone in follow-ups. Your keys or self-host.

## Maturity

- Smoke test pass — stdio MCP responds correctly to `initialize` + `tools/list`
- 64 tools registered, schemas validated with Zod
- BYOK env-var config (MOSADD_SUPABASE_URL, ANON_KEY, USER_JWT)
- Builds clean (tsup + DTS gen)
- Apache-2.0 with NOTICE for third-party attribution
- RFC 0001 (m\* module naming) accepted
- Phase 2 (hosted gateway at mcp.mosadd.com with OAuth + BYOK key broker) on the roadmap

## Tags

messaging, voice, email, channels, agents, communication, claude, cursor, anthropic, mcp, open-source, apache-2, threat-classification
