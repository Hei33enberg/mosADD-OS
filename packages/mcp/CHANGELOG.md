# Changelog

All notable changes to `@mosadd/mcp` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows the `3.0.0-alpha.N` pre-release line until the hosted
gateway (Phase 2) ships.

## [Unreleased]

## [3.0.0-alpha.22] — 2026-06-26

### Fixed
- **alpha.21 was broken on a fresh install** — it crashed on startup with
  `SyntaxError: The requested module '@mosadd/crypto' does not provide an export named
  'initRatchetInitiator'`. The workspace dependency packages (`@mosadd/crypto`, `protocol`,
  `providers`, `threat-engine`) had drifted: their *source* gained new exports (the mDM
  Double-Ratchet work) but their version was never bumped, so npm still served the stale
  alpha.4/alpha.5 builds while `@mosadd/mcp` was built against the newer API. Bumped the whole
  alpha-line in lockstep to alpha.22 and republished so every published package matches current
  source and `workspace:*` cross-deps resolve. Verified: a clean `npm i @mosadd/mcp@alpha`
  now boots and lists 62 tools. (The previous alpha.20 was broken-on-install the same way.)

### Changed
- **Unregistered 2 scaffold tools that failed on every call.** `mp0st_send_as_agent`
  (POSTed to a non-existent `hub-claim-mint` endpoint → 404, and sent provenance body
  fields the deployed `mp0st-send` EF never reads) and `mTALK_ingest_ptt` (request body
  didn't match the deployed `ptt-ingest` EF → 400). Both are now commented out in
  `tools/index.ts` like the other not-registered modules, so an agent only ever discovers
  tools that actually work. Registered tool count **64 → 62** (mp0st 12→11, mTALK 6→5).
  Source is kept; both re-register once their backend contracts are wired + tested.

### Fixed
- **mIRC `reject_request` / `approve_request` field (LINEAR-3522):** the tools sent
  `request_id` but `channel-members-manage` reads `target_identity_id` → 400 every
  call. Renamed to `identity_id` (normalized to `target_identity_id`). `reject` now
  works; `approve` of an E2EE channel still needs a wrapped group key (LINEAR-3523).
- **mDM / mIRC message pagination (LINEAR-3524):** `mDM_list` read `cursor`/`has_more`
  but `message-list` history mode returns `next_before`, and `mIRC_list_messages`
  sent `cursor` (ignored; EF reads `before`) and read `next_cursor` (never returned)
  → neither paged past page 1. Send `before`, read `next_before`.

## [3.0.0-alpha.19] — 2026-06-19

### Removed
- **BREAKING — mROOM module killed (LINEAR-3414):** the 11 `mROOM_*` tools
  (`mROOM_create`, `mROOM_create_guest_link`, `mROOM_join`, `mROOM_leave`,
  `mROOM_close`, `mROOM_list`, `mROOM_voice_join`, `mROOM_send_message`,
  `mROOM_list_messages`, `mROOM_send_voice`, `mROOM_send_file`) are no longer
  registered. Ephemeral private rooms are re-cut into private mIRC channels.
  The source stays in `tools/mroom*.ts` (unregistered, like mURL/mCALL).

### Added
- **Defensive threat engine as MCP tools (LINEAR-3498):** `threat_catalog`
  (list the canonical 160+ threat-event taxonomy) and `threat_classify`
  (pure `evaluateEvent` decision → action/severity/reason). Wraps
  `@mosadd/threat-engine`; deterministic, offline, `requires: "any"`.

Net: 70 → **64 callable tools** across 5 live modules + comms + threat.

### Changed
- **BREAKING — mail tool rename:** the 12 email MCP tools are renamed
  `mAIL_*` → `mp0st_*` (`mp0st_list`, `mp0st_send`, `mp0st_view`, `mp0st_delete`,
  `mp0st_stats`, `mp0st_events`, `mp0st_metrics`, `mp0st_revoke`,
  `mp0st_audit_export`, `mp0st_consent`, `mp0st_notify`, `mp0st_send_as_agent`).
  No aliases — the old `mAIL_*` names no longer resolve. Backend Edge Functions
  (`mp0st-*`) are unchanged.

## [3.0.0-alpha.18] — 2026-06-18

### Added
- **`comms_embed_create`** — embed a LIVE mosadd channel into an app/site a builder-agent is
  generating (Lovable / Bolt / Cursor / v0). Mints a publishable embed key (`m_pk_live_…`,
  origin-scoped, via the `embed-keys` EF) and returns a paste-in widget snippet
  (`<div>` + `<script src="https://embed.mosadd.com/v1.js" data-key=…>`). The widget exchanges
  the publishable key for a short-lived channel-scoped JWT at runtime; the hub key never enters
  the browser. Extends `mROOM_create_guest_link` (link → embeddable widget). CDN override via
  `MOSADD_EMBED_CDN`. (Widget served from the dedicated `embed.mosadd.com` deploy.)

## [3.0.0-alpha.17] — 2026-06-18

### Added
- **Action Links — screen share.** `comms_action_create` gains a `screen_share` action
  type, and a new `comms_action_frame_get` tool lets the creating agent read frames of the
  recipient's shared screen (consent-gated, browser-sandbox only). Turns Action Links into
  "remote-desktop-lite" — the agent sees what the human chooses to share.

### Changed
- **Durable `mosadd login`.** The saved session (`~/.mosadd/session.json`) is now refreshed
  from its refresh token at server boot, so a single `mosadd login` keeps working across
  restarts — no more re-login when the access token expires.
- Onboarding README restructured (recommended auth path — `mosadd login` — first; hub API
  key second; DevTools JWT demoted), and the 61→70 / `mosadd.dev`→`mosadd.com` reconciliation
  (first shipped on the published package with this release).

## [3.0.0-alpha.16] — 2026-06-17

### Fixed
- `mAIL_view` now calls the `mp0st-get` Edge Function (read a message by id,
  owner-scoped) instead of `mp0st-view` (the tracking-pixel endpoint, which
  returned "Missing tracking ID"). ([LINEAR-2917])
- CI publish drops `--provenance` — npm returned 422 because the source repo
  (`mosadd-os`) is private, so provenance attestation is not available.

### Added (cumulative since alpha.4 — tool count 61 → 70)
- **Action links (Tier 1):** `comms_action_create` mints a one-link browser
  action an agent can hand to a human (run-with-consent in the mosadd sandbox).
- **mAIL provenance:** `mAIL_send_as_agent` stamps agent/human provenance on the
  message so the recipient sees who actually sent it.
- **File & voice attachments:** `mDM_send_voice` / `mDM_send_file`,
  `mROOM_send_voice` / `mROOM_send_file`, `mIRC_send_voice` / `mIRC_send_file`
  (reuse the existing `chat-files` bucket — no new transport).
- **mTALK → RAG:** `mTALK_ingest_ptt` feeds push-to-talk audio into the RAG index
  (opt-in, gated server-side).
- **mROOM:** `mROOM_create_guest_link` (single-call, no-account guest links) and
  `mROOM_voice_join`.
- **mIRC edge transport:** `mIRC_mint_channel_token`, `mIRC_send_edge`,
  `mIRC_history_edge` — the low-latency path the agent-coordination skill rides.

### Changed
- README, `package.json`, and the plugin `marketplace.json` reconciled to the
  current surface: **70 tools across 6 modules** + `comms_capabilities`
  discovery (71 callable), version `alpha.16`, and `mosadd.dev` → `mosadd.com`
  (the dev surface was consolidated into the main site). ([LINEAR-3391])
- `mCALL` (telephony, carrier-pending) and `mURL` (brand/consumer surface)
  remain **unregistered** in `tools/index.ts` — an agent only ever discovers
  tools that actually work.

## [3.0.0-alpha.4]

### Added
- Initial public alpha: **61 tools across 6 live modules** — mDM (incl. voice),
  mIRC, mROOM, mAIL, mTALK, mRAG — plus the `comms_capabilities` discovery tool.
- BYOK mode: the server talks to your own mosadd Supabase backend via
  `MOSADD_SUPABASE_URL` / `MOSADD_SUPABASE_ANON_KEY` / `MOSADD_USER_JWT`.
- Apache-2.0 license; tool names follow [RFC 0001] (`m<MODULE>_<operation>`).

[3.0.0-alpha.16]: https://github.com/Hei33enberg/mosadd-os/tree/main/packages/mcp
[3.0.0-alpha.4]: https://github.com/Hei33enberg/mosadd-os/tree/main/packages/mcp
[LINEAR-2917]: https://linear.app/ip-ra/issue/LINEAR-2917
[LINEAR-3391]: https://linear.app/ip-ra/issue/LINEAR-3391
[RFC 0001]: https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md
