# Distribution — prepared entries, not submitted

Everything here is ready to hand to a registry or directory. **Nothing has been submitted.** Submitting is
general@'s decision; several places need a login or an account that does not exist yet.

| Target | File | How it gets there | Blocked by |
|---|---|---|---|
| Official MCP registry | [`server.json`](./server.json) (`dev.mosadd/m0s`, remote `https://mcp.mosadd.dev/mcp`) | `mcp-publisher login http --domain mosadd.dev …` then `mcp-publisher publish` | the domain-verification file `/.well-known/mcp-registry-auth` on `mosadd.dev` (the apex answers 308 today) and the publisher key that signs it |
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
