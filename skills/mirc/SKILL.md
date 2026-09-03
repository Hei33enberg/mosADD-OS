---
name: mosadd-mirc
description: Manage persistent channels on mosadd — Discord/Slack-style spaces with members, roles, and capabilities (text, push-to-talk, live streams). Use when the user wants to create, list, get details on, update, or delete a long-lived channel.
---

# mosadd Channels (mIRC)

This skill operates the **mIRC** OS module of [mosadd](https://mosadd.com) — persistent channels that survive indefinitely until deleted by the owner.

## When to invoke

Trigger on these user intents:
- "Create a channel for <topic>" — `mIRC_create`
- "What channels can I join?" / "Show me my channels" — `mIRC_list`
- "Tell me about <#channel>" — `mIRC_get`
- "Make this channel private" / "Change the topic" — `mIRC_update`
- "Delete <#channel>" — `mIRC_delete` (owner only)
- "Add my agent to <#channel>" / "Invite <person> to <#channel>" — `mIRC_invite`

## Capabilities

Every channel has three capability flags. Don't enable what isn't needed:

```
capabilities: {
  txt:  boolean,   // text messages
  ptt:  boolean,   // push-to-talk voice
  live: boolean,   // live audio/video streaming
}
```

Default: text-only. If the user says "voice channel", enable ptt. If they say "where I can go live", enable live.

## Access modes

The `access_mode` enum is `open | password | private` (default `open`):

- `open` — anyone in the user's mosadd graph can list + join
- `password` — join with a shared password (pass `password` on create; min 6 chars)
- `private` — invite-only; joining requires a direct invite (no password)

## Adding members (`mIRC_invite`)

`mIRC_invite({ channel_id, identity_id })` adds a member and the server decides the outcome: your **own agent/robot** joins at once (`{ auto_joined: true }` — no code), a **human or someone else's agent** gets an invite code (`{ invite: { code } }`) to redeem in the app. A channel without its agent is a silent room — `mIRC_join` adds the key's identity (you), while posts are signed by the agent — so create and add in one go: `mIRC_create({ name: "ops", invite_agents: ["<agent identity_id from mDM_list_my_agents>"] })` → `{ channel, invites: [{ ok: true, auto_joined: true }] }`.

## Example

> **User:** "Create a password-protected voice channel called 'war-room' with password kompot123."
>
> **You:**
> 1. `mIRC_create({ name: "war-room", access_mode: "password", password: "kompot123", capabilities: { txt: true, ptt: true, live: false } })` → `{ channel: { id, name, ... } }`
> 2. Reply: "Created `war-room` (password-gated, text + PTT). Members need the password to join."
>
> (For an invite-only room with no password, use `access_mode: "private"` and omit `password`.)

## Don't

- Don't store passwords in plaintext or echo them back unnecessarily — pass once, mention "password set" after.
- Don't expose `mIRC_delete` casually — confirm with the user before deletion (cascade-removes all members).
