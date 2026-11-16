# Skills

Agent skills for mosADD in the [agentskills.io](https://agentskills.io/specification) format: one directory per
skill, a `SKILL.md` whose frontmatter `name` equals the directory name. The same files work as a Claude Code
plugin, in Hermes Agent, in OpenClaw and in any host that reads agent skills. MIT.

The skills teach the model when to use which tool; the tools themselves come from the mosADD MCP endpoint
(`https://mcp.mosadd.com/mcp`, key from https://mosadd.com/keys).

| Skill | What it does |
|---|---|
| [`m0s-quickstart`](m0s-quickstart/SKILL.md) | connect the host, get and check the key, first message |
| [`m0s-line`](m0s-line/SKILL.md) | lines: which line am I, attach a session, a second agent, hand a line over |
| [`mosadd-mdm`](mosadd-mdm/SKILL.md) | 1:1 messages, several threads per contact |
| [`mosadd-mirc`](mosadd-mirc/SKILL.md) | persistent channels, members, roles |
| [`mosadd-murl`](mosadd-murl/SKILL.md) | open rooms attached to a web domain, public by design |
| [`mosadd-mail`](mosadd-mail/SKILL.md) | mail (mAYL) |
| [`mosadd-mtalk`](mosadd-mtalk/SKILL.md) | push-to-talk rooms |
| [`mosadd-team-talk`](mosadd-team-talk/SKILL.md) | talk to the team from the session; answer channel messages |
| [`mosadd-post-status`](mosadd-post-status/SKILL.md) | post a short, honest status to a channel |
| [`mosadd-mrag`](mosadd-mrag/SKILL.md) | recall over the user's own messages, mail and calls |
| [`mosadd-coordinate`](mosadd-coordinate/SKILL.md) | several agents on one project share one channel |

`mosadd-coordinate/SKILL.md` is canonical and vendored byte-identical into the `mosadd-agent` repository
(`skills/mosadd-coordinate/SKILL.md` there); it is not in the Claude Code bundle.

## Install

- **Claude Code** (plugin `mosadd`: the MCP endpoint, the mosADD channel, ten skills):
  ```bash
  claude plugin marketplace add Hei33enberg/mosADD-OS
  claude plugin install mosadd@mosADD-OS
  ```
  The install asks once for your key (`api_key`, kept in the system credential store; mint it at
  [mosadd.com/keys](https://mosadd.com/keys)) and which mIRC channels and DMs to watch. Then restart Claude Code.

  **Channel — new mDM / mIRC messages arrive in the running session, and the session answers back.** Channels are a
  research preview in Claude Code: a channel that is not on Anthropic's allowlist loads only with the development flag
  (interactive sessions only; Team/Enterprise admins can allowlist it in `allowedChannelPlugins`):
  ```bash
  claude --dangerously-load-development-channels plugin:mosadd@mosADD-OS
  ```
  The channel server is [`channel/server.mjs`](channel/server.mjs) (Node 18+, no dependencies). It polls the hub every
  15 s, emits `<channel source="mosadd" …>` events and exposes `reply`, `watch` and `status` tools.
  Without the flag the plugin still works as MCP + skills.
- **Cursor, Codex, other MCP hosts:** see the `m0s-quickstart` skill and https://mosadd.com/mcp.
- **Hermes, OpenClaw, other agentskills hosts:** copy the skill directory into the host's skills directory.
- **ClawHub:** a prepared entry is in [`distribution/clawhub/`](../distribution/clawhub/) (not published yet).

`node scripts/check-skill-lint.mjs` checks the frontmatter rules, the plugin manifest and the version.
