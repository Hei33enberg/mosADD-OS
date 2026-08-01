# mosadd Skills bundle

This directory contains [Anthropic Skill](https://docs.anthropic.com/en/docs/agents/skills) files for Claude users. Each `SKILL.md` describes one mosadd OS module — Claude reads the frontmatter (`name`, `description`, optional `allowed-tools`) to know when to invoke the underlying MCP tools.

Skills are a Claude-only convenience layer on top of the [`@mosadd/mcp`](../packages/mcp) server. The MCP server is the authoritative artifact — Cursor, Cline, Windsurf, ChatGPT Apps, Lovable, Bolt, Goose, Manus, and custom agents all use it directly. Skills here are extra polish for the Claude Code workflow.

## Shipped

| Skill | Channel | What it does |
|---|---|---|
| [`mdm/SKILL.md`](mdm/SKILL.md) | mDM | 1:1 direct messages, end-to-end encrypted by default (X3DH + Double Ratchet; operator cannot read content), multi-thread per contact |
| [`mirc/SKILL.md`](mirc/SKILL.md) | mIRC | Persistent Discord/Slack-style channels |
| [`murl/SKILL.md`](murl/SKILL.md) | mURL | Open-web rooms — live chat per domain/URL, agent-native, public by design |
| [`mail/SKILL.md`](mail/SKILL.md) | mAYL | Email 3.0 from `<userId>@mosadd.com` |
| [`mtalk/SKILL.md`](mtalk/SKILL.md) | mTALK | Push-to-talk voice rooms (half-duplex floor control) |
| [`mrag/SKILL.md`](mrag/SKILL.md) | mRAG | RAG recall over the user's own messages/emails/calls |

> The mURL skill was added per [RFC 0005](../docs/rfcs/0005-murl-skill.md) — new skills go through the same RFC path.

## Coordination skill (canonical source)

[`coordinate/SKILL.md`](coordinate/SKILL.md) is a cross-tool **workflow** skill (not a single
module) — it turns several agents working the same repo into one human-visible mIRC channel.
**This file is the single source of truth for the skill.** Runtime deployments that bundle it
(e.g. the `mosadd-agent` Hermes fork ships it as `skills/mosadd-coordinate`) must **vendor this
copy, not fork it** — keep them byte-identical. It is intentionally **not** in the plugin
marketplace bundle below (that bundle is one-skill-per-module); it is distributed with the agent
runtime instead.

## Plugin marketplace entry

This directory is the Claude Code **plugin** (manifest: [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json), MCP server: [`.mcp.json`](.mcp.json)). The repo-root [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json) is the **marketplace** that lists it. Install (verified against Claude Code 2.x):

```bash
claude plugin marketplace add Hei33enberg/mosADD-OS
claude plugin install mosadd@mosADD-OS
```

(Or the same two commands as `/plugin marketplace add …` + `/plugin install …` from inside a Claude Code session. The marketplace name is case-sensitive: `mosADD-OS`.)

This installs the six module/capability skills above **and** registers the `@mosadd/mcp` server (`npx -y @mosadd/mcp@alpha`, which inherits your environment — set your auth env vars as described in the [root README](../README.md#quickstart-60-seconds)).

RFC required to add a new skill; see [docs/rfcs/0001-module-naming.md](../docs/rfcs/0001-module-naming.md) for the bar.
