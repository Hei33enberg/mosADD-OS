# Phase 2 — Commercial Hub design

> **Status:** design draft. Concrete implementation lands after Phase 1 (the public OS layer, this repo) is npm-published and has its first 50 users. Tracking in Linear M5 milestone tickets [LINEAR-2158](https://linear.app/ip-ra/issue/LINEAR-2158) – [LINEAR-2162](https://linear.app/ip-ra/issue/LINEAR-2162).

The commercial hub at `hub.mosadd.com` and `mcp.mosadd.com` is **proprietary** and lives in the `m0ssad-3` repo, not this one. This document describes the contract the hub honours with the public mosadd-os toolkit, so OSS contributors and self-hosters know exactly what the hub does for you (and what you'd reimplement in a self-host scenario).

## Five hub responsibilities

The hub exists to do five things the open-source mosadd-os intentionally doesn't:

### 1. Hosted MCP gateway — `mcp.mosadd.com` ([LINEAR-2158](https://linear.app/ip-ra/issue/LINEAR-2158))

`@mosadd/mcp` ships with stdio transport. ChatGPT Apps, Lovable, Bolt, v0.dev — every browser-first agent runtime — speaks HTTP/SSE. The hub provides:

- HTTPS endpoint `https://mcp.mosadd.com/sse` (and `/streaming`)
- OAuth flow (PKCE) replacing today's BYOK env-var JWT chore
- mosadd account ⇄ provider key brokerage (see §2)
- Per-tool rate limits + abuse signal (see §3)

Self-host alternative: any user can run `npx @mosadd/mcp` + `mcp-proxy` themselves. The hub just removes that step.

### 2. BYOK key brokerage ([LINEAR-2159](https://linear.app/ip-ra/issue/LINEAR-2159))

Today's alpha asks users to paste `M0SSAD_SUPABASE_*` env vars into agent configs. That's friction and a leak surface. The hub:

- Stores user provider keys (Supabase, Telnyx, Twilio, LiveKit, Resend, ElevenLabs) AES-256-GCM at rest, keys never leave the AWS KMS envelope
- Mints short-lived (≤15 min) provider-scoped JWTs on each `mcp.mosadd.com` request
- Audit-trails every key use to the threat radar (see §3)
- Users can opt for **self-host BYOK**: same code, but the secret store points at their own Vault / Doppler / AWS Secrets Manager instance — enterprise tier.

### 3. 167-event threat radar middleware ([LINEAR-2160](https://linear.app/ip-ra/issue/LINEAR-2160))

The moat. Every operation through the hub emits one or more events into the radar pipeline:

```
operation → @mosadd/threat-engine → radar event → severity scoring
         ↓
    audit_events table          (cold storage, 90-day retention, NIS2-compliant)
         ↓
    real-time abuse scoring     (BEHAVIORAL.mass_dm, COMINT.deepfake_voice, …)
         ↓
    block / allow / quarantine  (per-tier policy)
```

Open-source `@mosadd/threat-engine` ships the 167-event taxonomy and scoring primitives. The hub adds:

- Real-time correlation across channels (a single actor sending mDM + mTELEGRAM + mDISCORD spam looks innocent on each channel; correlated, it's abuse)
- Cross-tenant threat intel feeds (private — paid threat intel partners, MISP feeds, our own observations)
- ML scoring on voice (deepfake detection on PTT / mCALL inbound)
- ML scoring on text (prompt-injection detection — model: distilled adversarial classifier)
- Quarantine workflow: high-severity operation → human review queue

Self-host: `@mosadd/threat-engine` runs locally with the open 167-event taxonomy. You won't get cross-tenant intel, but the kernel is the same.

### 4. Billing / metering ([LINEAR-2161](https://linear.app/ip-ra/issue/LINEAR-2161))

Stripe-fronted metering of:

- MCP tool calls (per-call cost — covers our infra overhead)
- Provider passthrough (Telnyx PSTN minutes, Resend emails, LiveKit room-hours — unit costs marked up by tier)
- Threat radar event evaluation (free for tier A self-host, included in tier B+)
- Storage (call recordings, message archive, audit_events retention beyond default)

Pricing tiers (as designed today — may shift before launch):

| Tier | Audience | Price | Limits |
|---|---|---|---|
| A — Self-host OSS | Solo devs, privacy enthusiasts | $0 | All limits = your own infra |
| B Free — Hosted | Trying mosadd | $0 | 100 msg / 30 min PTT / 0 PSTN per month |
| B Pro | Builders, indie agents | $9 / month | 10 k msg / 10 h PTT / 60 min PSTN |
| B Team | Small teams | $49 / month / 5 seats | 100 k msg / 100 h PTT / 600 min PSTN |
| C Enterprise | Banking, gov, NIS2 scope | Custom | Self-host + BYOK + SLA + dedicated radar feeds + audit log retention 7 y |

### 5. SaaS dashboard — `hub.mosadd.com` ([LINEAR-2162](https://linear.app/ip-ra/issue/LINEAR-2162))

Where users manage everything self-service:

- Sign up / OAuth setup
- BYOK provider key inputs
- Usage dashboards (per channel, per tool, per time window)
- Threat radar timeline (filterable by severity, channel, time)
- Billing (Stripe customer portal)
- Audit log viewer
- API key management (rotate, revoke, scope)

Tech: Next.js + Supabase Auth + Stripe Checkout. Lives in `m0ssad-3/apps/hub-web` (does not exist yet).

## Trust boundaries

The contract between the public OSS layer and the hub:

```
┌─────────────────────────────────────────────────────────────────┐
│  Public OSS layer (this repo — mosadd-os)                       │
│                                                                  │
│  - @mosadd/mcp     — MCP server, stdio + HTTP (no auth built-in)│
│  - @mosadd/providers — direct calls to Supabase/Telnyx/...      │
│  - @mosadd/threat-engine — emits events, no scoring decisions   │
│  - @mosadd/ai     — framework adapters (no auth, BYOK env vars) │
│                                                                  │
│  Anyone can self-host this whole layer. Apache-2.0 forever.     │
└─────────────────────────────────────┬───────────────────────────┘
                                       │ contract
┌─────────────────────────────────────▼───────────────────────────┐
│  Commercial hub (proprietary — m0ssad-3)                        │
│                                                                  │
│  - mcp.mosadd.com   — HTTP/SSE wrapper around @mosadd/mcp       │
│  - hub.mosadd.com   — SaaS dashboard                             │
│  - radar middleware — real-time abuse scoring on top of events  │
│  - BYOK key broker  — KMS-backed secret store                    │
│  - billing meter    — Stripe + per-tool cost rules               │
│  - threat intel feeds — proprietary + 3rd-party partners        │
└─────────────────────────────────────────────────────────────────┘
```

## What this means for contributors

**If you contribute to mosadd-os**: you contribute to the public layer above the line. Your code stays Apache-2.0 forever (per [GOVERNANCE.md](../../GOVERNANCE.md)). The hub never relicences it.

**If you contribute *to the hub*** (joining the commercial entity, getting paid): different agreement, different repo, no public commitments. Currently a closed team; the founder is hiring as the company funds maintenance of the OSS layer.

**If you self-host**: you get everything above the line. You miss out on cross-tenant threat intel and abuse correlation (those come with hosted plans). For 90% of self-host use cases (org-internal mosadd, privacy-paranoid solo users), that's a feature, not a bug.

## Open questions

These need answers before Phase 2 implementation starts:

- **Egress costs.** Hosted PSTN minutes through Telnyx + STIR/SHAKEN regulatory cost — what's our floor margin per minute? Need a model.
- **Threat intel partnerships.** Which feeds? MISP is free. CrowdStrike / Mandiant / Recorded Future paid feeds cost five-six figures per year — when does that pay off?
- **Cross-tenant data isolation.** Radar correlation needs aggregated signals. How do we prove to enterprise tenants their data doesn't leak through aggregates? Differential privacy? Separate tenant-isolated feeds?
- **Provider failover for mCALL.** If Telnyx cuts us off (regulatory dispute), Twilio takes over with what user experience? Spec needed.

## Timeline

Phase 2 work starts when Phase 1 hits all of:

1. `@mosadd/mcp` published to npm with ≥50 weekly downloads
2. 5/5 MCP registries indexed
3. ≥10 GitHub stars on mosadd-os
4. ≥3 community contributors with merged PRs
5. mTALK + mCALL Phase 1 designs accepted (RFCs)

ETA: 3-4 months Phase 1 to maturity → Phase 2 build → another 3-4 months to commercial GA. Realistic 6-8 months total from today to hub.mosadd.com being a paid product.
