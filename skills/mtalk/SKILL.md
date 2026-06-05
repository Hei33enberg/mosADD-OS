---
name: mosadd-mtalk
description: Push-to-talk voice rooms on mosadd. Half-duplex floor control — one speaker at a time, FIFO queue, anti-hog auto-release. Use when the user wants a walkie-talkie style room, "open a PTT channel", join an ops/field-team room, or hold the floor to speak. NOT for full-duplex 1:1 voice (that's mDM_call_start) and NOT for phone calls (that's mCALL).
---

# mosadd Push-to-Talk (mTALK)

This skill operates the **mTALK** OS module of [mosadd](https://mosadd.dev) — half-duplex voice rooms with explicit floor control. The audio itself flows over the VoiceProvider's media transport (LiveKit by default); these tools coordinate **who** may transmit, which is the part that makes a PTT channel work.

## When to invoke

Trigger on these user intents:
- "Open a PTT room called <X>" — `mTALK_open` (creates the room, returns a stable `room_id`)
- "Join the <X> PTT room" / "Give me join creds" — `mTALK_join` (returns `{ token, url, identity }` for the client to connect)
- "Take the floor" / "Press to talk" — `mTALK_press` (request the floor; you may have to wait in FIFO if someone else is talking)
- "Release the floor" / "Done talking" — `mTALK_release`
- "Who's talking?" / "What's the state of <room>?" — `mTALK_state` (current speaker, queue, your position)

## How to operate

1. **Open before join.** `mTALK_open` is idempotent — same `label` returns the same `room_id`. Always call this first when the user names a room you haven't seen this session.

2. **Don't request the floor unless the user asks to speak.** Pressing the PTT puts you in the speaker queue; if you do it speculatively while reading state, you'll hog the floor from a real participant. Wait for an explicit "I'll talk" / "press PTT".

3. **Release explicitly.** The floor has an anti-hog auto-release timeout (server-side), but releasing manually with `mTALK_release` the moment the user is done is the polite default.

4. **Audio is client-side.** The MCP server **does not stream audio**. After `mTALK_join` returns `{ token, url, identity }`, hand those credentials to a real client (the user's mosadd app, a daemon, a bot's WebRTC stack). Don't try to "speak" through MCP — there's no audio path through the tool call.

## Configuration

mTALK needs the LiveKit credentials in env (BYOK):

```
MOSADD_LIVEKIT_URL=wss://<your-livekit-host>
MOSADD_LIVEKIT_API_KEY=<api key>
MOSADD_LIVEKIT_API_SECRET=<api secret>
```

If unset, mTALK is missing from `comms_capabilities` and the tools fail closed with an actionable error. Direct the user to https://mosadd.dev/docs/quickstart#byok-config.

## Example

> **User:** "Open a PTT room for the field team. I want to take the floor."
>
> **You:**
> 1. `mTALK_open({ label: "field-team" })` → `{ room_id: "ptt:field-team" }`
> 2. `mTALK_join({ room_id: "ptt:field-team" })` → `{ token, url, identity, room_id }`
> 3. `mTALK_press({ room_id: "ptt:field-team" })` → either `{ on_floor: true }` or `{ queued: true, position: 2 }`
> 4. Tell the user: "Field-team room is up — use the credentials in your mosadd client to connect. You have the floor." (or: "...you're #2 in the queue, will get the floor when <speaker> releases.")

## Don't

- Don't claim audio is end-to-end encrypted — the media path is DTLS-SRTP between client and SFU (LiveKit), not E2E.
- Don't press PTT just to "check if I can speak" — that consumes the floor from real speakers.
- Don't confuse mTALK with mDM full-duplex voice or mCALL PSTN. mTALK = walkie-talkie semantics; mDM = phone-style 1:1; mCALL = real phone network.
