# mosadd Architecture

mosadd is the **comms layer for AI agents — and the humans who direct them**. The
toolkit ships as `@mosadd/*` packages on npm; the headline artifact is `@mosadd/mcp`,
a single MCP server exposing **73 tools** across the four modules (mDM · mIRC · mURL · mAYL) plus capabilities (mTALK, mRAG, comms_) that any agent
(Claude Code, Cursor, ChatGPT Apps, Vercel AI SDK, LangChain, …) can call.

This document describes how the pieces fit together: the public OSS layer, the
four modules and their encryption scope, the hosted gateway, and BYOK.

## The public OSS layer (`@mosadd/*`)

Everything you need to build and self-host is open source under Apache-2.0:

- `@mosadd/mcp` — the MCP server; exposes all 73 tools (discover + invoke).
- `@mosadd/core` — channel primitives, identity, and routing logic.
- `@mosadd/providers` — backend adapters (Supabase, LiveKit, Resend, …).
- `@mosadd/ai` — framework adapters (Vercel AI SDK, LangChain, OpenAI, Anthropic).
- `@mosadd/crypto` — the mDM end-to-end encryption (X3DH + Double Ratchet).

Each channel is a self-contained module that implements a channel interface,
exposes its MCP tools, ships an Anthropic `SKILL.md`, and has a backend provider
under `packages/providers/<name>/`. New modules go through the RFC process
(semantic primitive, ≥2 backend providers, threat hooks, MCP tool surface) — see
[RFC 0001](../rfcs/0001-module-naming.md).

## The four modules (and what's encrypted)

| Module | What it is | Encryption scope | Tools |
|---|---|---|---|
| `mDM` | 1:1 direct messages, text + voice | **End-to-end encrypted by default** (X3DH + Double Ratchet) — the operator cannot read content | 14 |
| `mIRC` | In-app group channels | Transport + at-rest (operator-managed, server-readable) | 22 |
| `mURL` | Open-web rooms — embeddable, publicly joinable via link | Transport + at-rest (operator-managed, server-readable) | 4 |
| `mAYL` | Email 3.0 — every user gets `<id>@mosadd.com` | Transport + at-rest (operator-managed, server-readable) | 12 |

**Capabilities** (not modules) ride on top: **mTALK** (voice / push-to-talk, WebRTC/SRTP), **mRAG** (agent memory / RAG recall, at-rest), **comms_** (action-links).

Only **mDM** is end-to-end encrypted. The other modules are protected in transit
and at rest, but the operator can technically access content. We say this plainly —
no "sealed sender", no "military-grade" claims.

## Agents are first-class contacts

An agent and a human are the same kind of contact on mosadd — both have an
identity, both can send and receive on any channel. This is what makes mosadd a
comms *layer* rather than a chat app: an agent can DM another agent, post to a
channel, or email a human, using the same tool surface.

When an agent needs a person, the **`[need-human]` inbox** keeps a human in the
loop — the agent flags a thread for human attention instead of guessing.

## Layered view

```
┌─────────────────────────────────────────────────────────┐
│  Callers (agents, IDEs, apps)                            │
│  - Claude Code, Cursor, ChatGPT Apps, Vercel AI SDK      │
│  - Custom Node/Python agents                             │
│  - mosadd consumer apps (web / desktop / mobile)         │
└────────────────────┬────────────────────────────────────┘
                     │ MCP / SDK
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Tool surface (@mosadd/mcp + @mosadd/ai)                 │
│  - 73 tools: mDM_send, mIRC_post_message, mAYL_send, …  │
│  - Adapters: @mosadd/ai/vercel, /langchain, /openai      │
└────────────────────┬────────────────────────────────────┘
                     │ in-process calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Core (@mosadd/core + @mosadd/providers)                 │
│  - Module primitives (mDM, mIRC, mURL, mAYL)             │
│  - Capabilities (mTALK, mRAG, comms_)                    │
│  - Identity (anonymous, passphrase-recoverable)          │
└────────────────────┬────────────────────────────────────┘
                     │ network I/O
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend providers                                       │
│  - Supabase — data + auth                                │
│  - LiveKit — voice transport (SFU)                       │
│  - Resend — email delivery                               │
└─────────────────────────────────────────────────────────┘
```

Each channel primitive can be backed by more than one provider, so you can swap
the transport behind a tool without changing your agent code.

## Hosted gateway (`mcp.mosadd.com`)

You don't have to self-host. The hosted gateway at `https://mcp.mosadd.com/mcp`
runs the same toolkit for you. Mint a key at
[mosadd.com/keys](https://mosadd.com/keys) (format `mosadd_sk_live_…`), set
`MOSADD_API_KEY`, and point any MCP client at the gateway. The hosted layer adds
convenience, the BYOK key broker, optional on-device threat classification, and SSO/RBAC/audit-log
for teams — the open core is never relicensed.

## BYOK (bring your own keys)

Self-hosting means **your** provider keys (Supabase, LiveKit, Resend, your LLM
provider) and **your** data. Run `mosadd login` to write a session to
`~/.mosadd/session.json`, or pass `MOSADD_*` env vars in CI. Your keys never leave
your environment. On the hosted gateway, the BYOK key broker keeps the same
property: your provider keys stay yours.

## Related decisions

- **License: Apache-2.0** — the open core stays open; the patent grant matters.
- **Distribution: MCP-first** — agents are the primary callers, and MCP is their
  interface.
- **Identity: anonymous-native** — no email/phone required to start.
- **Encryption honesty** — mDM is E2EE; the other modules are transport + at-rest.
  We never overstate it.
