# The hosted service (m.0S hub) — what this repository can rely on

The service behind `mcp.mosadd.dev` is proprietary and lives in a private repository. This page lists only what a
client can observe from outside. It replaces the June 2026 design draft (price tiers, a separate dashboard domain,
run-it-yourself options), none of which shipped.

| Contract | Value | How to check |
|---|---|---|
| MCP endpoint | `https://mcp.mosadd.dev/mcp`, Streamable HTTP | `curl https://mcp.mosadd.dev/` |
| Without a key | `initialize` and `tools/list` answer; `tools/call` returns JSON-RPC error `-32001`, HTTP 401 | `node packages/m0s/m0s.mjs doctor` |
| Auth header | `Authorization: Bearer <key>` | |
| Key kinds | `m0s_lk_live_…` line key (IDE, `/mcp`) · `m0s_tk_test_…` test key · `m0s_sk_live_…` root key (management) · `m0s_ok_live_…` observation key | panel `app.mosadd.dev` |
| Health | `https://api.mosadd.dev/v1/health`, `https://mcp.mosadd.dev/health` | `curl` |
| OAuth | not offered yet (`/.well-known/oauth-protected-resource` → 404) | `curl` |
| Metering | every call is held before it runs and settled after it; an empty prepaid balance answers 402 | usage view in the panel |
| Prices | `GET https://api.mosadd.dev/v1/prices` — not public yet (404 on 2026-09-29) | [PRICING.md](../../PRICING.md) |

The older endpoint `https://mcp.mosadd.com/mcp` (gateway code in `apps/mcp-http`) keeps working for keys issued by
mosadd.com (`mosadd_sk_live_…`).
