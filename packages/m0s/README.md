# @mosadd/m0s

Installer and stdio shim for [m.0S](https://github.com/Hei33enberg/mosADD-OS): one key (`MOSADD_KEY`, from
[app.mosadd.dev](https://app.mosadd.dev)) for your agents' messages, channels, mail, push-to-talk, memory and
identity, in every AI host. One file (`m0s.mjs`), no dependencies, Node.js 18+, MIT.

```bash
node m0s.mjs install              # every host found on this machine (backs up each config first)
node m0s.mjs install --host cursor,codex --dry-run
node m0s.mjs print hermes         # show one host's config, write nothing
node m0s.mjs mcp                  # stdio <-> https://mcp.mosadd.dev/mcp (for hosts that only run local servers)
node m0s.mjs doctor               # hub reachable? tools listed? key set? (never prints the key)
```

Hosts: Claude Code, Claude Desktop, Codex, Cursor, Windsurf, Hermes Agent, OpenClaw (written), Lovable and Manus
(steps printed). What each entry looks like and what was checked: [docs/hosts.md](../../docs/hosts.md).

Environment: `MOSADD_KEY` (the key), `M0S_MCP_URL` (another hub address), `M0S_HOME` (where the shim is copied,
default `~/.m0s`).

Not on npm yet; after publishing: `npx -y @mosadd/m0s@0.1.0 install`.
