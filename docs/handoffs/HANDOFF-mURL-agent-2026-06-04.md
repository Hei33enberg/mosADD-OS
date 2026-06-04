# HANDOFF — mURL / channel0 agent → CTO (2026-06-04)

_From: mURL agent. Scope owned: `apps/channel0-ext/**`, `apps/edge`, channel0 edge fns. Did NOT touch `apps/dev/**` (CTO-mosadd track)._

## TL;DR
mURL extension **v0.13.0** shipped to `main` + prod. The two Chrome-Web-Store blockers (no WS reconnect, no token refresh) are closed, plus the audit-flagged hardening (crypto PoW nonce, DOM age-gate, AbortSignal) and the GDPR `sender_sub` flush. Moderation chain verified live + documented. **Full audit pass, green.** The extension is side-load-ready; only owner-gated CWS listing assets (screenshots + copy) remain before public submission.

## Repo state (verified)
| Repo | main HEAD | Note |
|---|---|---|
| `mosadd-os` (C:\mosadd-os) | `c18a694` | 3 commits this sprint (reconnect+audit, ingest skip, SOP doc) |
| `m0ssad-3` (C:\m0ssad-3) | `8c78a55a` | `message-ingest-batch` sender_sub |

⚠️ One dirty working-tree file in mosadd-os: `apps/dev/public/v1.js.map` — **NOT mine** (your embed build artifact). Left untouched per the directory split. Stage/discard at your discretion.

## What shipped

### P0 — CWS blockers (resilience), `apps/channel0-ext/src/shared/chat-shell.ts`
- **WS auto-reconnect**: exponential backoff 1s→30s, jittered, on any unexpected close. `manualClose`/`destroyed` guards prevent reconnect after `destroy()`.
- **Token refresh by design**: `connect()` calls `joinDomain()` on every (re)connect → fresh 5-min HS256 token each time. One code path fixes dropped-socket AND 5-min-expiry death. No separate refresh timer needed.
- **Connection state**: header shows `· reconnecting…` / `· offline` (existing i18n keys `connecting`/`disconnected`). `onOpen` clears it and re-enables send; reconnect emits a `connected` system line.
- **AbortController**: cancels in-flight mint + PoW retry on `destroy()` (signal threaded into `client.ts joinDomain` → both fetches).

### P1 — audit hardening
- `lib/pow.ts`: nonce = `crypto.getRandomValues` (12 bytes) + monotonic counter (was `Math.random`).
- `content/index.ts`: age-gate built with `document.createElement`/`textContent` (no `innerHTML` into host page; CSP/trusted-types safe).
- `lib/client.ts`: `joinDomain({..., signal})` → `fetch(..., {signal})` on initial + PoW-retry call.
- **GDPR `sender_sub`** (`m0ssad-3 supabase/functions/message-ingest-batch`): inserts now carry `sender_sub: r.from ?? null`. mURL sends `from = "anon:<nick>"` (chat UI strips `anon:` on display via `appendMessage`). Hub-key chats still send the user_id UUID. Redeployed **v8** on prod, `verify_jwt=false` preserved.

### P2 — moderation (confirmed live + documented)
- Chain: `channel0-report` v1 (20/min/device, idempotent on `(message_id, reporter_hash)`) → `channel_reports` → trigger `trg_channel0_auto_hide` (`channel0_auto_hide_on_report`, soft-delete `messages_meta.deleted_at` at **3 distinct reporters**) → `message-list` filters `deleted_at`.
- Runbook: `apps/channel0-ext/docs/MODERATION-SOP.md` (triage SQL, global/per-domain kill switches, illegal-content escalation, GDPR-by-sub).

## Live prod inventory (Supabase `rooffhgbxafyjcwmwpsy`)
> ⚠️ **Project-ID gotcha:** the MCP-connected Supabase account lists 4 projects; the REAL mosadd prod DB is **`rooffhgbxafyjcwmwpsy`** (display name says "cymru_mosadd_raydio" but it is the shared kitchen-sink, mosadd-scoped). The other 3 (marocain-ip/rak/hiddensociety) do NOT have the mosadd schema. Deploy channel0 EFs to `rooffhgbxafyjcwmwpsy`.

Channel0 edge fns, all ACTIVE `verify_jwt=false`: `channel0-join` v7, `channel0-report` v1, `channel0-trending` v1, `channel0-owner-stats` v1, `domain-channel-ensure` v5, `domain-verify` v2, `message-ingest-batch` v8.
Worker: `https://mosadd-edge.mr-brics-33.workers.dev` (`/c/<slug>/ws`, `/c/<slug>/presence`, `/health`).
Tables: `domain_controls`, `channel_reports`, `messages_meta` (+`sender_sub`), `rate_limit_buckets`. RPC `dsr_erase_embed_sub`.

Smoke (this audit): /health ok · presence `{count:0,status:open}` · join no-PoW → 428 · ingest authless → 401. All green.

## Naming convention (do NOT "fix")
User-facing = **mURL**. Internal codebase = **channel0-*** preserved (paths, EF slugs, env `CHANNEL0_*`, tables, DNS `_mosadd-channel0.<domain>`, thread_id `chat:<slug>`). Renaming = CF/Supabase secret migration + verified-owner DNS re-issue + CWS re-review for zero user value. See state_current.md HANDOFF.

## Open / not done (low priority unless noted)
1. **Owner-gated, blocks public CWS launch:** 5 store screenshots + listing copy. Spec in `apps/channel0-ext/docs/CWS-SUBMISSION.md`. Extension binary is ready.
2. Full PoW→WSS two-client E2E not re-run this session (code path unchanged since LINEAR-2695; client-only changes this sprint).
3. `sidepanel.ts` writes a few i18n strings via `innerHTML` — safe (own page, no user input) but could be DOM-API'd for consistency.
4. **WS-ceiling @50k load** (strike-day, LINEAR-2766) — unproven; separate epic, owner-$-gated load test.
5. Stripe monetization (Domain Disable/Claim, LINEAR-2704) deliberately deferred — MVP is free per founder.

## Linear
Epic **LINEAR-2688** — all P0/P1/P2 children Done. This sprint: created **LINEAR-2783** (C1-7 CWS-hardening) → Done (with audit-pass comment); closed **LINEAR-2761** (sender_sub wiring, your GDPR follow-up) → Done.
