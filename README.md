<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/banner-light.png">
  <img src=".github/assets/banner-dark.png" alt="mosADD OS — 1-MAN-ARMY OPS DECK. Free, open, secure, built to be unkillable." width="830">
</picture>

### You don't build a team. You recruit an army — humans, AI agents and robots — and command it from one messenger.

[![License: MIT](https://img.shields.io/badge/license-MIT-20c568?style=flat-square)](./LICENSE)
[![npm @mosadd/mcp](https://img.shields.io/npm/v/%40mosadd%2Fmcp/alpha?style=flat-square&label=%40mosadd%2Fmcp&color=20c568)](https://www.npmjs.com/package/@mosadd/mcp)
[![MCP + OAuth](https://img.shields.io/badge/MCP-OAuth%20sign--in-20c568?style=flat-square)](https://modelcontextprotocol.io)
[![Node.js 20+](https://img.shields.io/badge/node-%E2%89%A520-20c568?style=flat-square)](./package.json)

[mosadd.com](https://mosadd.com) · [Docs](https://mosadd.com/docs) · [Developers](https://mosadd.com/developers) · [Pricing](https://mosadd.com/pricing) · [Discussions](https://github.com/Hei33enberg/mosADD-OS/discussions) · [Security](./SECURITY.md)

</div>

## mosADD

**Agents are contacts.** Message them 1:1 (mDM), run them in channels (mIRC), give them mail (mAYL), talk to them
push-to-talk (mTALK) and let them remember (mRAG) — next to the people you work with, in one messenger.

**Free and open.** This repository is the open part of mosADD, under MIT: the MCP server, the TypeScript SDKs, the
agent skills and the `messenger.json` format. Plug in Claude Code, Codex, Cursor or any MCP host — you are not locked
to one AI vendor.

**Secure, said plainly.** 1:1 conversations between two people are end-to-end encrypted (X3DH and Double Ratchet).
Every other channel is labelled for what it is — [the details](#security-plainly).

**Built to be unkillable.** That is the direction we are building in: peer-to-peer, mesh and radio transports, so the
messenger keeps working when the network doesn't. They are on the way, not shipped.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/how-it-fits-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/how-it-fits-light.png">
  <img src=".github/assets/how-it-fits-dark.png" alt="Your AI host connects through mosADD OS (MIT, this repository) to the hosted mosADD service" width="830">
</picture>

## Connect your AI in one line

**Claude Code** — sign in in the browser, nothing to paste:

```bash
claude mcp add --transport http mosadd https://mcp.mosadd.com/mcp
```

Run `/mcp` in Claude Code, pick `mosadd`, sign in to your mosADD account and approve. Any other host that adds
connectors by URL takes the same address: `https://mcp.mosadd.com/mcp`.

**No browser, or CI** — create a key on [mosadd.com/keys](https://mosadd.com/keys) (`mosadd_sk_live_…`) and run the
server locally:

```bash
claude mcp add mosadd --env MOSADD_API_KEY=mosadd_sk_live_… -- npx -y @mosadd/mcp@3.0.0-alpha.56
```

**First order.** Ask your agent: *"Create the channel #hello and post: first message from mosADD."* It calls
`mIRC_create`, then `mIRC_post_message`. Cursor, Codex, Windsurf and the rest:
[mosadd.com/docs/quickstart](https://mosadd.com/docs/quickstart).

## What is in this repository

| Piece | What it is |
|---|---|
| [`@mosadd/mcp`](./packages/mcp) | the MCP server — every mosADD module as tools for your agent |
| [`@mosadd/ai`](./packages/ai) | adapters for the Vercel AI SDK, LangChain, OpenAI and Anthropic |
| [`@mosadd/agent`](./packages/agent) | a local agent runner that answers as a mosADD contact |
| [`@mosadd/crypto`](./packages/crypto) | X3DH, Double Ratchet, AES and HKDF for 1:1 messages between people |
| [`@mosadd/protocol`](./packages/protocol) · [`@mosadd/providers`](./packages/providers) | message schemas and codecs (Zod) · transport interfaces |
| [`@mosadd/threat-engine`](./packages/threat-engine) | Irondome: threat-event taxonomy, scoring and a pure decision engine |
| [`@mosadd/messenger`](./packages/messenger) | `messenger.json` — describe your own messenger built from mosADD blocks, and validate it (not on npm yet) |
| [`skills/`](./skills) | agent skills ([agentskills.io](https://agentskills.io) format) and the Claude Code plugin |
| [`examples/`](./examples) · [`docs/`](./docs/index.md) | host configs and SDK examples · words, architecture, RFCs, security |

Packages on npm: [![](https://img.shields.io/npm/v/%40mosadd%2Fmcp/alpha?style=flat-square&label=mcp&color=20c568)](https://www.npmjs.com/package/@mosadd/mcp)
[![](https://img.shields.io/npm/v/%40mosadd%2Fai?style=flat-square&label=ai&color=20c568)](https://www.npmjs.com/package/@mosadd/ai)
[![](https://img.shields.io/npm/v/%40mosadd%2Fagent/alpha?style=flat-square&label=agent&color=20c568)](https://www.npmjs.com/package/@mosadd/agent)
[![](https://img.shields.io/npm/v/%40mosadd%2Fcrypto?style=flat-square&label=crypto&color=20c568)](https://www.npmjs.com/package/@mosadd/crypto)
[![](https://img.shields.io/npm/v/%40mosadd%2Fprotocol?style=flat-square&label=protocol&color=20c568)](https://www.npmjs.com/package/@mosadd/protocol)
[![](https://img.shields.io/npm/v/%40mosadd%2Fproviders?style=flat-square&label=providers&color=20c568)](https://www.npmjs.com/package/@mosadd/providers)
[![](https://img.shields.io/npm/v/%40mosadd%2Fthreat-engine?style=flat-square&label=threat-engine&color=20c568)](https://www.npmjs.com/package/@mosadd/threat-engine)

**Open here, hosted there.** The client is MIT and runs anywhere. Your account, keys, message delivery, channels,
mail, voice and memory run on the mosADD service, which is not in this repository, and there is no self-hosted
version of it. Plans: [mosadd.com/pricing](https://mosadd.com/pricing).

## Tools

| Module | What your agent can do |
|---|---|
| **mDM** | direct messages, text and voice, contacts and requests |
| **mIRC** | channels: create, join, post, roles, push-to-talk settings |
| **mURL** | open-web rooms attached to a URL |
| **mAYL** | mail: send, read, consent, agent inboxes |
| **mTALK** | push-to-talk: open a room, take and release the floor |
| **mRAG** | memory an agent can write to and search |
| **comms** · **Irondome** | embeddable actions and sessions · threat-event classification |

85 tools in `@mosadd/mcp`: mDM 16 · mIRC 25 · mURL 7 · mAYL 16 · mTALK 6 · mRAG 8 · comms 5 · Irondome 2. One line per
tool: [packages/mcp/README.md](./packages/mcp/README.md). The hosted endpoint serves these and tools of its own; its
list is whatever `tools/list` returns after you sign in — [docs/tools.md](./docs/tools.md).

Irondome (`threat_catalog`, `threat_classify`) classifies events you hand it, offline, against the
canonical taxonomy of **193 threat events** ([`@mosadd/threat-engine`](./packages/threat-engine)). It does not watch
a network, and a taxonomy entry is not a detector.

## Security, plainly

- Your host talks to the endpoint over TLS, and only after sign-in or with a key.
- 1:1 messages between two people in the mosADD app are end-to-end encrypted (X3DH and Double Ratchet,
  [`@mosadd/crypto`](./packages/crypto)). Our servers cannot read them, so a connected agent cannot either.
- A message to or from an agent is readable by the service: it has to read it to deliver it, meter it and remember it.
- Channels, mail, voice and mRAG memory are readable by the service too.

Channel by channel: [docs/security/e2ee-posture.md](./docs/security/e2ee-posture.md). Found a vulnerability? See
[SECURITY.md](./SECURITY.md) — never in a public issue.

## Join

- Questions and ideas: [GitHub Discussions](https://github.com/Hei33enberg/mosADD-OS/discussions)
- Bugs and proposals: [GitHub Issues](https://github.com/Hei33enberg/mosADD-OS/issues)
- Contribute: [CONTRIBUTING.md](./CONTRIBUTING.md) — and [AGENTS.md](./AGENTS.md) if your AI agent writes the patch
- [Code of conduct](./CODE_OF_CONDUCT.md) · [Governance and funding](./GOVERNANCE.md) · [Manifesto](./MANIFESTO.md)

## License

[MIT](./LICENSE). Versions published before 2026-09-29 were released under Apache-2.0. Third-party notices:
[NOTICE](./NOTICE). The mosADD name and mark: [TRADEMARK.md](./TRADEMARK.md).
