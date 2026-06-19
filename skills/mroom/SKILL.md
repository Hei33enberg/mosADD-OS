---
name: mosadd-mroom
description: Create ephemeral private rooms with no-account guest join links. Use when the user wants to spin up a temporary room for a meeting, customer support drop-in, anonymous tipline, or live-stream after-party. The killer feature is mROOM_create_guest_link — generates a short-lived URL anyone can use to enter without signing up for mosadd.
---

# mosadd Private Rooms (mROOM)

This skill operates the **mROOM** OS module of [mosadd](https://mosadd.com) — ephemeral rooms with TTL and no-account guest access.

## When to invoke

Trigger on these user intents:
- "Spin up a quick room for me and <X>" — `mROOM_create` + share `id`
- "Make a join link for <name>" / "Send <person> a link they can use without signing up" — `mROOM_create_guest_link` ★
- "Close that room" — `mROOM_close`
- "Who am I in rooms with?" — `mROOM_list`

## The USP — guest links

`mROOM_create_guest_link` is the differentiator. No other comms platform exposes this as a single agent call:

```
mROOM_create_guest_link({
  room_id: "<id from mROOM_create>",
  display_name: "Alice (Customer)",
  ttl_seconds: 3600,
})
→ {
  token: "<opaque>",
  join_url: "https://mosadd.com/r/<room_id>?t=<token>",
  expires_at: "2026-05-27T04:25:30Z",
}
```

The recipient opens `join_url` in any browser — no signup, no app install, no email verification. The token expires after `ttl_seconds`.

**Use cases the user will likely ask for:**
- Customer support: agent on chat needs voice with the customer → instant room + link in email
- Live-stream after-party: streamer drops link in chat → fans join the after-room
- Incident bridge: security team needs to pull in a vendor → 24h room + link via Slack
- Anonymous tipline: journalist publishes link → sources join without identifying

## How to operate

1. **Default to short TTL.** Unless the user says "for a week" or similar, use `ttl_seconds: 3600` (1 hour) for guest links and 86400 (24h) for rooms. Long TTLs increase abuse surface.

2. **Display name matters.** When generating a guest link, ask the user what display name the guest should appear under. Default to something descriptive like `"Guest"` if they don't care, but prefer real labels: `"Alice (Customer)"`, `"Reporter from FT"`.

3. **Close when done.** If the user says "thanks, we're done", call `mROOM_close` to revoke active sessions immediately rather than waiting for TTL.

## Example

> **User:** "Create a room for me and Bob, then give me a link Bob can use without signing up."
>
> **You:**
> 1. `mROOM_create({ ttl_seconds: 3600 })` → `{ room: { id: "room-uuid-1", expires_at: "..." } }`
> 2. `mROOM_create_guest_link({ room_id: "room-uuid-1", display_name: "Bob", ttl_seconds: 3600 })` → `{ token, join_url: "https://mosadd.com/r/room-uuid-1?t=...", expires_at }`
> 3. Reply to user: "Room ready. Send Bob this link (valid 1 h): `<join_url>`"

## Don't

- Don't generate guest links without explicit user intent — they bypass mosadd auth.
- Don't reuse the same `display_name` across multiple guests in the same room — each guest gets a fresh link.
- Don't promise "encrypted voice" in alpha — voice routing through the LiveKit fork lands in a later release.
