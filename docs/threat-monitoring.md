# Threat monitoring — mLIDAR and the Irondome

**Last updated: 2026-07-30.**

mLIDAR is mosADD's on-device threat monitor. It watches the security posture of the device you actually use, classifies what it sees against the [`@mosadd/threat-engine`](../packages/threat-engine) taxonomy, and tells you. It never acts on your behalf.

This document is the honest, checkable description of what it does today, what it does not do, and where it is going. If you find a claim here that the code does not support, that is a bug — [open an issue](https://github.com/Hei33enberg/mosADD-OS/issues).

---

## Contents

- [The one-paragraph truth](#the-one-paragraph-truth)
- [How it works, end to end](#how-it-works-end-to-end)
- [The three collectors](#the-three-collectors)
- [What leaves your device](#what-leaves-your-device)
- [Signal only — the design constraint that is the moat](#signal-only--the-design-constraint-that-is-the-moat)
- [Pegasus and mercenary spyware](#pegasus-and-mercenary-spyware)
- [What fires today](#what-fires-today)
- [Where this is going](#where-this-is-going)
- [Plugging in your own feeds and detectors](#plugging-in-your-own-feeds-and-detectors)

---

## The one-paragraph truth

mLIDAR is an **opt-in** monitor, **off by default**, that runs inside the mosADD app on the platform you're using. Every **60 seconds** it takes a posture snapshot, compares it against a baseline and against threat-intelligence indicators, and writes any finding to your account as a threat event. It alerts; **it never blocks, quarantines, disconnects, or wipes.** Detected events are uploaded to the mosADD backend — mLIDAR is not a purely local tool, and this document says exactly what is sent. Depth varies enormously by platform: deep on desktop and Android, shallow in a browser, shallow on iOS.

## How it works, end to end

```
   ┌─ opt-in gate ──────────────────────────────────────────────┐
   │  localStorage `mlidar_enabled` — off by default.           │
   │  The toggle dispatches a `mlidar:set` event to start/stop   │
   │  live, with no restart.                                    │
   └───────────────────────┬────────────────────────────────────┘
                           │
   ┌───────────────────────▼────────────────────────────────────┐
   │  runtime gate — ONE of three collectors is chosen          │
   │    isElectronRuntime()  → desktop collector                │
   │    isNativePlatform()   → Android native collector         │
   │    otherwise            → web collector                    │
   └───────────────────────┬────────────────────────────────────┘
                           │  60 s snapshot
   ┌───────────────────────▼────────────────────────────────────┐
   │  evaluate — baseline diff + indicator matching             │
   │  dedup: each finding emits once per session                │
   └───────────────────────┬────────────────────────────────────┘
                           │  mapped through the shared taxonomy
   ┌───────────────────────▼────────────────────────────────────┐
   │  device_events  (Supabase)  →  live radar in the app       │
   └────────────────────────────────────────────────────────────┘
```

Three properties worth noting:

**The taxonomy is a hard filter.** Every collector runs each candidate row through `getEventDef(event_type)` before writing it. An event type not in the taxonomy is silently dropped. This is why the public [`@mosadd/threat-engine`](../packages/threat-engine) taxonomy and the app's copy must stay at parity — they are the same catalog, and a drift between them means a detector that emits into the void.

**A baseline is not an alarm.** The desktop collector treats the *first* snapshot as the baseline. Your machine's normal listening ports are recorded, not reported. Only a port that opens *after* mLIDAR starts is a signal — that is a backdoor opening while you watch, rather than a list of everything your OS happens to run.

**Findings deduplicate per session.** A USB device attached once is one event, not one every 60 seconds. Toggling mLIDAR off and on resets the dedup state.

## The three collectors

### Desktop — Electron main process

The deepest collector. The Electron main process reads OS posture that a browser sandbox cannot see, and streams a snapshot to the renderer over the preload bridge; the renderer holds the session and does the matching.

| Sees | Detects |
|---|---|
| Established network connections (peer IP, port, owning process) | Outbound connection to a known-bad IP |
| The OS DNS resolver cache, and reverse-DNS of live peers | A lookup of, or a connection to, a known C2 **domain** |
| Running processes | A known spyware process by name |
| Listening ports (against a first-snapshot baseline) | A new listener; SSH (22) / RDP (3389) exposure |
| Attached USB devices | A device newly seen this session |
| Privilege level | Running elevated / as root |

### Android — native Capacitor plugin

A native plugin running inside the APK's own process, polling on the same 60-second tick. It reads publicly-exposed `Build`, `Settings.Global`, `Settings.Secure`, KeyStore and `/proc` state — **no runtime permission prompts**, because none of it is permission-gated.

It emits eleven posture and anti-tamper signals: root, Magisk, Xposed, Frida, sandbox escape (bootloader/SELinux state), debugger attachment, USB debugging, developer options, sideload source, VPN status, and accessibility-service abuse. This is the same class of signal that Malwarebytes, Lookout and Zimperium ship on Android.

### Web — any browser, PWA, or iOS WebView

The honest collector. A browser sandbox cannot see other applications' processes or the system network — iOS and Android forbid it, and no amount of JavaScript changes that. So it watches only what the browser genuinely exposes:

- **`WEBRTC_LEAK`** — a private RFC1918 address exposed through ICE candidates. Modern browsers mask candidates behind mDNS, so a raw private-IP leak is a real finding: it can leak past a VPN.
- **`DEVICE_FINGERPRINT_CHECK`** — informational posture on how fingerprintable this browser surface is.

Both emit once, after which the loop stops rather than spinning a fresh `RTCPeerConnection` every minute forever.

> **Never claim spyware detection on the browser collector.** It cannot see it. iOS today falls through to this path, so **iOS coverage is browser-scoped only**; a native iOS plugin is not shipped.

## What leaves your device

Detected events are inserted into the Supabase `device_events` table under your user id. Per event:

`event_type` · `severity` · `category` · `severity_score` · `auto_actions` · `package_name` (process, package, or USB device name) · `details` (human-readable, may contain a peer IP, port, or domain) · `raw` (the structured finding: IP, port, process, matched indicator, family) · `recorded_at`.

This is the honest boundary, and it matters:

- **mDM message content is end-to-end encrypted and the operator cannot read it.**
- **mLIDAR telemetry is not.** It is uploaded and readable by the operator.

Any claim that mLIDAR is "100% on-device" or that "nothing phones home" is false and must not be made about mLIDAR. The [`@mosadd/threat-engine`](../packages/threat-engine) *package* is genuinely pure — a function with no network — but the collectors that use it do upload.

mLIDAR is off unless you turn it on, and turning it off stops collection immediately.

## Signal only — the design constraint that is the moat

mLIDAR **logs, alerts, and notifies**. That is the complete list of things it does.

It does not disconnect calls, destroy rooms, quarantine files, revoke your sessions, or wipe your account. The taxonomy carries an advisory `autoActions` field whose values include `disconnect_call` and `wipe_account` — **no mosADD code path executes any of them**, `evaluateEvent()` never returns them, and the `threat_classify` MCP tool deliberately answers `action: "monitor"`. They describe what a stricter host could choose to implement with its own authority.

This is a deliberate constraint, not an unfinished feature:

1. **A false positive that acts is worse than a missed signal.** Automatically wiping an account or dropping a call on a guess does more damage than the threat being guessed at.
2. **Consumer-device threat detection is probabilistic.** Anyone promising automated response on top of probabilistic detection is either lying or shipping a monitor-only default and not saying so.
3. **An alert you can trust is worth more than an action you can't.** An mLIDAR alert means "look at this" — never "we already did something on your behalf".

The same restraint runs through the detection path. Public threat feeds legitimately list major platforms as malware-hosting, because attackers host payloads there. Measured on production, one feed put `github.com`, `raw.githubusercontent.com`, `drive.google.com` and `cdn.discordapp.com` into the indicator store as crimeware domains — matching 2 of the 20 entries in an ordinary developer's DNS cache. That feed was dropped, and a **never-alert allowlist** now guarantees no future feed change can make mLIDAR scream at every user. Domain matching also walks parent domains without ever matching a bare public suffix, so `mail.evil.com` matches an indicator for `evil.com` while `notevil.com` does not.

**A false CRITICAL is worse than a missed signal.** That principle is why the alerts mean something.

## Pegasus and mercenary spyware

**Detecting mercenary spyware is what mLIDAR is being built for.** It is the destination, the reason the module exists, and the standard we are holding ourselves to. This section is about being precise on the difference between where we are going and where we are.

### The method

mLIDAR follows the same approach as Amnesty International's Mobile Verification Toolkit and iVerify: match observable device activity against published **indicators of compromise** from mercenary-spyware research. Four indicator types matter — IP addresses, domains, process names, and package names.

The most important design decision: mLIDAR matches **domains as domains, against the OS DNS resolver cache** — what the machine *looked up* — not what a domain resolves to today.

That distinction is the whole method, and one implementation detail makes it work: **Windows caches NXDOMAIN**. A failed lookup is still a cached lookup. So when an implant on the machine tries to reach a C2 that was seized in 2021 and gets nothing back, the attempt is still visible. Whether the C2 still resolves is irrelevant to whether something on your machine reached for it.

This is what turns 1,281 dead domains from useless trivia into evidence, and it is how Amnesty's MVT does it too.

**The road not taken.** The obvious alternative — resolve the indicator domains to IPs and match those — was built, measured, and deleted. Of the 1,438 published 2021 Amnesty NSO domains, **157 (10.9%) still resolve** (a full census, not a sample). Every one of the 124 resulting IP addresses was reverse-resolved, and **not one is plausible live C2 infrastructure**: they are expired domains re-registered onto parking and CDN — AWS Global Accelerator, Cloudflare shared IPs, Wix, Shopify, WordPress.com, Google, Facebook's edge, and one pointing at `127.0.0.1`. Shipping that mechanism would have put Facebook and Cloudflare into a `critical`/`pegasus` blocklist and fired at millions of users. It was deleted rather than shipped.

Findings are graded by family, deliberately:

- A confirmed **Pegasus**-family C2 hit emits `PEGASUS_C2_BEACON` at **critical**.
- Other mercenary families (Predator/Cytrox, Wintego, NoviSpy, FinFisher, DoNot) emit `SPYWARE_C2_BEACON` at **critical**.
- Crimeware, botnet C2, stalkerware, and *compromised legitimate hosts* emit `SPYWARE_C2_BEACON` at **elevated** — real, but not "a nation state is targeting you".

That grading matters. Telling someone they have Pegasus when they hit a botnet domain is the kind of false alarm that destroys trust in every subsequent alert.

### What we do NOT claim

Stated explicitly, because several of these were once live on our own website and were false:

- ❌ **"The only messenger that detects Pegasus."** We are not, and a catalog entry is not a detection.
- ❌ **Zero-click exploit detection.** Not implemented. A zero-click chain leaves little on-device residue an unprivileged collector can see.
- ❌ **IMSI-catcher / Stingray detection.** In the taxonomy; no detector emits it.
- ❌ **Rogue-certificate, jailbreak, or stalkerware detection as shipped features.** Taxonomy entries without detectors. Stalkerware *indicators* are in the store; the package-matching detector that would consume them is not built.
- ❌ **"100% on-device, zero cloud custody."** False for mLIDAR — see [what leaves your device](#what-leaves-your-device).
- ❌ **"24/7 live monitoring, no polling."** It is a 60-second poll. Polling is fine; misdescribing it is not.
- ❌ **Any count of taxonomy entries presented as a count of detections.** See the [taxonomy-vs-detector distinction](../packages/threat-engine/README.md#read-this-first-a-taxonomy-entry-is-not-a-detector).

### What is genuinely true

> **We detect a machine reaching for 4,166 known mercenary-spyware C2 domains — including dead ones, which is precisely what an implant does.**

That is the claim, stated at its true size. Alongside it:

- Real **IP matching** against 9,548 indicators, daily-refreshed.
- Indicator coverage spanning **Pegasus/NSO, Cytrox/Predator, Wintego, NoviSpy, FinFisher, DoNot and stalkerware families** — not one vendor, and not only 2021-era intel.
- Eleven **anti-tamper and posture detectors** on Android and four on desktop that fire on ordinary devices today.
- **Family-graded severity**, so a crimeware hit is never reported as a nation-state implant.

### The blunt limit

**Live Pegasus infrastructure is still not detectable.** No free public feed contains live Pegasus C2s. ThreatFox — the largest feed we ingest — carries **zero** mercenary-spyware families; its top families are commodity crimeware (IClickFix, Cobalt Strike, ClearFake, AsyncRAT). What we match are *published, historical* mercenary indicators.

The binding constraint is **intelligence, not code**. The matching engine is built and works; nobody publishes live mercenary C2s in the open, because doing so burns the research that found them. This is why the path forward is behavioural correlation rather than waiting for someone else to publish IOCs — see [where this is going](#where-this-is-going).

### What we refused to ship

The rejections are part of the design, not an omission from it:

- **URLhaus was dropped entirely.** It listed `github.com`, `raw.githubusercontent.com`, `drive.google.com` and `cdn.discordapp.com` as crimeware domains — legitimately, since attackers host payloads there. Measured against one engineer's own DNS cache, it matched **2 of 20 entries**.
- **ThreatFox's `is_compromised=true` rows were dropped, not downgraded** — 1,178 hijacked legitimate sites. A hacked WordPress blog serving a payload is real, but alerting a user that their machine "contacted mercenary-spyware infrastructure" because they read a compromised blog is a false accusation.

A never-alert allowlist now guards both ingest and matching. Re-measured after those decisions, the store produced **exactly one match against a real developer's DNS cache: the deliberate test indicator.**

## What fires today

> **This block is the update point.** It is dated, scoped, and deliberately isolated so it can be refreshed without touching the surrounding prose. Everything here was measured on production, not estimated.

<!-- MLIDAR-COVERAGE:BEGIN — measured 2026-07-30 -->

**Measured 2026-07-30.**

**Detectors.** Twenty distinct event types are emitted across the three collectors — 7 desktop, 11 Android native, 2 web. The full per-event and per-category breakdown lives in [`packages/threat-engine/README.md` → Coverage today](../packages/threat-engine/README.md#coverage-today).

**Indicator store: 1,444 → 16,703 rows.**

| Type | Rows | Sources |
|---|---|---|
| **IP** | 9,548 | abuse.ch feodo-aggressive · abuse.ch threatfox · amnesty NoviSpy 2024 · amnesty FinFisher 2020 · abuse.ch feodo |
| **Domain** | ~6,500 | amnesty Android 2023 · amnesty NSO 2021 (1,438) · abuse.ch threatfox · Echap stalkerware · amnesty Cytrox 2021 · amnesty Wintego 2024 · amnesty DoNot 2021 · amnesty FinFisher 2020 · amnesty NSO Morocco 2019 |
| **Package** | 644 | Echap stalkerware · amnesty NoviSpy 2024 |
| **Process** | **0** | no free feed of desktop process names exists |

Of the domain indicators, **4,166 are mercenary-spyware C2s** (1,438 Pegasus + 2,728 other mercenary families), alongside 1,009 stalkerware and 1,336 crimeware. Refreshed daily by a scheduled job.

**Status of each IOC detector:**

| Detector | Before | Now |
|---|---|---|
| `PEGASUS_C2_BEACON` — domain lookup | never fired | ✅ **Fires (Windows)** — 1,438 Pegasus domains |
| `SPYWARE_C2_BEACON` — domain lookup | never fired | ✅ **Fires (Windows)** — 2,728 other mercenary + 1,009 stalkerware + 1,336 crimeware |
| C2 beacon by peer IP | 5 IPs | ✅ **Fires** — 9,548 IPs |
| Domain via reverse-DNS of live peers | never | ✅ **Fires, all OSes** (partial coverage — the fallback where no unprivileged resolver-cache dump exists) |
| `SPYWARE_PROCESS_MATCH` | never | ❌ **Still never** — 0 indicators; no free feed of desktop process names exists |
| `SPYWARE_PACKAGE_MATCH` | never | ❌ **Still never** — 644 indicators ready, needs Android package enumeration (LINEAR-4833) |

**Verification status, stated precisely:** the desktop domain-matching path is verified by unit tests, a verbatim probe, and matching against real indicator data. It has **not yet been run inside a running Electron build with a logged-in session** (version bumped 0.2.17 → 0.2.18; needs a build and one live run). It is not field-proven yet, and should not be described as such.

<!-- MLIDAR-COVERAGE:END -->

## Where this is going

The roadmap, stated as intent rather than capability. None of this is shipped; when an item ships it moves into [what fires today](#what-fires-today) with a date.

**The strategic point first.** Matching published IOCs will never detect *live* Pegasus, because live mercenary C2s are not published. Waiting for someone else's feed is a dead end by construction. The path to Pegasus-class detection that does not depend on external intelligence is **behavioural correlation** — recognising the *shape* of an implant from signals we already collect, rather than its address. The correlation layer (`threatCorrelate.ts`, and a `PEGASUS_COMPOSITE` event) and the posture signals it reasons over already exist; connecting them is the work.

| | Goal | Why it matters |
|---|---|---|
| **Now** | Behavioural correlation — composite detection from posture + network signals already collected | The only path to live mercenary-spyware detection that doesn't wait on someone else publishing IOCs. This is the moat |
| **Next** | Android package enumeration so the 644 stalkerware/NoviSpy indicators reach `SPYWARE_PACKAGE_MATCH` ([LINEAR-4833](https://linear.app/ip-ra/issue/LINEAR-4833)) | The data is already in the store; cheapest real capability gain available |
| **Next** | One live Electron run to field-prove the desktop domain path | Verified by tests and probes today; not yet proven in a running build |
| **Then** | Native iOS collector | iOS is where mercenary spyware concentrates and where we are shallowest. Gated on an Apple Developer account |
| **Then** | Artifact-path scanning (`SPYWARE_ARTIFACT_PATH`), rogue MDM/configuration-profile detection (`ROGUE_CONFIG_PROFILE`) | Closes the two SPYWARE slots that need no external feed |
| **Ongoing** | Fresher mercenary intelligence | The binding constraint on IOC-based detection — intelligence, not code |

The bar for moving anything out of this table is the same as everything else in this document: it fires on a real device, and we can show you where.

## Plugging in your own feeds and detectors

The engine is Apache-2.0 and has no backend. You can run the classification layer without mosADD at all.

**Classify your own events:**

```ts
import { evaluateEvent, getEventDef } from "@mosadd/threat-engine";

const def = getEventDef("PEGASUS_C2_BEACON");
// → { category: "SPYWARE", severity: "critical", platforms: ["desktop", "apk"], ... }

const decision = evaluateEvent({ eventType: "AUTH_BRUTEFORCE" });
// → { action: "revoke_sessions", severity: "critical", reason: "..." }
// YOU execute the action. The engine never acts.
```

**From an agent, offline** — via [`@mosadd/mcp`](../packages/mcp): `threat_catalog` lists the taxonomy (filter by `category` or `platform`); `threat_classify` classifies one event. Both are pure, need no backend, and work fully offline.

**Writing a detector.** The contract is small: observe a condition, pick the taxonomy event id that honestly describes it, emit it. Three rules that keep the signal trustworthy:

1. **Use an existing event id.** Do not invent one to make a number look bigger. If nothing in the taxonomy fits, that is an RFC, not a local constant.
2. **Baseline before you alarm.** The first observation establishes normal; report the change, not the state.
3. **Allowlist aggressively.** Any feed you ingest will eventually contain something legitimate. Decide in advance what you will never alert on.

**Adding an indicator feed.** Indicators carry a type (`ip` · `domain` · `process` · `package`), a value, a family, and a severity. Two things to get right: grade families honestly, so crimeware never reports as nation-state; and check what your feed considers malicious before trusting it — the allowlist exists because a real feed listed GitHub.

**Adding a taxonomy event** requires an RFC ([RFC 0001](./rfcs/0001-module-naming.md)), and the bar is deliberately high: an event nothing emits is a slot, and slots have historically been miscounted as capabilities.

---

## Related

- [`packages/threat-engine`](../packages/threat-engine) — the taxonomy, the decision engine, coverage tables
- [`docs/security/threat-model.md`](./security/threat-model.md) — STRIDE threat model for the public layer
- [`docs/security/e2ee-posture.md`](./security/e2ee-posture.md) — what encryption copy is allowed to say
