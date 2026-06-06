# Architecture

Index of architecture documents.

| Doc | Status | Description |
|---|---|---|
| [phase-2-hub.md](phase-2-hub.md) | Draft | Commercial hub design — 5 responsibilities, trust boundaries, pricing tiers |
| [phase-3-shells.md](phase-3-shells.md) | Draft | App shells design — apps/web rebuild + PWA + Android + iOS + Electron + macOS (with global PTT keybind) |
| control-data-plane.md | TODO | PTT/CALL: agent ↔ MCP control + client ↔ WebRTC data |
| fork-strategy.md | TODO | LiveKit fork + divergence discipline |
| identity-recovery.md | TODO | Anonymous identity + passphrase/seed recovery |
| anti-abuse.md | TODO | PoW + rate limits + radar scoring |
| threat-radar.md | TODO | 167-event taxonomy (ported from the proprietary mosadd backend) |

## OS framing (one-paragraph)

mosadd treats human communication as an OS would treat IPC: as a set of orthogonal primitives (`mDM`, `mIRC`, `mROOM`, `mTALK`, `mAIL`, `mRAG`) accessible through a uniform syscall layer (MCP tools). Each primitive is implementable by multiple providers (Supabase / LiveKit / nwaku / ...). The OS kernel is the radar — it sees every syscall, scores it, and may block. Shells (apps, agents) attach above the OS; backends (forks of OSS infra) attach below.
