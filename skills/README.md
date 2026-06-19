# mosadd Skills bundle

This directory contains [Anthropic Skill](https://docs.anthropic.com/en/docs/agents/skills) files for Claude users. Each `SKILL.md` describes one mosadd OS module — Claude reads the frontmatter (`name`, `description`, optional `allowed-tools`) to know when to invoke the underlying MCP tools.

Skills are a Claude-only convenience layer on top of the [`@mosadd/mcp`](../packages/mcp) server. The MCP server is the authoritative artifact — Cursor, Cline, Windsurf, ChatGPT Apps, Lovable, Bolt, Goose, Manus, and custom agents all use it directly. Skills here are extra polish for the Claude Code workflow.

## Shipped

| Skill | Channel | What it does |
|---|---|---|
| [`mdm/SKILL.md`](mdm/SKILL.md) | mDM | Direct messages, multi-thread per contact |
| [`mroom/SKILL.md`](mroom/SKILL.md) | mROOM | Ephemeral rooms + no-account guest links (USP) |
| [`mirc/SKILL.md`](mirc/SKILL.md) | mIRC | Persistent Discord/Slack-style channels |
| [`mail/SKILL.md`](mail/SKILL.md) | mp0st | Email from `<userId>@mosadd.com` |
| [`mtalk/SKILL.md`](mtalk/SKILL.md) | mTALK | Push-to-talk voice rooms (half-duplex floor control) |
| [`mrag/SKILL.md`](mrag/SKILL.md) | mRAG | RAG recall over the user's own messages/emails/calls |

## Coordination skill (canonical source)

[`coordinate/SKILL.md`](coordinate/SKILL.md) is a cross-tool **workflow** skill (not a single
module) — it turns several agents working the same repo into one human-visible mIRC channel.
**This file is the single source of truth for the skill.** Runtime deployments that bundle it
(e.g. the `mosadd-agent` Hermes fork ships it as `skills/mosadd-coordinate`) must **vendor this
copy, not fork it** — keep them byte-identical. It is intentionally **not** in the plugin
marketplace bundle below (that bundle is one-skill-per-module); it is distributed with the agent
runtime instead.

## Plugin marketplace entry

The [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) bundles all six module skills into a single Claude Code plugin installable with:

```bash
claude plugin install https://github.com/Hei33enberg/mosadd-os.git
```

The plugin pulls the `@mosadd/mcp` server alongside, so users get one install for both the runtime and the skill descriptions.

RFC required to add a new skill; see [docs/rfcs/0001-module-naming.md](../docs/rfcs/0001-module-naming.md) for the bar.

(Top-level `claude plugin install` is the legacy syntax; on current Claude Code use `/plugin marketplace add Hei33enberg/mosadd-os` then `/plugin install mosadd@mosadd-os`.)
