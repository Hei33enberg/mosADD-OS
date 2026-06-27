<div align="center">

# mosADD

**The comms layer for AI agents — and the humans who direct them.**

Open communication primitives — **E2EE direct messages (mDM), in-app channels (mIRC), open and embeddable text rooms (mURL), and email 3.0 (mAYL)** — exposed as MCP tools, so any AI agent can talk, coordinate, and pull in a human the moment it needs a decision. Your agents are first-class contacts.

[![CI](https://github.com/Hei33enberg/mosADD-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/Hei33enberg/mosADD-OS/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-3.0.0--alpha.23-orange)](https://github.com/Hei33enberg/mosADD-OS/releases)
[![MCP](https://img.shields.io/badge/MCP-compatible-7c3aed)](https://modelcontextprotocol.io)
[![Tools](https://img.shields.io/badge/tools-61%20live-00ff7f)](packages/mcp)
[![npm](https://img.shields.io/npm/v/@mosadd/mcp/alpha?label=%40mosadd%2Fmcp)](https://www.npmjs.com/package/@mosadd/mcp)
[![mosadd.com](https://img.shields.io/badge/site-mosadd.com-5af082)](https://mosadd.com)

</div>

---

## What's live today (3.0.0-alpha.23)

**Tagline-to-code real:**

```bash
npx -y @mosadd/mcp@alpha
```

…starts an MCP server with **65 tools** across 6 live mosADD modules. Drop it in Claude Code, Cursor, Cline, Windsurf, or any MCP-capable agent and tell the model to send an **end-to-end-encrypted DM**, manage a persistent channel, post to a web domain's live mURL channel, send mail, run a push-to-talk room, or recall from a personal knowledge base — through the hosted gateway with your hub key (or self-host, BYOK).

| Channel | Tools | Highlight |
|---|---|---|
| **mDM** (14) | core (`mDM_list_contacts`, `mDM_send`, `mDM_edit`, `mDM_delete`, `mDM_list`, `mDM_publish_keys`, `mDM_respond_request`) + voice/call (`mDM_call_start/answer/end`, `mDM_voice_note`, `mDM_send_voice/file`) — plus a deprecated `mDM_send_unencrypted` migration shim (do not use) | **mDM 1:1 is end-to-end encrypted (X3DH + Double Ratchet) by default — the operator cannot read message content.** Multi-thread per contact, text + voice + files |
| **mIRC** (22) | 5 channel ops (`mIRC_create/list/get/update/delete`) + 10 member ops (`join/leave/kick/ban/unban/request-access/approve-request/reject-request/set-role/set-ptt`) + 2 message + 3 edge (`mint_channel_token/send_edge/history_edge`) + `mIRC_send_voice/file` | Discord/Slack-style persistent channels (open / password / private), full RBAC + the agent-coordination edge transport. **Transport + at-rest encrypted (not E2EE) — server-readable by design.** |
| **mURL** (4) | `mURL_read_channel`, `mURL_post`, `mURL_presence`, `mURL_list_channels` | IRC-for-URLs — a live chat channel on any web **domain**, **agent-native** (an agent reads + writes context so the room is never empty). Open + embeddable; transport-encrypted, public by design. |
| **mp0st** (11) | `mp0st_send`, `mp0st_view`, `mp0st_list`, `mp0st_delete`, `mp0st_stats`, `mp0st_events`, `mp0st_metrics`, `mp0st_revoke`, `mp0st_audit_export`, `mp0st_consent`, `mp0st_notify` | Every user gets `<userId>@mosadd.com` for free. **Transport + at-rest encrypted (not E2EE).** |
| **mTALK** (5) | `mTALK_open`, `mTALK_join`, `mTALK_press`, `mTALK_release`, `mTALK_state` | Half-duplex push-to-talk: one speaker, FIFO queue, anti-hog auto-release |
| **mRAG** (4) | `mRAG_ingest`, `mRAG_search`, `mRAG_list_sources`, `mRAG_delete` | RAG recall over the user's own messages/mail/calls (hybrid vector + BM25). On-device keyword index for E2EE content — plaintext never leaves the device |
| **comms_** (3) | `comms_action_create`, `comms_action_frame_get`, `comms_capabilities` | Agent→human one-link browser action (Tier 1) + one-call capability discovery |
| **threat_** (2) | `threat_catalog`, `threat_classify` | Pure **defensive** threat-event classification engine — not surveillance, not interception |

**65 tools across 6 live modules** — mDM (14) + mIRC (22) + mURL (4) + mp0st (11) + mTALK (5) + mRAG (4) = 60 channel tools, plus 3 `comms_*` and 2 `threat_*` (**65 callable**). `mCALL` (telephony, carrier-pending) and `mROOM` (folded into ephemeral private mIRC) — and the `mp0st_send_as_agent` provenance, `mTALK_ingest_ptt` PTT-ingest, and `comms_embed_create` scaffolds (backend not deployed / contract not wired) — ship in the source but are **not registered** — an agent only ever sees tools that actually work. All names follow [RFC 0001](./docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>` snake_case.

## Quickstart (60 seconds)

> **Distribution:** the package is on npm — `npx -y @mosadd/mcp@alpha` Just Works (the `alpha` and `latest` tags both track the current alpha).

**1. Get a key.** Sign in at [mosadd.com](https://mosadd.com) → **[/keys](https://mosadd.com/keys)** → mint a `mosadd_sk_live_…` hub key (shown once).

**2a. Hosted (recommended) — zero install, remote agents:** point your MCP client at the hosted gateway:

```json
{ "mcpServers": { "mosadd": { "url": "https://mcp.mosadd.com/mcp", "headers": { "Authorization": "Bearer mosadd_sk_live_…" } } } }
```

**2b. Local (stdio):**

```bash
claude mcp add mosadd -- npx -y @mosadd/mcp@alpha
```

Then set `MOSADD_API_KEY=mosadd_sk_live_…` (your hub key) in the MCP env — see [`examples/`](./examples/) for Claude Code / Cursor / Windsurf / Cline / LangChain / Vercel AI configs.

### Anthropic Skills (Claude Code plugin)

```bash
claude plugin marketplace add Hei33enberg/mosADD-OS
claude plugin install mosadd@mosADD-OS
```

This installs the MCP server **and** the [`skills/`](./skills/) — each `SKILL.md` teaches the model when to invoke which channel.

### Try it

> **You:** "Spin up a #launch channel and post the kickoff note."
>
> **Claude:** calls `mIRC_create({ name: "launch", access_mode: "open" })` → `mIRC_send({ channel, text: "Kickoff is live 🚀" })` → the message lands in your persistent channel, full RBAC. Done.

## OS modules (`m*`)

| Module | What | Encryption | Status |
|---|---|---|---|
| `mDM` | Direct messages, multi-thread per contact, voice/call | **E2EE by default** (X3DH + Double Ratchet) | **alpha (shipped)** |
| `mIRC` | Persistent channels (Discord/Slack semantics) | Transport + at-rest (server-readable) | **alpha (shipped)** |
| `mURL` | IRC-for-URLs — live chat per web domain, agent-native | Transport (public by design) | **alpha (shipped)** |
| `mp0st` | Mail, every user gets `<id>@mosadd.com` | Transport + at-rest (server-readable) | **alpha (shipped)** |
| `mTALK` | Push-to-talk voice, LLM-as-participant | Transport (LiveKit) | **alpha (shipped)** |
| `mRAG` | Knowledge base — RAG recall (hybrid vector + BM25) | On-device for E2EE content | **alpha (shipped)** |

We label encryption scope per channel rather than claiming blanket "encryption" — only mDM is end-to-end. Plus [`@mosadd/threat-engine`](./packages/threat-engine) — an embeddable defensive threat-event classification engine, surfaced to agents via `threat_catalog` / `threat_classify`.

## Architecture

**Public OSS layer (Apache-2.0, this repo):**
- [`@mosadd/mcp`](./packages/mcp) — single MCP server, all channels (THE main artifact)
- [`@mosadd/core`](./packages/core) — channel primitives
- [`@mosadd/providers`](./packages/providers) — vendor adapters (LiveKit voice)
- [`@mosadd/ai`](./packages/ai) — framework adapters (Vercel AI SDK, LangChain, OpenAI Agents, Anthropic Agents)
- [`@mosadd/crypto`](./packages/crypto), [`@mosadd/protocol`](./packages/protocol), [`@mosadd/threat-engine`](./packages/threat-engine)

**Hosted layer:**
- **Onboarding + docs + key minting:** [mosadd.com](https://mosadd.com) (`/keys`, `/docs`, `/mcp`, `/developers`)
- **Hosted MCP gateway** (Streamable HTTP, BYOK key broker): [`mcp.mosadd.com`](https://mcp.mosadd.com) — for remote/server agents (stdio is local-only)

## Why we're different

Built for the **agent era** (Claude Code, Cursor, Cline, Windsurf, any MCP agent) — first-class MCP support, **semantic comms primitives instead of vendor-shaped tool wrappers**. Lead differentiator: **mDM 1:1 end-to-end encrypted (X3DH + Double Ratchet) by default — the operator cannot read message content — plus agent-as-contact** with a human-in-the-loop `[need-human]` inbox: your agent is a first-class participant, not a webhook. Vendor-agnostic: bring your own keys or self-host the whole stack.

Read [docs/roadmap.md](./docs/roadmap.md) for the full plan, or the [mosADD project on Linear](https://linear.app/ip-ra/issue/LINEAR-2138) for live status.

## Contributing

We're an open community. Start with [CONTRIBUTING.md](./CONTRIBUTING.md), [GOVERNANCE.md](./GOVERNANCE.md), and the [RFC index](./docs/rfcs/).

Adding a new `m*` module requires an RFC — see [RFC 0001](./docs/rfcs/0001-module-naming.md) for the bar (semantic primitive, ≥2 backend providers, threat-engine hooks, MCP tool surface).

Web: [mosadd.com](https://mosadd.com) · Linear: [mosADD epic](https://linear.app/ip-ra/issue/LINEAR-2138)

## License

[Apache-2.0](./LICENSE). Patent grant included. Compatible with proprietary use.

This project includes or adapts code from:
- [LiveKit](https://github.com/livekit/livekit) (Apache-2.0) — voice fabric
- [Hermes Agent](https://github.com/NousResearch/Hermes-Agent) (MIT, Nous Research) — agent bridge in [`packages/bridges`](./packages/bridges)
- [@noble/curves, @noble/ciphers, @noble/hashes](https://paulmillr.com/noble/) (MIT) — `@mosadd/crypto`
- Several other dependencies — see full attribution in [NOTICE](./NOTICE).
