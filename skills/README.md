# Skills

Agent skills for m.0S in the [agentskills.io](https://agentskills.io/specification) format: one directory per
skill, a `SKILL.md` whose frontmatter `name` equals the directory name. The same files work as a Claude Code
plugin, in Hermes Agent, in OpenClaw and in any host that reads agent skills. MIT.

The skills teach the model when to use which tool; the tools themselves come from the m.0S MCP endpoint
(`https://mcp.mosadd.dev/mcp`, key in `MOSADD_KEY`).

| Skill | What it does |
|---|---|
| [`m0s-quickstart`](m0s-quickstart/SKILL.md) | connect the host, get and check the key, first message |
| [`m0s-line`](m0s-line/SKILL.md) | lines: which line am I, attach a session, a second agent, hand a line over |
| [`mosadd-mdm`](mosadd-mdm/SKILL.md) | 1:1 messages, several threads per contact |
| [`mosadd-mirc`](mosadd-mirc/SKILL.md) | persistent channels, members, roles |
| [`mosadd-murl`](mosadd-murl/SKILL.md) | open rooms attached to a web domain, public by design |
| [`mosadd-mail`](mosadd-mail/SKILL.md) | mail (mAYL) |
| [`mosadd-mtalk`](mosadd-mtalk/SKILL.md) | push-to-talk rooms |
| [`mosadd-mrag`](mosadd-mrag/SKILL.md) | recall over the user's own messages, mail and calls |
| [`mosadd-coordinate`](mosadd-coordinate/SKILL.md) | several agents on one project share one channel |

`mosadd-coordinate/SKILL.md` is canonical and vendored byte-identical into the `mosadd-agent` repository
(`skills/mosadd-coordinate/SKILL.md` there); it is not in the Claude Code bundle.

## Install

- **Claude Code** (plugin: all skills except coordinate, plus the MCP endpoint with `Authorization: Bearer ${MOSADD_KEY}`):
  ```bash
  claude plugin marketplace add Hei33enberg/mosADD-OS
  claude plugin install mosadd@mosADD-OS
  ```
  Checked 2026-09-29 with Claude Code 2.1.285 (throw-away config): `claude plugin validate` passes for the
  marketplace and the plugin, the plugin installs, and its MCP entry sends the key from `MOSADD_KEY` to the hub.

  **Upgrading from the mosadd.com plugin.** Until 2026-09-29 the plugin started the local `@mosadd/mcp` server (npm tag alpha) with your
  `mosadd login` session. It now connects to `https://mcp.mosadd.dev/mcp` and needs `MOSADD_KEY` (a key from
  [app.mosadd.dev](https://app.mosadd.dev)); without it every tool call answers 401. To keep using a mosadd.com
  session instead, register the local server yourself: `claude mcp add mosadd-com -- npx -y @mosadd/mcp@3.0.0-alpha.55`
  ([packages/mcp/README.md](../packages/mcp/README.md)).
- **Hermes, OpenClaw, other agentskills hosts:** copy the skill directory into the host's skills directory.
- **ClawHub:** a prepared entry is in [`distribution/clawhub/`](../distribution/clawhub/) (not published yet).

`node scripts/check-skill-lint.mjs` checks the frontmatter rules, the plugin manifest and the version.
