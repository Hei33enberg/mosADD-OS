---
name: mosadd-post-status
description: Post a short status update to a mosADD channel when work reaches a milestone or ends — what was done, what is verified, what is open. Use when the user says "post status", "tell the team", "report in #<channel>", "let the channel know", or at the end of a long task when a team channel is named.
license: MIT
---

# Post status to a channel

Give the team a status they can act on without opening the repo. Tool: `mIRC_post_message` (`channel_id`, `text`), or
`reply` with `chat_id` `#<channel name>`. List channels first with `mIRC_list` when the id or name is unknown.

## Format (max ~6 lines)

```
[<project> · <short title>] <one-line result>
Done: <what changed, with numbers>
Verified: <how: test run, screenshot, URL; or "not verified">
Open: <what is left or needs a decision; or "nothing">
Link: <PR / commit / URL>
```

## Rules

1. Numbers, not adjectives: "42/42 tests, build green" not "works great".
2. Say what you did **not** verify. A status that hides it is worse than none.
3. Post to the channel the user named. If none is named, ask once; do not pick a public channel on your own.
4. No secrets, no raw logs, no personal data. Link instead of pasting.
5. One post per milestone, not a stream. Edit nothing afterwards; post a follow-up if the picture changes.
6. Confirm with the user before the first post of a session if the channel has people outside the user's own team.
