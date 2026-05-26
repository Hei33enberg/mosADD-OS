# mosadd

> **A human OS. Add.**

`m·os·add` — operating system for human communications. Modular primitives — `mDM` for direct messages, `mTALK` for push-to-talk, `mCALL` for calls, `mROOM` for rooms, `mIRL` for live-stream after-parties, plus bridges to Telegram/Discord/Matrix/Signal — and you **add** what you need. Free open-source core, commercial hub for transmission + threat radar. Build for humans, agents, or both.

## Status

Pre-alpha. v3.0.0 in development. See [roadmap](https://linear.app/ip-ra/project/mosadd-deaa4bef6de8) and [Phase 1 epic](https://linear.app/ip-ra/issue/LINEAR-2138).

## Quickstart (will work after Phase 1 Foundation lands)

### Use in Claude Code

```bash
npx @m0ssad/mcp
```

Add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["@m0ssad/mcp"],
      "env": {
        "MOSADD_API_KEY": "..."
      }
    }
  }
}
```

### Use in Cursor / Windsurf / Cline

Same MCP config. Works in any MCP-capable client.

### Use in your own agent (Vercel AI SDK)

```ts
import { mosadd } from "@m0ssad/ai/vercel";

const tools = mosadd({ apiKey: process.env.MOSADD_API_KEY });

await streamText({ model, tools, messages });
```

## OS modules (`m*`)

### Native channels (own transport)

| Module | What | Status |
|---|---|---|
| `mDM` | Direct messages, multi-thread per contact, optional E2E | MVP target |
| `mTALK` | Push-to-talk voice, LLM-as-participant | MVP target (kill feature) |
| `mAIL` | Email, every user gets `<id>@mosadd.com` | MVP target |
| `mCALL` | PSTN out, anonymous DID pool, vocoder | MVP target |
| `mIRC` | Persistent channels (Discord/Slack semantics) | MVP target |
| `mIRL` | Live-stream after-party (YT/TikTok creators monetize) | MVP target |
| `mROOM` | Ephemeral group rooms + no-account join links | MVP target |

### Bridge modules (reach existing networks)

| Module | What | Status |
|---|---|---|
| `mMATRIX` | Matrix.org federation | Phase 1 |
| `mDISCORD` | Discord DM + channel post | Phase 1 |
| `mTELEGRAM` | Telegram DM + group | Phase 1 |
| `mSLACK` | Slack workspace | Phase 1 P1 |
| `mSIGNAL` | Signal | Phase 1 P1 |
| `mWHATSAPP` | WhatsApp | Phase 2 (legal) |
| `mIMESSAGE` | iMessage | Phase 2 (legal) |

Community-contributed modules in `v3.1+`: `mPOST`, `mWALL`, `mBROADCAST`, `mPING`, `mPAY`, `mVAULT`, ...

## Architecture

**Public OSS layer (Apache-2.0, this repo):**
- `@m0ssad/mcp` — single MCP server, all channels
- `@m0ssad/core` — channel primitives
- `@m0ssad/providers` — vendor adapters (forked LiveKit, Routr SIP, nwaku p2p, Dendrite Matrix)
- `@m0ssad/bridges` — Telegram/Discord/Matrix/Signal/WhatsApp (Hermes-derived)
- `@m0ssad/ai` — framework adapters (`@m0ssad/ai/vercel`, `@m0ssad/ai/langchain`, ...)
- `@m0ssad/crypto`, `@m0ssad/protocol`, `@m0ssad/threat-engine`

**Commercial hub (proprietary):**
- `mcp.mosadd.com` — hosted MCP gateway with OAuth + BYOK
- `hub.mosadd.com` — SaaS dashboard (API keys, usage, billing, threat timeline)
- Radar 167-event threat detection middleware
- Multi-provider PSTN failover orchestration

## Why we're different

Built for the **agent era** (Claude Code, Cursor, Lovable, Manus, ChatGPT Apps) — first-class MCP support, semantic OS primitives instead of vendor-shaped tool wrappers. Vendor-agnostic across our forked stack + Telnyx/Twilio/Matrix/Discord backends. Managed threat radar watching every message, call, and bridge — the moat nobody else ships.

## Contributing

We're an open community. Start with [CONTRIBUTING.md](./CONTRIBUTING.md) and [GOVERNANCE.md](./GOVERNANCE.md). RFCs for new `m*` modules in [`docs/rfcs/`](./docs/rfcs/).

Discord: _coming soon_ · Twitter: [@mosadd](https://twitter.com/mosadd)

## License

[Apache-2.0](./LICENSE). Patent grant included. Compatible with proprietary use.

This project includes code derived from:
- [Hermes Agent](https://github.com/NousResearch/Hermes-Agent) (MIT, Nous Research) — `gateway/platforms/` adapted to `packages/bridges/`
- [LiveKit](https://github.com/livekit/livekit) (Apache-2.0) — vendored as `forks/livekit-server/`, rebranded `m0ssad-fabric`

See [NOTICE](./NOTICE) for full attribution.
