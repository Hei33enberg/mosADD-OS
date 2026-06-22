# Official MCP Registry — publish flow (current, 2026-06-22)

**Target:** https://registry.modelcontextprotocol.io
**Status:** preview, API v0.1 frozen since 2025-10-24 (stable for integrators).

⚠️ **THE OLD PR-TO-`servers/` MODEL IS GONE.** The official registry is now an
**API service** at `registry.modelcontextprotocol.io`, published to via the
`mcp-publisher` CLI tool with GitHub-based ownership verification.

## What's already prepared in the repo (autonomous, 2026-06-22)

- `packages/mcp/package.json` has `"mcpName": "io.github.hei33enberg/mosadd-mcp"`
  (this is the registry server name; it MUST start with `io.github.<github-username>/`
  because we'll auth via GitHub).
- `packages/mcp/server.json` — the registry manifest, schema 2025-12-11, points at
  npm `@mosadd/mcp@alpha.20`, stdio transport, requires env `MOSADD_API_KEY`.
- GitHub repo `Hei33enberg/mosADD-OS` description + 13 topics added 2026-06-22
  (helps Glama / Smithery auto-index even before this submission lands).

## OWNER STEPS (one-time, ~10 min) — needs GitHub OAuth + npm creds

### 1. Republish to npm so the registry can verify ownership

The registry's verifier reads `mcpName` from the **published** package's npmjs.com
metadata, not from the repo. alpha.20 was built before we added `mcpName` → republish.

```bash
cd C:\mosadd-os\packages\mcp
npm version 3.0.0-alpha.21
# also bump server.json: "version" and packages[0].version to 3.0.0-alpha.21
npm run build
npm publish --access public --tag alpha
```

### 2. Install `mcp-publisher` CLI

```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
rm mcp-publisher.tar.gz
# move mcp-publisher.exe to somewhere on PATH
```

### 3. Authenticate as Hei33enberg

```bash
mcp-publisher login github
# follow the device-code link, authorize as Hei33enberg
```

### 4. Publish

```bash
cd C:\mosadd-os\packages\mcp
mcp-publisher publish
```

Expected:

```
Publishing to https://registry.modelcontextprotocol.io...
✓ Successfully published
✓ Server io.github.hei33enberg/mosadd-mcp version 3.0.0-alpha.21
```

### 5. Verify

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=mosadd-mcp"
```

Once it appears, Glama / mcp.so / Smithery / mcpservers.org pick it up
automatically over the next few hours (they all auto-index from the official
registry + GitHub).

## Troubleshooting

| Error | Fix |
|---|---|
| `Registry validation failed for package` | `mcpName` not yet in the **published** package — re-run Step 1. |
| `Invalid or expired Registry JWT token` | `mcp-publisher login github` again. |
| `You do not have permission to publish this server` | `mcpName` must start `io.github.hei33enberg/` (matches GitHub auth). |

## Follow-up (after Step 5 lands)

- Check Glama / mcp.so / Smithery / mcpservers.org ~24 h later; if missing, fall
  back to their manual submission forms (per-registry drafts in this folder).
- Add `mcp-publisher publish` to a GitHub Actions workflow so future alpha bumps
  auto-publish — see `docs/modelcontextprotocol-io/github-actions.md` upstream.
