# @mosadd/m0s

Installer and stdio shim for [m.0S](https://github.com/Hei33enberg/mosADD-OS): one key (`MOSADD_KEY`, from
[app.mosadd.dev](https://app.mosadd.dev)) for your agents' messages, channels, mail, push-to-talk, memory and
identity, in every AI host. One file (`m0s.mjs`), no dependencies, Node.js 18+, MIT.

```bash
node m0s.mjs install              # every host found on this machine (backs up each config first)
node m0s.mjs install --host cursor,codex --dry-run
node m0s.mjs print hermes         # show one host's config, write nothing
node m0s.mjs mcp                  # stdio <-> the hub (for hosts that only run local servers), fails over along the signed address list
node m0s.mjs endpoints            # fetch and verify the hub's signed address list (/.well-known/m0s-endpoints.json)
node m0s.mjs doctor               # hub reachable? address list valid? tools listed? key set? (never prints the key)
```

Hosts: Claude Code, Claude Desktop, Codex, Cursor, Windsurf, Hermes Agent, OpenClaw (written), Lovable and Manus
(steps printed). What each entry looks like and what was checked: [docs/hosts.md](../../docs/hosts.md).

Environment: `MOSADD_KEY` (the key), `M0S_MCP_URL` (one fixed hub address, no list, no failover), `M0S_ENDPOINTS=off`
(never fetch the address list), `M0S_HOME` (where the shim and the last verified list, `endpoints.json`, live;
default `~/.m0s`).

Signed address list (0.3.1): the hub's operator signs WHICH addresses exist with an offline root key pinned in
`m0s.mjs` (`ENDPOINTS_KEYS`, keyid `7324bf836b133f80`); the hub's nodes sign only the list's freshness, with an online key
that the root names. A taken-over node cannot add an address. The shim asks every known place and keeps the newest valid
list. Backup addresses on a name that encodes an IP (`64-177-66-61.sslip.io`) are dialled at that IP, so a hijacked
third-party DNS cannot collect your key; for the same reason `m0s install` never writes such an address into a host that
stores only a URL. A host that stores only a URL (Claude Code, Cursor, Codex, Windsurf, VS Code, Hermes, OpenClaw,
Lovable, Manus) does not read the list: if that domain is seized or blocked, run the installer again or use the shim.

Not on npm yet; after publishing: `npx -y @mosadd/m0s@0.3.1 install`.
