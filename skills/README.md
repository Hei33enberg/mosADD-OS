# mosadd Skills bundle

This directory contains [Anthropic Skill](https://docs.anthropic.com/en/docs/agents/skills) files for Claude users. Each `SKILL.md` describes one mosadd OS module — Claude reads the frontmatter (`name`, `description`, optional `allowed-tools`) to know when to invoke the underlying MCP tools.

Skills are a Claude-only convenience layer on top of the [`@mosadd/mcp`](../packages/mcp) server. The MCP server is the authoritative artifact — Cursor, Cline, Windsurf, ChatGPT Apps, Lovable, Bolt, Goose, Manus, and custom agents all use it directly. Skills here are extra polish for the Claude Code workflow.

## Shipped

| Skill | Channel | What it does |
|---|---|---|
| [`mdm/SKILL.md`](mdm/SKILL.md) | mDM | Direct messages, multi-thread per contact |
| [`mroom/SKILL.md`](mroom/SKILL.md) | mROOM | Ephemeral rooms + no-account guest links (USP) |
| [`mirc/SKILL.md`](mirc/SKILL.md) | mIRC | Persistent Discord/Slack-style channels |
| [`mail/SKILL.md`](mail/SKILL.md) | mAIL | Email from `<userId>@mosadd.com` |
| [`mtalk/SKILL.md`](mtalk/SKILL.md) | mTALK | Push-to-talk voice rooms (half-duplex floor control) |
| [`mkb/SKILL.md`](mkb/SKILL.md) | mKB | RAG recall over the user's own messages/emails/calls |

## Plugin marketplace entry

The [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) bundles all four skills into a single Claude Code plugin installable with:

```bash
claude plugin install https://github.com/Hei33enberg/mosadd-os.git
```

The plugin pulls the `@mosadd/mcp` server alongside, so users get one install for both the runtime and the skill descriptions.

RFC required to add a new skill; see [docs/rfcs/0001-module-naming.md](../docs/rfcs/0001-module-naming.md) for the bar.

(Top-level `claude plugin install` is the legacy syntax; on current Claude Code use `/plugin marketplace add Hei33enberg/mosadd-os` then `/plugin install mosadd@mosadd-os`.)

RFC required to add a new skill; see [docs/rfcs/0001-module-naming.md](../docs/rfcs/0001-module-naming.md) for the bar.
