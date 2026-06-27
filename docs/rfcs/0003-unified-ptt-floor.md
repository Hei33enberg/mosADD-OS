# RFC 0003 — Unified PTT floor control (one source of truth for mTALK)

- **Status:** Draft
- **Author:** @Hei33enberg
- **Created:** 2026-06-03
- **Last updated:** 2026-06-03
- **Linear ticket:** LINEAR-XXXX (mtalk-floor-unify)
- **Supersedes:** (none)
- **Superseded by:** (none)

## Summary

Push-to-talk floor control exists **twice** with different semantics: the mosadd.com app
uses a **client-side Supabase Realtime broadcast** queue (`usePttQueue`), while the
mosADD toolkit uses a **server-authoritative finite state machine** (`floor.ts` +
`mtalk_floor` RPC + `mtalk-floor` edge function, behind the `VoiceProvider` DI seam).
This RFC makes the server-authoritative FSM the single source of truth and reworks the
app to consume it through a `VoiceProvider`, so both surfaces share one floor.

## Motivation

| Surface | Floor control | Authority | Anti-hog | Cross-surface |
|---|---|---|---|---|
| **App** (`usePttQueue`) | Supabase Realtime **broadcast** on `ptt-queue:<channelId>`; each client mutates its own copy of `{activeSpeaker, queue, version}` from `request_mic`/`release_mic`/`admin_action`/`sync_request` events | **None** (peer consensus) | No server enforcement | No |
| **Toolkit** (`mTALK_*`) | `floor.ts` FSM (`requestFloor`/`releaseFloor`/`expireStale`, `DEFAULT_MAX_HOLD_MS=30_000`) via `mtalk_floor` plpgsql RPC + `mtalk-floor` edge fn, exposed by `VoiceProvider` | **Server (DB row)** | Yes (auto-release on max hold) | No |

Problems with the app's broadcast model:
1. **No single source of truth.** Two clients can both believe they hold the floor
   (broadcast races, missed events, late joiners rely on `sync_request` from the current
   speaker). Half-duplex PTT *requires* a single authoritative speaker.
2. **No server-side anti-hog / expiry.** A client that crashes mid-transmission can hold
   the floor until peers time it out; there is no `expireStale` authority.
3. **Two implementations, no interop.** An agent using `mTALK_press` and an app user on
   the same room are not contending for the same floor.

## Detailed design

### 1. `mtalk_floor` RPC + `mtalk-floor` edge function = the only floor authority

The DB row + plpgsql RPC (already backing the toolkit) is the single writer. Operations:

```
requestFloor(roomId, participant) -> { granted | queued, position, snapshot }
releaseFloor(roomId, participant) -> snapshot
floorState(roomId)                -> snapshot           // { holder, holderSince, queue[], version }
expireStale(roomId, now)          -> snapshot           // server cron / on-access sweep, max hold 30s
```

These already exist as `floor.ts` (pure FSM) + the `mtalk_floor` RPC. No new authority
is introduced — we delete the second one (the broadcast model).

### 2. App consumes `VoiceProvider` instead of its own queue

`packages/providers/src/voice.ts` already defines the seam:

```ts
interface VoiceProvider {
  joinTicket(roomId): Promise<VoiceJoinTicket>;       // mints the LiveKit token (app already has livekit-token)
  requestFloor(roomId): Promise<FloorRequestResult>;
  releaseFloor(roomId): Promise<FloorSnapshot>;
  floorState(roomId): Promise<FloorSnapshot>;
}
```

Rework `usePttQueue` into `usePttFloor(roomId)` that calls a `SupabaseVoiceProvider`
bound to `mtalk-floor` (same edge fn the toolkit uses). Realtime is kept ONLY as a
**notification transport** (subscribe to floor-change events to re-fetch the snapshot),
never as the authority. `canPtt` / role checks stay client-side as a pre-gate; the server
RPC enforces membership + single-holder.

### 3. Transport unchanged

Media stays on LiveKit; the app keeps `livekit-token` for `joinTicket`. Only the
*floor* (who may speak) moves to the shared authority.

### 4. Rollout

- Phase 1: implement `SupabaseVoiceProvider.requestFloor/releaseFloor/floorState` against
  `mtalk-floor` (toolkit already has the memory + supabase providers).
- Phase 2: `usePttFloor` replaces `usePttQueue` internals; UI (`PttButtonState`) maps from
  the snapshot (`idle`/`transmitting`/`queued`/`no_ptt_permission`).
- Phase 3: delete the `ptt-queue:<channelId>` broadcast logic; one room = one floor.
- Phase 4: verify an app user and an `mTALK_press` agent contend for the same floor.

## Drawbacks

- A server round-trip per press/release vs. instant local broadcast — adds latency
  (mitigate with optimistic UI: show "queued" immediately, reconcile on snapshot).
- The edge fn / RPC becomes a hot path for active voice rooms; needs rate-limit + load
  consideration.

## Rationale and alternatives

- **Server-authoritative FSM (chosen):** half-duplex PTT is a mutual-exclusion problem;
  mutual exclusion needs one authority. The toolkit already built it and it's unit-tested
  (`mtalk.test.ts`).
- *Alternative: keep broadcast, add a "leader" client.* Rejected — leader election over
  broadcast reintroduces the same race; the DB row already is the leader.
- *Alternative: CRDT queue.* Overkill for single-holder mutual exclusion.

## Prior art

LiveKit itself has no opinion on PTT floor (transport only) — floor control is an app
concern. Classic half-duplex / trunked-radio floor control (single PTT grant, FIFO queue,
hang-time) maps directly onto the FSM.

## Unresolved questions

- Latency budget for press→grant; whether to pre-acquire the floor on button-down vs.
  button-press.
- Presence/observer count (currently inferred from broadcast presence) — source it from
  LiveKit room participants or a presence table instead.

## Future possibilities

One floor authority enables mixed human+agent voice rooms (an agent and a person taking
turns on the same PTT channel), hardware PTT (the handheld) hitting the same RPC, and
server-side recording keyed to the authoritative speaker timeline.
