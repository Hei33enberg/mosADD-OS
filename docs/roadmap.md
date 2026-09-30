# Roadmap

What is live is measured; what is planned is marked planned. Dates are targets, not promises.

## Live (measured 2026-09-29; the endpoint, panel and price list re-checked 2026-09-30)

- Hosted endpoint `https://mcp.mosadd.dev/mcp` (Streamable HTTP): `initialize` and `tools/list` without a key,
  `tools/call` behind a line key (401 without one). The tool list is the live `tools/list`; the names and the
  count at the time of measuring are in [distribution/hub-tools.json](../distribution/hub-tools.json). SMS through
  your own Telnyx or Twilio account is available (`sms_send`). Primary node in Tel Aviv with a streaming replica
  in Mumbai (`/health`).
- Panel `https://app.mosadd.dev`: sign-up and log-in with e-mail and password (a passkey is optional, in Settings),
  lines, keys, usage.
- Public price list `GET https://api.mosadd.dev/v1/pricing` (no key); `PRICING.md` is generated from it.
- `@mosadd/mcp` `3.0.0-alpha.55` — the tool definitions the hub serves.
- `packages/m0s`: installer and stdio shim (this repository, not yet on npm).
- Signed list of hub addresses `/.well-known/m0s-endpoints.json` (Ed25519; addresses signed with an offline root key
  pinned in `packages/m0s` 0.3.1, freshness with the hub's online key), measured 2026-09-30 on `api.mosadd.dev` and
  `mcp.mosadd.dev`. The shim and the installer verify it and the shim fails over along it, dialling the nodes'
  direct names at the IP the list gives. It holds the hub's names and the two nodes' direct names; no second domain
  yet. Hosts that keep only a URL do not read it.
- Skills in the agentskills.io format and a Claude Code plugin (`skills/`).

## Next

- Phone calls through your own Telnyx or Twilio account: coming soon. The price list marks them `soon` and their
  tools, `call_start` and `call_status`, are held back until calls open.
- OAuth on the hub, so hosts that only accept OAuth connectors (claude.ai, Claude Desktop connectors, ChatGPT)
  can connect without the shim.
- A second domain on another TLD and registrar in the signed address list (a purchase, not decided yet).
- Smoke test of every host in [docs/hosts.md](./hosts.md) on a clean machine; only tested hosts get listed as
  working.
- `@mosadd/m0s` and a new `@mosadd/mcp` on npm with one version everywhere.
- Registry entries from [`distribution/`](../distribution/).

## Not planned

- No self-hosted version of the service. The client is MIT; the service is not in this repository.
- Price plans. Prepaid only.
