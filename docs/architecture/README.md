# Architecture

Index of architecture documents.

| Doc | Status | Description |
|---|---|---|
| [phase-2-hub.md](phase-2-hub.md) | Draft | Commercial hub design — 5 responsibilities, trust boundaries, pricing tiers |
| [phase-3-shells.md](phase-3-shells.md) | Draft | App shells design — apps/web rebuild + PWA + Android + iOS + Electron + macOS (with global PTT keybind) |
| control-data-plane.md | TODO | PTT/CALL: agent ↔ MCP control + client ↔ WebRTC data |
| fork-strategy.md | TODO | LiveKit fork + divergence discipline |
| identity-recovery.md | Descoped | Anonymous identity + passphrase/seed recovery (descoped — see [roadmap](../roadmap.md)) |
| anti-abuse.md | TODO | PoW + rate limits + radar scoring |
| [../threat-monitoring.md](../threat-monitoring.md) | **Live** | mLIDAR end to end — collectors, what leaves the device, signal-only stance, the honest Pegasus section, and what fires today |

## Overview (one-paragraph)

mosadd is the comms layer for AI agents — and the humans who direct them. It exposes a set of orthogonal modules (`mDM`, `mIRC`, `mURL`, `mAYL`) plus cross-cutting capabilities (`mTALK`, `mRAG`, `comms_`) through a uniform tool layer (MCP tools). Each primitive can be backed by more than one provider (Supabase / LiveKit / Resend / ...). Optional on-device threat classification (security pillar, not on every call). Callers (agents, IDEs, apps) attach above the tool surface; backend providers attach below. See [mosadd Architecture](human-os.md) for the full picture.
