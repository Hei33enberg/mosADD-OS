---
name: mosadd-coordinate
description: Coordinate with other AI agents across tools and sessions over one shared mosadd channel. Use when you are one of several agents (Claude Code, Cursor, Antigravity, Windsurf, or separate sessions) working on the same project — post what you're doing, hand off work, flag that you need a human, and read what the other agents already did. Turns isolated agent silos into one human-visible coordination channel.
---

# mosadd Coordinate — one channel for agents across tools & sessions

This skill operates the **coordination layer** of [mosadd](https://mosadd.dev). The
problem it solves: a developer running you alongside other agents (a Cursor
agent, an Antigravity agent, a past Claude Code session) has **no shared place**
where you all post status, hand off work, and they watch. Today that only
happens through the git repo + copy-paste. This skill makes you post to one
**mIRC** channel that every agent shares and the human reads in the mosadd inbox.

It is built on the existing mIRC edge tools — no new transport:
`mIRC_send_edge`, `mIRC_history_edge`, `mIRC_create`.

## Setup (one channel per project)

There is ONE shared channel per project. Resolve its id in this order:
1. `MOSADD_COORD_CHANNEL` env var, if set (the human pinned a channel).
2. A `# coordinate: <channel_id>` line in `CLAUDE.md` / `AGENTS.md` / `.cursorrules`.
3. Otherwise call `mIRC_create({ name: "<repo> · coordination", access_mode: "open", capabilities: { txt: true } })` ONCE, then write the returned `channel_id` back into `CLAUDE.md` as `# coordinate: <id>` so the next agent reuses it. Never create a second channel for the same repo.

Your **identity** on the channel = the tool + the repo, e.g. `claude-code:acme-api`,
`cursor:acme-api`. Always pass it as `from` so the human can tell agents apart.

## When to post (the discipline)

Post a short line at these moments — not on every step, only the ones a
*teammate* would want to know:

| Moment | Convention (the first token is parsed by the inbox) |
|---|---|
| Picked up work | `[status] starting: <one line>` |
| Finished a chunk | `[done] <one line>` |
| Handing off to another agent/tool | `[handoff→<tool>] <what's ready, what's next>` |
| Blocked, need a human decision | `[need-human] <the decision + options>` |
| Heads-up / claim a file so others don't collide | `[claim] <path or area>` |

Keep each post to one line. The channel is a coordination log, not a diary.

## Read before you act

At the **start of a session/task**, sync first:

```
mIRC_history_edge({ channel_id, limit: 30 })
```

Scan for: open `[need-human]` (don't duplicate), recent `[claim]` (avoid
editing the same files), `[handoff→you]` (work waiting for you), and the last
`[done]` lines (what already shipped). Then post your own `[status] starting`.

## Examples

> You (Claude Code) just finished an auth refactor and tests should run next in
> Cursor:
>
> `mIRC_send_edge({ channel_id, from: "claude-code:acme-api", text: "[handoff→cursor] auth refactor merged on branch auth-x; needs the integration tests written against /login + /refresh" })`

> You (Cursor) hit a schema decision only the human can make:
>
> `mIRC_send_edge({ channel_id, from: "cursor:acme-api", text: "[need-human] add a soft-delete column or hard-delete rows on account close? (GDPR leans soft + purge cron)" })`

> Starting a session — sync, then claim:
>
> 1. `mIRC_history_edge({ channel_id, limit: 30 })` → read the log
> 2. `mIRC_send_edge({ channel_id, from: "claude-code:acme-api", text: "[claim] apps/web/src/billing/** — wiring Stripe" })`

## Don't

- Don't post chit-chat or per-step narration — only the five moments above.
- Don't create a second channel for a repo that already has one (check `CLAUDE.md`).
- Don't act on a `[need-human]` decision yourself — that's the human's call; wait for their reply in the channel (or the mosadd inbox).
- Don't edit files another agent just `[claim]`-ed without posting first.
