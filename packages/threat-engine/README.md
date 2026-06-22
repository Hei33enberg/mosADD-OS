# @mosadd/threat-engine

Threat-event taxonomy + scoring + pure defensive-decision engine. The kernel-level security primitive that becomes the radar moat in the Phase 2 commercial hub.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

## What's in the box

- **`evaluateEvent(event)` → `{ action, severity, reason }`** — a pure, backend-free decision function. It decides; the caller carries out the action (revoke sessions, lock account, suspend DID). No side-effects, no authority.
- **The full canonical taxonomy** — `THREAT_EVENTS` (166 event types across SIGINT / COMINT / ELINT / MASINT / CYBER / BEHAVIORAL / PRIVACY / OSINT / MPOST), each with a default severity, auto-actions, and per-platform availability. Read `THREAT_EVENT_COUNT` / `THREAT_EVENTS.length` for the exact, live count — never a hardcoded marketing number.
- **Scoring & lookup helpers** — `SEVERITY_SCORE`, `EVENT_BY_ID`, `getEventsByCategory`, `getEventsByPlatform`, `KILLSWITCH_EVENT_IDS`, `PLATFORM_EVENT_COUNTS`.

```ts
import { evaluateEvent, THREAT_EVENTS, THREAT_EVENT_COUNT } from "@mosadd/threat-engine";

evaluateEvent({ eventType: "SIM_SWAP" }); // → { action: "lock_account", severity: "killswitch", ... }
THREAT_EVENT_COUNT;                        // → 166
```

## Status

Alpha. The decision engine and the full taxonomy both ship in this package today. Runtime ML-scoring refinements continue across the v3.0.0-alpha line.

## License

[Apache-2.0](../../LICENSE).
