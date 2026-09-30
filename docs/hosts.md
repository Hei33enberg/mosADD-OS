# Hosts — how to connect each one, and what we actually checked

Endpoint: `https://mcp.mosadd.dev/mcp` (Streamable HTTP). Key: `MOSADD_KEY` from [app.mosadd.dev](https://app.mosadd.dev)
(`m0s_tk_test_…` free test key, `m0s_lk_live_…` line key). Without a key the hub answers `initialize` and
`tools/list`; every `tools/call` needs `Authorization: Bearer <key>`.

No host below is listed as "works" yet: that label needs the five-step smoke test on a clean machine (add the
server, 88 tools, attach a line, a message received in a second host, the cost in the panel matches the ledger).
The last column says what was checked instead, on 2026-09-29.

## One line for all hosts on this machine

```bash
# macOS / Linux (Node.js 18+)
curl -fsSL https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/63d067bd01291df14c43aef4e27bd8d5bdd8ac8f/install/install.sh | sh
```

```powershell
# Windows PowerShell (Node.js 18+)
irm https://raw.githubusercontent.com/Hei33enberg/mosADD-OS/63d067bd01291df14c43aef4e27bd8d5bdd8ac8f/install/install.ps1 | iex
```

The link is pinned to a commit, never to a branch, so it runs exactly the reviewed code. Options: `--dry-run`
(show, write nothing; the key appears only as `<value of MOSADD_KEY, hidden>`), `--host cursor,codex` (only these). With PowerShell pass options through a script block:
`& ([scriptblock]::Create((irm <url>))) --dry-run`. From a clone: `node packages/m0s/m0s.mjs install`.

What it does: finds the hosts below, backs up each config file (`<file>.m0s-backup-<time>`), writes or replaces
only the `mosadd` entry, keeps everything else, and prints the steps for the browser-only hosts. When a `mosadd`
entry already exists (for example one for the older `mcp.mosadd.com` endpoint or a local `npx @mosadd/mcp`), the
report says it was replaced and what it pointed at. Claude Code keeps its config itself, so for it the installer
saves the output of `claude mcp get mosadd` to `~/.m0s/backups/` before `claude mcp remove` + `claude mcp add`. A config it cannot
parse (JSON with comments, flow-style YAML) is left untouched and reported, with the text to paste by hand.

## Per host

| Host | Setup | Key handling | Checked on 2026-09-29 |
|---|---|---|---|
| **Claude Code** | `claude mcp add --transport http --scope user mosadd https://mcp.mosadd.dev/mcp --header 'Authorization: Bearer ${MOSADD_KEY}'` | `${MOSADD_KEY}` stays literal in `~/.claude.json`; Claude Code fills it at start | Claude Code 2.1.285, throw-away `CLAUDE_CONFIG_DIR`: the command writes `{"type":"http","url":…,"headers":{"Authorization":"Bearer ${MOSADD_KEY}"}}`; a local mock server received `Bearer <value of MOSADD_KEY>`; against the live hub `claude mcp get` showed the hub's `invalid_credential` for a fake key (header delivered). Not checked with a real key. |
| **Claude Code plugin** | `claude plugin marketplace add Hei33enberg/mosADD-OS` + `claude plugin install mosadd@mosADD-OS` | same `${MOSADD_KEY}` reference in `skills/.mcp.json` | same CLI: `claude plugin validate` passes for marketplace and plugin; installed from a local copy of this repo, its server reached the live hub with the key from `MOSADD_KEY` (fake key → `invalid_credential`) |
| **Codex** | `codex mcp add mosadd --url https://mcp.mosadd.dev/mcp --bearer-token-env-var MOSADD_KEY`, or in `~/.codex/config.toml`: `[mcp_servers.mosadd]` `url = "https://mcp.mosadd.dev/mcp"` `bearer_token_env_var = "MOSADD_KEY"` | Codex reads the variable at start | Codex CLI 0.159.0, throw-away `CODEX_HOME`: the installer's TOML is byte-identical to what `codex mcp add` writes; `codex mcp list` / `codex mcp get mosadd` parse it (`transport: streamable_http`, `Auth: Bearer token`) |
| **Cursor** | one click: [install link](cursor://anysphere.cursor-deeplink/mcp/install?name=mosadd&config=eyJ1cmwiOiJodHRwczovL21jcC5tb3NhZGQuZGV2L21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciAke2VudjpNT1NBRERfS0VZfSJ9fQ==) (its base64 `config` is the entry below), or `~/.cursor/mcp.json` (or `.cursor/mcp.json`): see [`examples/cursor/mcp.json`](../examples/cursor/mcp.json) | `Bearer ${env:MOSADD_KEY}` — Cursor interpolates it | syntax per Cursor's MCP docs (interpolation in `url`, `headers`); JSON written by the installer tested; not run inside Cursor |
| **VS Code** | one click: [install link](https://vscode.dev/redirect/mcp/install?name=mosadd&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22mosadd-key%22%2C%22description%22%3A%22m.0S%20key%3A%20m0s_lk_live_...%20or%20m0s_tk_test_...%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.mosadd.dev%2Fmcp%22%2C%22headers%22%3A%7B%22Authorization%22%3A%22Bearer%20%24%7Binput%3Amosadd-key%7D%22%7D%7D), or the user `mcp.json` ("MCP: Open User Configuration"; `%APPDATA%\Code\User\`, `~/Library/Application Support/Code/User/`, `~/.config/Code/User/`): `{"servers":{"mosadd":{"type":"http","url":"https://mcp.mosadd.dev/mcp","headers":{"Authorization":"Bearer ${input:mosadd-key}"}}},"inputs":[{"type":"promptString","id":"mosadd-key","password":true}]}` | `${input:mosadd-key}`: VS Code asks once and keeps the key in its secret storage, not in the file | format per VS Code's MCP configuration reference (`servers`, `type: http`, `headers`, `inputs` with `password`) and the install-link format of GitHub's own MCP server; the JSON written by the installer tested; not run inside VS Code |
| **Windsurf** (and the Devin desktop app) | `~/.codeium/windsurf/mcp_config.json` (Devin: `~/.config/devin/` or `%APPDATA%\devin\`): `{"mcpServers":{"mosadd":{"serverUrl":"https://mcp.mosadd.dev/mcp","headers":{"Authorization":"Bearer ${env:MOSADD_KEY}"}}}}` | `${env:MOSADD_KEY}` interpolated by the app | syntax per the Windsurf/Devin MCP docs; not run inside Windsurf |
| **Claude Desktop** | local server in `claude_desktop_config.json` (`%APPDATA%\Claude\`, the Microsoft Store package's `LocalCache\Roaming\Claude\`, `~/Library/Application Support/Claude/`, `~/.config/Claude/`): `{"mcpServers":{"mosadd":{"command":"<node>","args":["<home>/.m0s/m0s.mjs","mcp"],"env":{"MOSADD_KEY":"<key>"}}}}` | the key sits in that file's `env` block — Claude Desktop does not read shell variables | the shim (`m0s mcp`) was run against the live hub: `initialize` → `mosadd 3.0.0-alpha.55`, `tools/list` → 88 tools, `tools/call` without key → the hub's 401 passed through. Not run inside Claude Desktop. Remote connectors in Claude Desktop/claude.ai need OAuth, which the hub does not offer yet. |
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
