# Architecture: mosadd as a Human OS

## The framing

`m·os·add` reads as **"man OS add"** — *Human Operating System. Add.*

mosadd is not an SDK. It is not a wrapper. It is not a chat app. It is an **operating system for human communications**, with **modular primitives** that you add as needed.

Like a real OS gives you `open()`, `read()`, `write()`, `socket()`, `fork()`, mosadd gives you:

- `mDM` — direct messages
- `mTALK` — push-to-talk voice
- `mAIL` — email
- `mCALL` — phone calls (PSTN)
- `mIRC` — persistent channels
- `mIRL` — live-stream after-parties
- `mROOM` — ephemeral group rooms
- `mMATRIX`, `mDISCORD`, `mTELEGRAM`, ... — bridges to external networks

Each `m*` is a **module** you `add` to your system.

## Why this framing matters

### vs. "Stripe for communications"

The Stripe metaphor implies "we wrap your existing comms infrastructure with a friendlier API." That's the Composio model. It's a valid product, but it's not what we are. We're not a billing layer over Telnyx + Twilio + LiveKit. We are a **system on top of which apps run**.

### vs. "Secure messenger app"

A messenger is one app. mosadd has many surfaces:

- Native consumer app (PWA, Android, iOS, Electron, macOS)
- Hosted MCP endpoint (`mcp.mosadd.com`) consumed by Claude Code, Cursor, Lovable, ChatGPT Apps, custom agents
- Self-hosted SDK in any Node/Python project
- Bridge layer that lets your existing Telegram/Discord/Signal contacts reach you

These are not separate products. They are **shells over the same OS**. Just as Linux is the same kernel whether you run GNOME or Sway or i3, mosadd is the same kernel whether you run the PWA, the Electron app, or call it via MCP.

### vs. competitors

| Them | Us |
|---|---|
| Twilio Agent Connect — SDK for Twilio products | OS that abstracts over Twilio (and others) |
| Composio — aggregator of vendor MCPs | OS with native primitives, plus bridges |
| LiveKit Agents — voice transport + agent framework | OS that uses (and forks) LiveKit as one provider |
| Slack/Discord/WhatsApp — apps with closed protocols | OS that bridges to all of them |
| Matrix — federated chat protocol | OS that uses Matrix as one provider |

## Module convention (the `m*` prefix)

The `m` prefix is **not** "messenger". It's "module". Every `m*` is a self-contained OS module that:

1. Implements a channel interface (`DmProvider`, `RoomProvider`, `CallProvider`, ...)
2. Exposes MCP tools (`mDM_send`, `mDM_list`, ...)
3. Ships an Anthropic SKILL.md
4. Has a provider in `packages/providers/<name>/` and (optionally) a bridge in `packages/bridges/<name>/`
5. Has its own version, maintainer, RFC history

This makes the system **extensible**. Community can propose `mPOST` (broadcast posts), `mWALL` (public wall), `mPING` (presence), `mPAY` (in-flow micropayments), `mVAULT` (encrypted storage). Each goes through the RFC process.

## Layered architecture

```
┌─────────────────────────────────────────────────────────┐
│  Shells (apps, agents, IDEs)                            │
│  - Consumer PWA / Android / iOS / Electron              │
│  - Claude Code, Cursor, Lovable, ChatGPT Apps           │
│  - Custom Node/Python agents                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ MCP / SDK / REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│  System call interface (@m0ssad/mcp + @m0ssad/ai)       │
│  - Tools: mDM_send, mTALK_start, mCALL_pstn, ...        │
│  - Adapters: @m0ssad/ai/vercel, /langchain, /openai     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ in-process calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Kernel (@m0ssad/core + @m0ssad/providers)              │
│  - Channel primitives                                   │
│  - Threat radar middleware (hook on every call)         │
│  - Identity (anonymous, passphrase-recoverable)         │
│  - Routing logic (native vs bridge vs federation)       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ network I/O
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Drivers (forks of OSS infrastructure)                  │
│  - forks/livekit-server (m0ssad-fabric) — SFU/MCU       │
│  - Routr — SIP control plane                            │
│  - nwaku — p2p messaging                                │
│  - Dendrite — Matrix federation                         │
│  - Telnyx/Twilio — PSTN dumb pipes                      │
│  - mautrix-{telegram,discord,whatsapp,...} — bridges    │
└─────────────────────────────────────────────────────────┘
```

## What the OS framing gives us

1. **A defensible position.** Every competitor we know is an SDK, an API aggregator, a chat platform, or a protocol. None of them framed themselves as an OS for comms. We own this conceptual real estate.

2. **A natural extension story.** "Add mPOST" sounds inevitable; "fork Composio and add a tool" doesn't.

3. **Pricing logic.** OS = kernel. Kernel is free. Drivers (transmission), administration tools (hub, dashboard), and managed services (radar, BYOK proxy) are paid. Same model as Linux Foundation + Red Hat.

4. **Acquisition incentive for partners.** Whoever wants to ship "secure comms" doesn't need to build it — they ship a shell over our OS.

5. **Marketing simplicity.** `mosadd. A human OS. Add.` is a tagline. It fits on a hat.

## What this framing forces us to be honest about

1. **An OS has to be stable.** Breaking changes are expensive. We need real versioning, RFC discipline, deprecation policy. See [GOVERNANCE.md](../../GOVERNANCE.md).

2. **An OS has documentation, not just code.** Every `m*` module needs a man page (SKILL.md), an architecture doc, and an example app.

3. **An OS has security as a first-class concern.** Threat radar isn't a feature, it's a kernel primitive. See `threat-radar.md` (forthcoming).

4. **An OS has community.** We don't sell licenses. We sell hosted services. The codebase has to belong to the community — Apache-2.0, patent grant, governance with external maintainers.

## What this framing does **not** mean

We are not building a literal new kernel. We are not replacing Linux. We are not booting on bare metal. "OS" is the conceptual model for our toolkit — modular, composable, kernel + drivers + system calls + shells. The implementation is TypeScript/Go libraries running on existing OSs.

## Related decisions

- **License: Apache-2.0** — patent grant matters for an OS-shaped product
- **Stack: own transmission infrastructure** (forks LiveKit, adopts Routr/nwaku/Dendrite) — an OS needs its own drivers, not wrappers around someone else's
- **Identity: anonymous-native** — no email/phone signup, because an OS doesn't ask you for credentials before letting you boot
- **Distribution: MCP-first** — agents (Claude/Cursor/Lovable) are the shells of 2026, and MCP is their syscall interface

These are not arbitrary choices. They follow from the OS framing.
