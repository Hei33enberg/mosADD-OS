# Architecture

Index of architecture documents.

| Doc | Status | Description |
|---|---|---|
| [phase-2-hub.md](phase-2-hub.md) | Draft | Commercial hub design — 5 responsibilities, trust boundaries, pricing tiers |
| [control-data-plane.md](control-data-plane.md) | TODO | PTT/CALL: agent ↔ MCP control + client ↔ WebRTC data |
| [fork-strategy.md](fork-strategy.md) | TODO | LiveKit fork + divergence discipline |
| [identity-recovery.md](identity-recovery.md) | TODO | Anonymous identity + passphrase/seed recovery |
| [anti-abuse.md](anti-abuse.md) | TODO | PoW + rate limits + radar scoring |
| [threat-radar.md](threat-radar.md) | TODO | 167-event taxonomy (ported from m0ssad-3) |
| [bridges.md](bridges.md) | TODO | Hermes-derived bridge layer to Matrix/Telegram/Discord/Signal/WhatsApp |

## OS framing (one-paragraph)

mosadd treats human communication as an OS would treat IPC: as a set of orthogonal primitives (`mDM`, `mTALK`, `mROOM`, ...) accessible through a uniform syscall layer (MCP tools). Each primitive is implementable by multiple providers (Supabase / LiveKit / Telnyx / Matrix / nwaku / ...). The OS kernel is the radar — it sees every syscall, scores it, and may block. Shells (apps, agents, bridges) attach above the OS; backends (forks of OSS infra) attach below.
