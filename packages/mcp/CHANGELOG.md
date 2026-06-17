# Changelog

All notable changes to `@mosadd/mcp` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows the `3.0.0-alpha.N` pre-release line until the hosted
gateway (Phase 2) ships.

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
