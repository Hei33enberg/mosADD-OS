<div align="center">

# mosadd

**A human OS. Add.**

`m·os·add` — operating system for human communications.
Modular primitives — DMs, channels, rooms, push-to-talk, email, knowledge — and you `add` what you need.

[![CI](https://github.com/Hei33enberg/mosadd-os/actions/workflows/ci.yml/badge.svg)](https://github.com/Hei33enberg/mosadd-os/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-3.0.0--alpha-orange)](https://github.com/Hei33enberg/mosadd-os/releases)
[![MCP](https://img.shields.io/badge/MCP-compatible-7c3aed)](https://modelcontextprotocol.io)
[![Tools](https://img.shields.io/badge/tools-57%20live-00ff7f)](packages/mcp)
[![Release](https://img.shields.io/github/v/release/Hei33enberg/mosadd-os?include_prereleases&label=release)](https://github.com/Hei33enberg/mosadd-os/releases)
[![mosadd.dev](https://img.shields.io/badge/site-mosadd.dev-5af082)](https://mosadd.dev)

</div>

---

## What's live today (3.0.0-alpha.4)

**Tagline-to-code real:**

```bash
npx -y @mosadd/mcp
```

…starts an MCP server with **57 tools** across 6 live mosadd OS modules. Drop it in Claude Code, Cursor, Cline, Windsurf, or any MCP-capable agent and tell the model to send a DM, spin up an ephemeral room with a no-signup join link, manage a persistent channel, send mail, run a push-to-talk room, or recall facts from its own knowledge base — all through your own mosadd backend (BYOK).

| Channel | Tools | Highlight |
|---|---|---|
| **mDM** (12) | `mDM_list_contacts`, `mDM_send`, `mDM_send_unencrypted`, `mDM_edit`, `mDM_delete`, `mDM_list`, `mDM_publish_keys`, `mDM_respond_request` + 4 voice ops | Multi-thread per contact (USP) + X3DH/Double-Ratchet E2EE, text + voice |
| **mIRC** (20) | 5 channel ops (`mIRC_create/list/get/update/delete`) + 10 member ops (`join/leave/kick/ban/unban/request-access/approve-request/reject-request/set-role/set-ptt`) + message + admin ops | Discord/Slack-style persistent channels, full RBAC + chat |
| **mROOM** (9) | `mROOM_create`, **`mROOM_create_guest_link`**, `mROOM_join/leave/close/list`, `mROOM_send_message`, `mROOM_list_messages` | **No other registered MCP server exposes single-call guest links** |
| **mTALK** (5) | `mTALK_open`, `mTALK_join`, `mTALK_press`, `mTALK_release`, `mTALK_state` | Half-duplex push-to-talk: one speaker, FIFO queue, anti-hog auto-release |
| **mAIL** (7) | `mAIL_send`, `mAIL_view`, `mAIL_list`, `mAIL_delete`, `mAIL_stats`, `mAIL_events`, `mAIL_metrics` | Every user gets `<userId>@mosadd.com` for free |
| **mRAG** (4) | `mRAG_ingest`, `mRAG_search`, `mRAG_list_sources`, `mRAG_delete` | RAG recall over the user's own messages/emails/calls (hybrid vector+BM25) |

**57 tools across 6 live modules** (12+20+9+5+7+4), plus the `comms_capabilities` discovery tool. All names follow [RFC 0001](./docs/rfcs/0001-module-naming.md) — `m<MODULE>_<operation>` snake_case.

## Quickstart (60 seconds)

> **Alpha distribution:** install directly from GitHub for now (`npx github:...`). Once we claim the `mosadd` npm org, `npx @mosadd/mcp@alpha` will Just Work. The tarballs attached to [release v3.0.0-alpha.4](https://github.com/Hei33enberg/mosadd-os/releases/tag/v3.0.0-alpha.4) are identical to what we'll publish.

### Claude Code

```bash
claude mcp add mosadd -- npx -y github:Hei33enberg/mosadd-os --package=@mosadd/mcp
```

Then set three env vars in your MCP config — see [`examples/claude-code/`](./examples/claude-code/) for the walkthrough (including how to grab your session JWT from mosadd.com DevTools).

### Cursor / Windsurf / Cline

Drop [`examples/cursor/mcp.json`](./examples/cursor/mcp.json) into `~/.cursor/mcp.json` (or your equivalent) and fill in the env. Restart the editor.

### Anthropic Skills (Claude Code plugin)

```bash
claude plugin marketplace add Hei33enberg/mosadd-os
claude plugin install mosadd@mosadd-os
```

This installs the MCP server **and** the [`skills/`](./skills/) — each `SKILL.md` teaches Claude when to invoke which channel.

### Try it

> **You:** "Create a room and give me a guest link for Bob, valid 1 hour."
>
> **Claude:** calls `mROOM_create` → `mROOM_create_guest_link({ display_name: "Bob", ttl_seconds: 3600 })` → returns the share URL. Bob opens it in any browser. No signup. Done.

## OS modules (`m*`)

### Native channels (own transport)

| Module | What | Status |
|---|---|---|
| `mDM` | Direct messages, multi-thread per contact, optional E2E, text + voice | **alpha (shipped)** |
| `mTALK` | Push-to-talk voice, LLM-as-participant | **alpha (shipped)** |
| `mAIL` | Email, every user gets `<id>@mosadd.com` | **alpha (shipped)** |
| `mIRC` | Persistent channels (Discord/Slack semantics) | **alpha (shipped)** |
| `mRAG` | Knowledge base — RAG recall (hybrid vector+BM25) | **alpha (shipped)** |
| `mROOM` | Ephemeral rooms + no-account join links | **alpha (shipped)** |

Plus [`@mosadd/threat-engine`](./packages/threat-engine) — the embeddable 167-event threat radar that scores every operation.

## Architecture

**Public OSS layer (Apache-2.0, this repo):**
- [`@mosadd/mcp`](./packages/mcp) — single MCP server, all channels (THE main artifact)
- [`@mosadd/core`](./packages/core) — channel primitives
- [`@mosadd/providers`](./packages/providers) — vendor adapters (forked LiveKit, nwaku p2p)
- [`@mosadd/ai`](./packages/ai) — framework adapters (Vercel AI SDK, LangChain, OpenAI Agents, Anthropic Agents)
- [`@mosadd/crypto`](./packages/crypto), [`@mosadd/protocol`](./packages/protocol), [`@mosadd/threat-engine`](./packages/threat-engine)
- [`apps/dev`](./apps/dev) — the **[mosadd.dev](https://mosadd.dev)** developer portal (Next.js; deployed standalone via Vercel, Root Directory `apps/dev`). Lives here, alongside the toolkit it documents.

**Commercial hub** (proprietary, hosted at `mcp.mosadd.com` + `hub.mosadd.com`):
- Hosted MCP gateway with OAuth + BYOK key broker
- 167-event threat radar middleware (the moat)
- Unified billing across providers
- Enterprise self-host packaging + NIS2 audit trail

## Why we're different

Built for the **agent era** (Claude Code, Cursor, Lovable, Manus, ChatGPT Apps) — first-class MCP support, **semantic OS primitives instead of vendor-shaped tool wrappers**. Vendor-agnostic: bring your own keys or self-host the whole stack. Managed threat radar watching every message and call — the moat nobody else ships.

Read [docs/roadmap.md](./docs/roadmap.md) for the full plan or jump to the [M5 milestone](https://linear.app/ip-ra/project/mosadd-deaa4bef6de8) for live status.

## Contributing

We're an open community. Start with [CONTRIBUTING.md](./CONTRIBUTING.md), [GOVERNANCE.md](./GOVERNANCE.md), and the [RFC index](./docs/rfcs/).

Adding a new `m*` module requires an RFC — see [RFC 0001](./docs/rfcs/0001-module-naming.md) for the bar (semantic primitive, ≥2 backend providers, radar hooks, MCP tool surface).

Discord: _coming soon_ · Web: [mosadd.dev](https://mosadd.dev) · Linear: [M5 epic](https://linear.app/ip-ra/issue/LINEAR-2138)

## License

[Apache-2.0](./LICENSE). Patent grant included. Compatible with proprietary use.

This project includes or adapts code from:
- [LiveKit](https://github.com/livekit/livekit) (Apache-2.0) — vendored as `forks/livekit-server/`, rebranded `mosadd-fabric`
- [Hermes Agent](https://github.com/NousResearch/Hermes-Agent) (MIT, Nous Research) — `gateway/platforms/` adapted to `packages/bridges/`
- [@noble/curves, @noble/ciphers, @noble/hashes](https://paulmillr.com/noble/) (MIT) — `@mosadd/crypto`
- Several other dependencies — see full attribution in [NOTICE](./NOTICE).
