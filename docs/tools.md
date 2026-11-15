# Tools — the package list and the endpoint list

Two lists, and they are not the same:

- **`@mosadd/mcp`** defines the tools of every mosADD module. Its total and the count per module are pinned by a
  test (`packages/mcp/src/__tests__/tool-count-consistency.test.ts`) and stated in the [README](../README.md#tools).
  One line per tool: [packages/mcp/README.md](../packages/mcp/README.md).
- **The hosted endpoint** `https://mcp.mosadd.com/mcp` serves every tool in `@mosadd/mcp` and tools of its own. Its
  list is whatever `tools/list` returns to you, and it changes without a release of this repository.

## Asking the endpoint

The endpoint answers only with a key (`Authorization: Bearer <key>`) or after MCP sign-in (OAuth): `initialize` and
`tools/list` included. Without either, every request gets HTTP 401 with a `WWW-Authenticate` header that points at
`/.well-known/oauth-protected-resource`.

## The snapshot this repository tests against

This repository keeps a dated snapshot of the endpoint's list for its own tests, [distribution/hub-tools.json](../distribution/hub-tools.json).
Beyond the package it names `sms_send` (SMS through your own Telnyx or Twilio account). Phone calls through your own
account are coming soon: `call_start` and `call_status` are held back until calls open (the price list marks them
`soon`). The live list has more tools of its own than the snapshot: agent lines, cables, vault and `master_check`.
`node scripts/check-hub-tools.mjs` compares the snapshot with the live list; it sends no key yet, so the endpoint
refuses it until it does.

## Irondome

`threat_catalog` and `threat_classify` classify events you hand them, offline, against the taxonomy in
[`@mosadd/threat-engine`](../packages/threat-engine). Irondome does not watch a network, and a taxonomy entry is not a
detector.
