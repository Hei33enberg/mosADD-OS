# Distribution — prepared entries, not submitted

Everything in the table below is ready to hand to a registry or directory. **None of it has been submitted.**
Submitting is general@'s decision; several places need a login or an account that does not exist yet.

## Already live: `com.mosadd/mosadd-mcp` in the official MCP registry

The one entry that IS published (since 2026-09-03) is the older card
[`packages/mcp/server.registry.json`](../packages/mcp/server.registry.json), remote `https://mcp.mosadd.com/mcp`.

- 2026-09-30 10:38:03Z: `3.0.0-alpha.55` published, now `isLatest`. The description no longer claims encryption or
  privacy that agent traffic does not have (agent lines and mRAG are readable by the service; see the README,
  "Encryption, plainly"). `3.0.0-alpha.45`, the version that did, is `deprecated` with a status message.
- Publishing needs no binary and no browser: `node scripts/mcp-registry.mjs publish packages/mcp/server.registry.json
  --key <key.pem> --domain mosadd.com --method dns`. The domain proof is a TXT record at the apex of `mosadd.com`
  (`v=MCPv1; k=ed25519; p=…`, Vercel DNS); the private key is kept outside git on the publishing machine
  (`~/.sekrety/MCP-REGISTRY/mosadd-com-ed25519.pem`). The script signs the registry's clock when the local one
  is more than 2 s off (the registry refuses signatures outside ±15 s).
- Check: `curl "https://registry.modelcontextprotocol.io/v0/servers/com.mosadd%2Fmosadd-mcp/versions"` (the
  `?search=` listing is cached by the registry and can lag a few minutes).

## Prepared, not submitted

| Target | File | How it gets there | Blocked by |
|---|---|---|---|
| Official MCP registry | [`server.json`](./server.json) (`dev.mosadd/m0s`, remote `https://mcp.mosadd.dev/mcp`) | `node scripts/mcp-registry.mjs publish distribution/server.json --key … --domain mosadd.dev --method dns` | the decision (not submitted before the product is ready, 2026-09-30); technically only a TXT proof record at the `mosadd.dev` apex |
| Smithery | [`smithery/smithery.yaml`](./smithery/smithery.yaml) | copy to the repo root, then publish from smithery.ai (or register the URL `https://mcp.mosadd.dev/mcp` as an external server) | a Smithery login |
| Glama | [`glama/glama.json`](./glama/glama.json) + [`glama/README.md`](./glama/README.md) | copy `glama.json` to the repo root, then "claim" the server on glama.ai | a Glama login |
| PulseMCP | [`pulsemcp.md`](./pulsemcp.md) | submission form on pulsemcp.com | submissions were paused (last checked 2026-09-03) |
| mcp.so | [`mcp-so.md`](./mcp-so.md) | a GitHub issue in the mcp.so submission repository | — (GitHub account exists) |
| awesome-mcp-servers | [`awesome-mcp-servers.md`](./awesome-mcp-servers.md) | pull request from `Hei33enberg` | — |
| awesome-remote-mcp-servers | [`awesome-mcp-servers.md`](./awesome-mcp-servers.md) | pull request | its maintainers ask for a Glama listing first |
| ClawHub (OpenClaw skills) | [`clawhub/m0s/SKILL.md`](./clawhub/m0s/SKILL.md) + [`clawhub/README.md`](./clawhub/README.md) | `clawhub publish` | a ClawHub login (GitHub OAuth) |

Rules for every entry (from `SPEC-DYSTRYBUCJA`): one version everywhere (`3.0.0-alpha.55`, what the hub reports);
no self-host claim; no "works in" list before a host passes the smoke test; no end-to-end-encryption claim for
agent traffic. `node scripts/check-skill-lint.mjs` and the `packages/m0s` tests check the files here.

Validated on 2026-09-29: `server.json` against the official schema
(`https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`, ajv 8) — valid.
