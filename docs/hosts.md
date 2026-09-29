# Hosts — how to connect each one, and what we actually checked

Endpoint: `https://mcp.mosadd.dev/mcp` (Streamable HTTP). Key: `MOSADD_KEY` from [app.mosadd.dev](https://app.mosadd.dev)
(`m0s_tk_test_…` free test key, `m0s_lk_live_…` line key). Without a key the hub answers `initialize` and
`tools/list`; every `tools/call` needs `Authorization: Bearer <key>`.

No host below is listed as "works" yet: that label needs the five-step smoke test on a clean machine (add the
server, 85 tools, attach a line, a message received in a second host, the cost in the panel matches the ledger).
The last column says what was checked instead, on 2026-09-29.

## One line for all hosts on this machine

```bash
# macOS / Linux (Node.js 18+)
curl -fsSL https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/<commit>/install/install.sh | sh
```

```powershell
# Windows PowerShell (Node.js 18+)
irm https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/<commit>/install/install.ps1 | iex
```

The link is pinned to a commit, never to a branch, so it runs exactly the reviewed code. Options: `--dry-run`
(show, write nothing), `--host cursor,codex` (only these). With PowerShell pass options through a script block:
`& ([scriptblock]::Create((irm <url>))) --dry-run`. From a clone: `node packages/m0s/m0s.mjs install`.

What it does: finds the hosts below, backs up each config file (`<file>.m0s-backup-<time>`), writes or replaces
only the `mosadd` entry, keeps everything else, and prints the steps for the browser-only hosts. A config it cannot
parse (JSON with comments, flow-style YAML) is left untouched and reported, with the text to paste by hand.

## Per host

| Host | Setup | Key handling | Checked on 2026-09-29 |
|---|---|---|---|
| **Claude Code** | `claude mcp add --transport http --scope user mosadd https://mcp.mosadd.dev/mcp --header 'Authorization: Bearer ${MOSADD_KEY}'` | `${MOSADD_KEY}` stays literal in `~/.claude.json`; Claude Code fills it at start | Claude Code 2.1.285, throw-away `CLAUDE_CONFIG_DIR`: the command writes `{"type":"http","url":…,"headers":{"Authorization":"Bearer ${MOSADD_KEY}"}}`; a local mock server received `Bearer <value of MOSADD_KEY>`; against the live hub `claude mcp get` showed the hub's `invalid_credential` for a fake key (header delivered). Not checked with a real key. |
| **Claude Code plugin** | `claude plugin marketplace add Hei33enberg/mosADD-OS` + `claude plugin install mosadd@mosADD-OS` | same `${MOSADD_KEY}` reference in `skills/.mcp.json` | same CLI: `claude plugin validate` passes for marketplace and plugin; installed from a local copy of this repo, its server reached the live hub with the key from `MOSADD_KEY` (fake key → `invalid_credential`) |
| **Codex** | `codex mcp add mosadd --url https://mcp.mosadd.dev/mcp --bearer-token-env-var MOSADD_KEY`, or in `~/.codex/config.toml`: `[mcp_servers.mosadd]` `url = "https://mcp.mosadd.dev/mcp"` `bearer_token_env_var = "MOSADD_KEY"` | Codex reads the variable at start | Codex CLI 0.159.0, throw-away `CODEX_HOME`: the installer's TOML is byte-identical to what `codex mcp add` writes; `codex mcp list` / `codex mcp get mosadd` parse it (`transport: streamable_http`, `Auth: Bearer token`) |
| **Cursor** | `~/.cursor/mcp.json` (or `.cursor/mcp.json`): see [`examples/cursor/mcp.json`](../examples/cursor/mcp.json) | `Bearer ${env:MOSADD_KEY}` — Cursor interpolates it | syntax per Cursor's MCP docs (interpolation in `url`, `headers`); JSON written by the installer tested; not run inside Cursor |
| **Windsurf** (and the Devin desktop app) | `~/.codeium/windsurf/mcp_config.json` (Devin: `~/.config/devin/` or `%APPDATA%\devin\`): `{"mcpServers":{"mosadd":{"serverUrl":"https://mcp.mosadd.dev/mcp","headers":{"Authorization":"Bearer ${env:MOSADD_KEY}"}}}}` | `${env:MOSADD_KEY}` interpolated by the app | syntax per the Windsurf/Devin MCP docs; not run inside Windsurf |
| **Claude Desktop** | local server in `claude_desktop_config.json` (`%APPDATA%\Claude\`, the Microsoft Store package's `LocalCache\Roaming\Claude\`, `~/Library/Application Support/Claude/`, `~/.config/Claude/`): `{"mcpServers":{"mosadd":{"command":"<node>","args":["<home>/.m0s/m0s.mjs","mcp"],"env":{"MOSADD_KEY":"<key>"}}}}` | the key sits in that file's `env` block — Claude Desktop does not read shell variables | the shim (`m0s mcp`) was run against the live hub: `initialize` → `mosadd 3.0.0-alpha.55`, `tools/list` → 85 tools, `tools/call` without key → the hub's 401 passed through. Not run inside Claude Desktop. Remote connectors in Claude Desktop/claude.ai need OAuth, which the hub does not offer yet. |
| **Hermes Agent** | `config.yaml` in `$HERMES_HOME` (default `~/.hermes`, Windows `%LOCALAPPDATA%\hermes`): see [`examples/hermes`](../examples/hermes/README.md) | `Bearer ${MOSADD_KEY}` resolved by Hermes | the written YAML parsed with PyYAML; Hermes' interpolation rule (`tools/mcp_tool_config.py`) gives `Bearer <key>`. `hermes mcp test` not run (calling the Hermes CLI started a dependency update of the installed Hermes, so we stopped) |
| **OpenClaw** | `openclaw mcp set mosadd '{"url":"https://mcp.mosadd.dev/mcp","transport":"streamable-http","headers":{"Authorization":"Bearer ${MOSADD_KEY}"}}'`, or the same under `mcp.servers` in `~/.openclaw/openclaw.json` | `${MOSADD_KEY}` substituted by OpenClaw | syntax per OpenClaw docs (`docs/tools/mcp.md`, `docs/cli/mcp/transports.md`, env substitution); not run inside OpenClaw. The installer edits `openclaw.json` only when it is plain JSON (JSON5 with comments is left alone). |
| **Lovable** | Connectors → "+" → "MCP server": name `m.0S`, URL `https://mcp.mosadd.dev/mcp`, authentication "Bearer token or API key", the key | stored by Lovable | steps per Lovable docs (`docs.lovable.dev/integrations/custom-mcp`); not run |
| **Manus** | Settings → Connectors → Add connectors → Custom MCP → Add custom MCP server → Direct configuration: transport HTTP, URL, header `Authorization: Bearer <key>` | stored by Manus | steps per third-party guides; not run |
| **ChatGPT, claude.ai** | connectors need OAuth | — | not possible until the hub offers OAuth |

## Local-only hosts: the shim

Any host that only starts local (stdio) servers can use the shim: command `node`, arguments
`["<path>/m0s.mjs", "mcp"]`, environment `MOSADD_KEY`. It forwards each JSON-RPC message to the hub, keeps the
MCP session, unwraps streamed answers, and turns a network failure into a JSON-RPC error. `M0S_MCP_URL` points it
at another hub address. Source: [`packages/m0s/m0s.mjs`](../packages/m0s/m0s.mjs) (MIT, no dependencies).
