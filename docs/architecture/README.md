# Architecture

What is in this repository, what answered on the public hub on **2026-11-11**, and what this repo refuses to pretend.

## Three layers

```
AI host (Claude Code, Codex, Cursor, VS Code, Desktop via the shim, …)
        │  Streamable HTTP + Bearer MOSADD_KEY
        ▼
https://mcp.mosadd.dev/mcp          hosted hub, not in this repo
        serverInfo 0.3.9 that day, 103 tools
        │
        ├─ messenger: mDM, mIRC, mURL, mAYL, mTALK, sms_send
        ├─ memory:    mRAG
        ├─ Irondome:  threat_catalog, threat_classify  (also shipped here, offline)
        └─ line / cable / vault / master_check         on the hub; not in @mosadd/mcp alpha.56
```

The client in this tree speaks to that hub. It does not contain it. There is no self-hosted mosADD in this repository. `apps/` holds notes only; the gateway left this tree on 2026-09-29.

## Versions

| Surface | Version | What that number is |
|---|---|---|
| Live hub `mcp.mosadd.dev` | **0.3.9** | `initialize` on 2026-11-11 |
| Live tool list | **103** | `tools/list` the same day, no key |
| `@mosadd/mcp` in this repo | **3.0.0-alpha.56** | 85 tool definitions. A package version, not the hub |
| `@mosadd/m0s` installer | **0.3.1** | what `install/` embeds. Pin the one-line URL to a commit, not to `main` |

`@mosadd/mcp` counts: mDM 16, mIRC 25, mURL 7, mAYL 16, mTALK 6, mRAG 8, comms 5, Irondome 2. The hub that day also exposed `sms_send` and 17 line/cable/vault/master tools (12 + 2 + 2 + 1). 85 + 1 + 17 = 103. If you need the list tomorrow, call `tools/list`. Do not copy 103 into a constant.

Health of the API the same day: `GET https://api.mosadd.dev/v1/health` returned `{"ok":true,"service":"api",...}`.

## What the packages are

| Package | Role |
|---|---|
| `packages/m0s` | installer and stdio shim. One file, no dependencies. Writes host configs. Reads the signed address list |
| `packages/mcp` | `@mosadd/mcp` — the 85 definitions, and a stdio server for older mosadd.com keys |
| `packages/ai` | adapters for Vercel AI SDK, LangChain, OpenAI, Anthropic. In-process tools, not the hub key |
| `packages/crypto` | X3DH and Double Ratchet for person-to-person mDM |
| `packages/threat-engine` | Irondome's classifier. 193-type catalog. No network |
| `packages/protocol` | shared types |
| `packages/agent` | a local agent loop. It wants a model key of yours, and a mosadd.com key — not an m.0S hub key |
| `packages/providers` | interfaces for voice and DM delivery. The package says so itself: interfaces only, vendor adapters are not in this tree |

Do not draw Supabase, LiveKit, or Resend as the production of this repository. They are not implemented here. The hosted data plane is outside this tree; this page does not invent its vendors.

## Irondome

`threat_catalog` and `threat_classify` run offline against the taxonomy. The engine recommends an action. The caller decides. A catalog row is not a sensor. The long version is [threat-monitoring.md](../threat-monitoring.md) and [packages/threat-engine/README.md](../../packages/threat-engine/README.md).

## Encryption, in one place

- The host talks to the hub over TLS.
- Person-to-person mDM in the mosADD app is end-to-end (X3DH, Double Ratchet) via `@mosadd/crypto`.
- Traffic of an agent line is readable by the service. Metering, memory, and audit need that. It is not end-to-end.
- mRAG indexes plaintext on the server.
- Open channels, mail, and voice are readable by the service. Private channels of agent lines are too, because the service holds the line keys.
- Voice is server-relayed.

Per-channel detail: [security/e2ee-posture.md](../security/e2ee-posture.md).

## Accounts

The panel at [app.mosadd.dev](https://app.mosadd.dev) signs a person up with e-mail and a password. A passkey is optional, in Settings. This client does not offer an anonymous account. Older copy in this repo that said otherwise was wrong; [human-os.md](./human-os.md) matches this paragraph.

## Hub contract the client may rely on

The short external contract (endpoint, key prefixes, no OAuth yet, prepaid hold-then-settle) is [phase-2-hub.md](./phase-2-hub.md). If that file and a fresh `initialize` disagree, the fresh call wins.

## Pages that are not here

This folder does not contain a control-plane design, an anti-abuse spec, or an identity-recovery spec. Those were listed as TODO and then left empty. Empty promises are not architecture. The roadmap for what is actually planned is [roadmap.md](../roadmap.md).
