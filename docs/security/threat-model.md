# Threat model — mosadd-os v3.0.0

Last reviewed: 2026-05-27. Owner: AG (Hei33enberg).
Partial correction 2026-08-01: removed references to components that do not exist in this repo (a LiveKit fork "mosadd-fabric", a `@mosadd/daemon` package) — voice media runs on the hosted LiveKit service. A full re-review (mURL revival, mAYL rename, mLIDAR) is overdue and tracked.

STRIDE-derived threat model for the public Apache-2.0 layer of mosadd. Covers the MCP server and the per-channel m* modules. The proprietary hub (radar, BYOK broker, billing) has its own private threat model in a separate proprietary repo.

## Scope

In scope:

- `@mosadd/mcp` server (stdio + future HTTP/SSE)
- `@mosadd/ai` framework adapters (Vercel, LangChain, OpenAI Agents, Anthropic)
- `@mosadd/crypto`, `@mosadd/protocol`, `@mosadd/threat-engine` library code
- PTT floor-control (mTALK) — the floor logic in `@mosadd/mcp`; audio media runs on the hosted LiveKit service (no fork in this repo)

Out of scope:

- The hosted hub (`mcp.mosadd.com`, `hub.mosadd.com`) — proprietary
- Consumer apps (`mosadd.com`, PWA, Android, iOS, Electron)
- Hardware firmware (separate project, out of scope here)
- The hosted radar middleware

## Assets

| Asset | Sensitivity | Owner |
|---|---|---|
| End-user JWTs | High — auth | Supabase Auth |
| BYOK provider keys (Resend, LiveKit) | High — financial | User-supplied env vars |
| Tool-call payloads (DM bodies, email content, room contents) | High — privacy | User |
| Identity recovery seed / passphrase | Critical — account recovery | User local |
| Threat-engine event taxonomy | Moderate — public catalog | repo |
| Source code | Moderate — Apache-2.0 published | repo |
| LiveKit (hosted service) API tokens | High | Operator |

## Trust boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  END USER ENVIRONMENT (laptop / hardware device)            │
│  ┌────────────────────────────┐    ┌──────────────────────┐ │
│  │  LLM client                │    │  voice client        │ │
│  │  (Claude Code, Cursor, …)  │    │  (audio data plane)  │ │
│  └─────────────┬──────────────┘    └──────────┬───────────┘ │
└────────────────┼───────────────────────────────┼────────────┘
                 │  MCP stdio                    │  WebRTC
┌────────────────┼───────────────────────────────┼────────────┐
│  @mosadd/mcp (control plane)                   │            │
│  ┌─────────────────────────────────────┐       │            │
│  │  Tool registry + dispatcher         │       │            │
│  └─────────────┬───────────────────────┘       │            │
└────────────────┼───────────────────────────────┼────────────┘
                 │ HTTP                          │ WebRTC
┌────────────────┼───────────────────────────────┼────────────┐
│  Backend (BYOK by user — or mosadd hub Phase 2)             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │  Supabase    │  │  Resend      │  │  LiveKit        │    │
│  │  Edge fns    │  │  ElevenLabs  │  │  (hosted svc)   │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Boundaries:

- **B1:** LLM client → MCP server (stdio): one-way trust. MCP server trusts the LLM that the stdin/stdout pipe is private.
- **B2:** MCP server → backend (HTTP): two-way. Backend authenticates with the JWT or BYOK keys; MCP server trusts the TLS PKI.
- **B3:** Voice client → LiveKit (WebRTC): the client trusts the JWT issued by MCP; LiveKit trusts the client to enforce floor control client-side until the server-side check lands.

## STRIDE per component

### MCP server

| Threat | Vector | Mitigation |
|---|---|---|
| **S**poofing | LLM injecting forged tool result | Tool results are validated against the registered schema before the LLM sees them; no untrusted plaintext returned without schema check |
| **T**ampering | Modified BYOK env var pointing to attacker backend | `env.MOSADD_*_URL` should be reviewed before deploy; future: pin known providers with allowlist |
| **R**epudiation | User claims they didn't issue the tool call | Every tool invocation emits an audit event via `@mosadd/audit-core` (Phase 2 hub middleware) |
| **I**nformation disclosure | Tool error message leaks API key | All error messages scrubbed via central error formatter; never echo `Authorization` |
| **D**enial of service | Agent loops calling `mDM_send` 1000x | Rate limit middleware (Phase 2 hub), local stdio caps via client-side delay |
| **E**levation | Tool call bypasses RLS to read other users' rows | Always pass user JWT through to Supabase; never use service role in stdio mode |

### Identity recovery

| Threat | Vector | Mitigation |
|---|---|---|
| S | Attacker claims recovery for another user | Cloud-encrypted backup requires passphrase + email OTP; BIP39 seed self-custody (no recovery via mosadd if lost) |
| T | Recovery flow intercepted, swap user_id | Recovery responses use user-specific encryption keys; cannot be replayed against a different account |
| I | Passphrase exposed in client memory | Memory-zero after KDF; never logged; never sent to backend in plaintext |
| D | Lockout via wrong-passphrase brute force | Server-side throttle 5 attempts/hour, exponential backoff |

### LiveKit hosted service (mTALK voice)

| Threat | Vector | Mitigation |
|---|---|---|
| S | Floor-control bypass — speaker injection by non-floor-holder | Server-side floor-control middleware (Go ~3-5k LOC, see LINEAR-2149) gates RTP forwarding |
| T | Audio modified in flight | DTLS-SRTP hop-by-hop (client ↔ LiveKit SFU); media terminates at the server-relayed SFU — NOT end-to-end between participants |
| I | Recording leaks via S3 bucket misconfig | Recordings written to per-room ephemeral storage; signed URLs with 5-min TTL |
| D | Track flood — attacker publishes 1000 audio tracks | Per-participant track cap (default 2 audio, 1 video) |
| E | Participant promoted to admin via crafted token | LiveKit tokens are signed; we add `mosadd_role` claim and verify server-side |

## DREAD scoring — top 10

Ordered by composite risk (D+R+E+A+D / 5):

| # | Threat | D | R | E | A | D | Score |
|---|---|--:|--:|--:|--:|--:|--:|
| 1 | Service-role key leak in Edge Function logs | 10 | 9 | 7 | 10 | 9 | **9.0** |
| 2 | Floor-control bypass on mTALK (forwarded as authorized speaker) | 8 | 8 | 6 | 9 | 8 | **7.8** |
| 3 | BYOK LiveKit key compromise → unauthorized media/recording access | 8 | 6 | 5 | 8 | 7 | **6.8** |
| 4 | Identity recovery passphrase phishing via crafted email link | 9 | 7 | 6 | 8 | 6 | **7.2** |
| 5 | Deepfake voice in mTALK room (impersonation) | 8 | 7 | 7 | 6 | 7 | **7.0** |
| 6 | mAYL outbound abused for spam/phishing from `<id>@mosadd.com` | 7 | 8 | 7 | 6 | 7 | **7.0** |
| 7 | Tool poisoning — malicious MCP tool installed alongside mosadd | 8 | 6 | 7 | 6 | 6 | **6.6** |
| 8 | Replay attack on Stripe webhook (double-charge or skipped) | 6 | 5 | 5 | 7 | 7 | **6.0** |
| 9 | Supabase RLS misconfiguration exposes cross-tenant rows | 8 | 5 | 4 | 7 | 6 | **6.0** |

Mitigation tracking:

- #1 → gitleaks + GitHub secret scanning + push protection (SHIPPED 2026-05-27)
- #2 → server-side floor control middleware (LINEAR-2149, Phase 1)
- #3 → BYOK broker + scoped/short-TTL LiveKit tokens (Phase 2)
- #4 → recovery flow UX research (LINEAR-2170, Phase 1)
- #5 → voice fingerprint cross-check (Phase 2 radar)
- #6 → per-identity send rate limit + SPF/DKIM + radar BEHAVIORAL.mass_mail (Phase 1/2)
- #7 → audit existing MCP servers in registry submission flow (Phase 1)
- #8 → idempotency keys + raw event reconciliation cron (Phase 2)
- #9 → RLS policy tests in CI + least-privilege keys (Phase 1)

## Updates

Re-review quarterly or on any SEV-0/1 incident. Record the review date at the top of this file.
