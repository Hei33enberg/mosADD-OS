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
| threat-radar.md | TODO | 166-event taxonomy (ported from the proprietary mosADD backend) |

## Overview (one-paragraph)

mosadd is the comms layer for AI agents — and the humans who direct them. It exposes a set of orthogonal channel primitives (`mDM`, `mIRC`, `mTALK`, `mp0st`, `mRAG`) through a uniform tool layer (MCP tools). Each primitive can be backed by more than one provider (Supabase / LiveKit / Resend / ...). Threat classification hooks every call. Callers (agents, IDEs, apps) attach above the tool surface; backend providers attach below. See [mosadd Architecture](human-os.md) for the full picture.
