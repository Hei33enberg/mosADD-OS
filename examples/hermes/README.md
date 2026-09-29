# Hermes Agent

[Hermes Agent](https://github.com/NousResearch/hermes-agent) (MIT, Nous Research) reads remote MCP servers from
`config.yaml` in its home directory (`$HERMES_HOME`, default `~/.hermes`, on Windows `%LOCALAPPDATA%\hermes`).

1. Put your key in the environment Hermes starts with (`MOSADD_KEY`, from [app.mosadd.dev](https://app.mosadd.dev)).
2. Add under `mcp_servers:`

```yaml
mcp_servers:
  mosadd:
    url: "https://mcp.mosadd.dev/mcp"
    headers:
      Authorization: "Bearer ${MOSADD_KEY}"
```

Hermes replaces `${MOSADD_KEY}` (and the Cursor-style `${env:MOSADD_KEY}`) from its environment when it loads the
server. The installer writes this block and keeps the rest of the file:
`node packages/m0s/m0s.mjs install --host hermes`.

3. `hermes mcp test mosadd`.

Checked on 2026-09-29: the block parses with PyYAML and Hermes' interpolation rule
(`tools/mcp_tool_config.py`, `_interpolate_env_vars`) turns it into `Bearer <key>`. `hermes mcp test` was not run
in that check.

## Coordination skill

With several agents on one project, the [`mosadd-coordinate`](../../skills/mosadd-coordinate/SKILL.md) skill gives
them one shared channel. Hermes reads skills in the agentskills.io format from its skills directory.
