# mosadd Skills bundle

This directory contains [Anthropic Skill](https://docs.anthropic.com/en/docs/agents/skills) files for Claude users. Each `SKILL.md` describes one mosadd OS module — Claude reads the frontmatter (`name`, `description`, optional `allowed-tools`) to know when to invoke the underlying MCP tools.

Skills are a Claude-only convenience layer on top of the [`@m0ssad/mcp`](../packages/mcp) server. The MCP server is the authoritative artifact — Cursor, Cline, Windsurf, ChatGPT Apps, Lovable, Bolt, Goose, Manus, and custom agents all use it directly. Skills here are extra polish for the Claude Code workflow.

## Shipped

| Skill | Channel | What it does |
|---|---|---|
| [`mdm/SKILL.md`](mdm/SKILL.md) | mDM | Direct messages, multi-thread per contact |
| [`mroom/SKILL.md`](mroom/SKILL.md) | mROOM | Ephemeral rooms + no-account guest links (USP) |
| [`mirc/SKILL.md`](mirc/SKILL.md) | mIRC | Persistent Discord/Slack-style channels |
| [`mail/SKILL.md`](mail/SKILL.md) | mAIL | Email from `<userId>@mosadd.com` |

## Plugin marketplace entry

The [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) bundles all four skills into a single Claude Code plugin installable with:

```bash
claude plugin install https://github.com/Hei33enberg/mosadd-os.git
```

The plugin pulls the `@m0ssad/mcp` server alongside, so users get one install for both the runtime and the skill descriptions.

## Coming next

- `mtalk/SKILL.md` (push-to-talk — depends on the WebRTC daemon design in [LINEAR-2145](https://linear.app/ip-ra/issue/LINEAR-2145))
- `mcall/SKILL.md` (PSTN — depends on Telnyx eKYC + [LINEAR-2172](https://linear.app/ip-ra/issue/LINEAR-2172))
- `mirl/SKILL.md` (live-stream after-party)
- Bridge skills: mMATRIX, mDISCORD, mTELEGRAM (Phase 1 P1 — [LINEAR-2168](https://linear.app/ip-ra/issue/LINEAR-2168))

RFC required to add a new skill; see [docs/rfcs/0001-module-naming.md](../docs/rfcs/0001-module-naming.md) for the bar.
