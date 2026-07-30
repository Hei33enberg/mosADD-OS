# @mosadd/threat-engine

The classification layer behind **mLIDAR** and the **Irondome** security pillar: a canonical threat-event taxonomy plus a pure, backend-free decision function.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

```bash
npm i @mosadd/threat-engine@alpha
```

```ts
import { evaluateEvent, THREAT_EVENT_COUNT } from "@mosadd/threat-engine";

evaluateEvent({ eventType: "SIM_SWAP" }); // → { action: "lock_account", severity: "killswitch", … }
THREAT_EVENT_COUNT;                       // the live count — read it, never hardcode it
```

---

## Read this first: a taxonomy entry is not a detector

This package ships **193 canonical threat-event types**. That number is the size of a *catalog*, and it is the single most misread number in this project's history — it has been printed on a website as a count of things we detect. It is not that, and this section exists so nobody makes that mistake again.

| | What it means | What it does **not** mean |
|---|---|---|
| **Taxonomy entry** | The engine knows this event type: its category, default severity, recommended policy, and which platforms *could* observe it. Hand it one and it will classify it. | That anything is watching for it. |
| **Detector** | Code on a real platform, wired to a real sensor, that observes a condition and emits the event. | — |

Every taxonomy entry is a *slot*. A detector is what fills it. There are far more slots than detectors, and that is normal for a catalog — MITRE ATT&CK describes techniques nobody's EDR detects either.

So:

- ✅ "193 event types the engine can classify"
- ✅ "the catalog is the map, not the territory"
- ❌ "193 signals" · "193 detections" · "we detect 193 threats"

See [**Coverage today**](#coverage-today) for the detectors that actually exist, and [`docs/threat-monitoring.md`](../../docs/threat-monitoring.md) for how they run.

## What's in the box

- **`evaluateEvent(event)` → `{ action, severity, reason }`** — a pure, backend-free decision function. No side-effects, no authority, no network. It decides; the caller carries out the action.
- **The full canonical taxonomy** — `THREAT_EVENTS`, each entry with a category, default severity, recommended policy, and per-platform availability.
- **Scoring & lookup helpers** — `SEVERITY_SCORE`, `EVENT_BY_ID`, `getEventDef`, `getEventsByCategory`, `getEventsByPlatform`, `KILLSWITCH_EVENT_IDS`, `AUTO_DISCONNECT_EVENT_IDS`, `PLATFORM_EVENT_COUNTS`, `CATEGORY_EVENT_COUNTS`.

**Never hardcode the count.** Read `THREAT_EVENT_COUNT`, `CATEGORY_EVENT_COUNTS` or `PLATFORM_EVENT_COUNTS` — they derive from `THREAT_EVENTS` and cannot go stale. A CI gate ([`threat-count-consistency.test.ts`](./src/__tests__/threat-count-consistency.test.ts)) pins the handful of prose surfaces that do state a number.

## The taxonomy

Ten intelligence-discipline categories. Run `CATEGORY_EVENT_COUNTS` for live per-category numbers rather than trusting any table.

| Category | What it covers |
|---|---|
| `SPYWARE` | Mercenary-spyware IOC hits — C2 beacons, known implant processes/packages, rogue MDM profiles, exploit traces. The Pegasus-class category. |
| `SIGINT` | Signals & device — radios, sensors, network transport, cell/baseband, device integrity. The largest category. |
| `CYBER` | Runtime attack & anti-tamper — injection, hooking, rootkits, sandbox escape — plus desktop OS security posture. |
| `MASINT` | Measurement & signature — power, thermal, acoustic, EM emanation, side-channel, clock skew. |
| `BEHAVIORAL` | Behavioral anomalies — typing/gait/usage patterns, app lifecycle, session anomalies. |
| `COMINT` | Communications — RTP/SIP/VoIP anomalies, silent SMS, call forwarding, VoLTE downgrade. |
| `ELINT` | Electronic — RF spectrum, jamming, SDR sweeps, triangulation. |
| `PRIVACY` | Tracking & leakage — fingerprinting, WebRTC leak, cross-app tracking, indicator bypass. |
| `MPOST` | mAYL mail intelligence — delivery, open/click tracking, bounce, complaint, forward. |
| `OSINT` | Open-source exposure — breach databases, dark-web mentions, public data exposure. |

```ts
import { CATEGORY_EVENT_COUNTS, getEventsByCategory, getEventsByPlatform } from "@mosadd/threat-engine";

CATEGORY_EVENT_COUNTS.SPYWARE;   // events in the SPYWARE category
getEventsByCategory("CYBER");    // full defs
getEventsByPlatform("desktop");  // what an Electron host could observe
```

Platforms are `apk` · `ios` · `pwa` · `harmony` · `desktop`. A platform tag means *this platform could observe this event* — availability, not a promise that a detector exists.

## The decision engine

`evaluateEvent()` is deterministic, side-effect-free and backend-free. It mirrors the mosADD DECK rules, in priority order:

| # | Trigger | Action | Severity |
|---|---|---|---|
| 1 | type contains `SIM_SWAP` or `KERNEL`, or hint `severity: "killswitch"` | `lock_account` | `killswitch` |
| 2 | contains `SIP_MALFORMED` or `AUTH_BRUTEFORCE`, or hint `severity: "critical"` | `revoke_sessions` | `critical` |
| 3 | contains `TOLL_FRAUD`, `ROBOCALL`, `DID_ABUSE`, `CALL_ABUSE` | `suspend_did` | `warning` |
| 4 | anything else | `log_only` | `info` |

Matching is substring-based and case-insensitive, so `SIM_SWAP_DETECTED` and `sim_swap` both hit rule 1.

**The engine has no authority.** It returns data. The caller decides whether to act, and executes against its own backend. That separation is why it ports anywhere — and it means a compromised caller cannot use this package to lock someone's account, because the package cannot lock anything.

## Severity and action model — two vocabularies, don't confuse them

There are two distinct "action" concepts here, and conflating them is how a past policy page ended up promising behaviour no code implemented.

**1. `ThreatAction` — what `evaluateEvent()` returns.** `log_only` · `revoke_sessions` · `lock_account` · `suspend_did`. A recommendation to the caller.

**2. `AutoAction` — the advisory policy field on a taxonomy entry.** `log` · `alert_user` · `increase_sampling` · `disconnect_call` · `destroy_room` · `wipe_account`.

> ⚠️ **`AutoAction` is advisory. Nothing in mosADD executes it.** No mosADD code path disconnects a call, destroys a room, or wipes an account. `evaluateEvent()` never returns these values, and the `threat_classify` MCP tool deliberately answers `action: "monitor"`. They describe what a stricter host *could* choose to do with its own authority. If you build on this package, treat them as a policy suggestion to implement or ignore — never as behaviour you inherit.

Severity tiers score as `info` 5 · `warning` 30 · `elevated` 60 · `critical` 85 · `killswitch` 100 (`SEVERITY_SCORE`). Note the taxonomy has five tiers including `elevated`, while a `ThreatDecision` normalizes to four (`info` · `warning` · `critical` · `killswitch`).

## Coverage today

**Updated 2026-07-30.** The honest answer to "what actually fires". Scoped to the mosADD app's mLIDAR collectors — if you embed this package yourself, your coverage is whatever detectors *you* wire up.

Detectors emit **20 distinct event types** across three collectors:

| Collector | Runs on | Emits |
|---|---|---|
| **Desktop** (Electron main process) | Windows · macOS · Linux | `PEGASUS_C2_BEACON`, `SPYWARE_C2_BEACON`, `SPYWARE_PROCESS_MATCH`, `DESK_USB_ATTACHED`, `DESK_NEW_LISTENING_PORT`, `DESK_REMOTE_ACCESS_ON`, `DESK_ADMIN_SESSION` |
| **Android native** (Capacitor plugin) | Android APK | `ROOT_DETECTION`, `MAGISK_DETECTION`, `XPOSED_DETECTION`, `FRIDA_DETECTION`, `SANDBOX_ESCAPE`, `DEBUGGER_ATTACH`, `USB_DEBUG_ENABLED`, `VPN_STATUS`, `SIDELOAD_SOURCE`, `DEV_OPTIONS_ENABLED`, `ACCESSIBILITY_ABUSE` |
| **Web** (any browser, PWA, iOS WebView) | everywhere else | `WEBRTC_LEAK`, `DEVICE_FINGERPRINT_CHECK` |

Per-category reality check:

| Category | Taxonomy entries | Wired to a live detector |
|---|---|---|
| `SPYWARE` | 7 | **3** — `PEGASUS_C2_BEACON` + `SPYWARE_C2_BEACON` fire on desktop; `SPYWARE_PROCESS_MATCH` is wired but starved (see caveats) |
| `CYBER` | 37 | **11** — 5 Android anti-tamper, 3 Android posture, 3 desktop posture |
| `SIGINT` | 71 | **4** — `ROOT_DETECTION`, `VPN_STATUS`, `USB_DEBUG_ENABLED`, `DESK_USB_ATTACHED` |
| `PRIVACY` | 9 | **2** — `WEBRTC_LEAK`, `DEVICE_FINGERPRINT_CHECK` |
| `MASINT` · `BEHAVIORAL` · `COMINT` · `ELINT` · `MPOST` · `OSINT` | 69 combined | **0 from mLIDAR.** `MPOST` events are emitted server-side by the mAYL mail pipeline, not by a device collector |

**Honest caveats, stated plainly:**

- **C2 matching is live.** `PEGASUS_C2_BEACON` and `SPYWARE_C2_BEACON` fire on desktop against 9,548 IP indicators and 4,166 mercenary-spyware C2 domains, by matching the OS DNS resolver cache — including lookups that *failed*, which is exactly what an implant reaching a seized C2 produces.
- **Live Pegasus infrastructure is still not detectable.** No free public feed publishes live mercenary C2s. What matches is published historical intelligence. The binding constraint is intelligence, not code.
- **`SPYWARE_PROCESS_MATCH` is wired but starved.** The desktop collector matches `indicator_type === "process"` indicators, and the store holds **zero** process-type rows — no free feed of desktop process names exists. The detector runs and cannot fire.
- **`SPYWARE_PACKAGE_MATCH` has no consumer.** The store carries 644 package-type indicators (stalkerware, NoviSpy), but no collector reads them yet — the Android plugin uses `PackageManager` for its own posture checks, not IOC matching. The data exists; the detector does not.
- **The desktop path is not field-proven yet.** Verified by unit tests, a verbatim probe, and real-data matching — but not yet run inside a live Electron build with a logged-in session.
- **iOS is shallow.** The iOS WebView falls through to the web collector — two browser-scoped events. A native iOS plugin is not shipped.
- **Telemetry leaves the device.** Detected events are written to the mosADD backend. *This package* is pure and never phones home; the *collectors that use it* do upload. See [`docs/threat-monitoring.md`](../../docs/threat-monitoring.md).

## Signal only — and that is the point

mLIDAR logs, alerts and notifies. It does not block, quarantine, disconnect, or wipe. That is a deliberate design constraint, not a missing feature.

Automated defensive action on a consumer device is a liability: a false positive that wipes an account or drops a call does more damage than the threat it was guessing at. We say so out loud, and the restraint is what makes the signal trustworthy — an alert from mLIDAR means "look at this", never "we already acted on your behalf".

The same restraint runs through the detection path: an allowlist of major platforms can never raise an alert, because public feeds legitimately list GitHub and Google Drive as malware-hosting domains. **A false CRITICAL is worse than a missed signal.**

## Consuming it

**As a library:**

```ts
import { evaluateEvent, getEventDef } from "@mosadd/threat-engine";

const def = getEventDef("PEGASUS_C2_BEACON");
// → { id, category: "SPYWARE", severity: "critical", autoActions: [...], label, platforms }

const decision = evaluateEvent({ eventType: "AUTH_BRUTEFORCE", details: "12 failures in 30s" });
// → { action: "revoke_sessions", severity: "critical", reason: "…" }
// YOU execute decision.action. The engine never acts.
```

**As MCP tools** — any agent gets the same capability, offline, via [`@mosadd/mcp`](../mcp):

| Tool | What it does |
|---|---|
| `threat_catalog` | List the taxonomy, filterable by `category` or `platform`. Returns `{ count, total, events }` |
| `threat_classify` | Classify one event type. Known events return their real taxonomy severity with `action: "monitor"`; unknown strings fall back to `evaluateEvent()` |

Both are pure and need no backend, so they work in a fully offline agent.

## Status

**Alpha.** The full taxonomy and the decision engine both ship today. What is genuinely incomplete is *detector coverage* — documented above rather than glossed over.

## License

[Apache-2.0](../../LICENSE).
