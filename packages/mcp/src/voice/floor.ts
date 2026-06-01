/**
 * mTALK floor control — the half-duplex push-to-talk state machine.
 *
 * This is the kill-feature logic: a walkie-talkie discipline over a real-time
 * room. At most ONE participant transmits at a time (holds "the floor"); others
 * who press PTT are queued FIFO and promoted when the holder releases. An
 * anti-hog timeout auto-releases a holder who never lets go, so one participant
 * can't lock everyone else out.
 *
 * It is a PURE, deterministic reducer over plain data — no I/O, no clock of its
 * own (the caller passes `now`). That makes it:
 *   - the reference implementation the authoritative server (mtalk-floor edge
 *     function) runs per room, and
 *   - trivially unit-testable, and
 *   - reusable by an in-memory provider for local/off-grid and for tests.
 *
 * A radio host does NOT use this — there the floor is the physical RF channel
 * (carrier sense + the hardware PTT button). This models the NETWORK floor.
 */

import type { FloorSnapshot } from "@mosadd/providers";

/** Serializable floor state for one room. `since` is epoch ms (number) here; the snapshot exposes ISO. */
export interface FloorState {
  roomId: string;
  holder: string | null;
  /** Epoch ms when the holder acquired the floor; null when idle. */
  sinceMs: number | null;
  queue: string[];
  /**
   * Max ms a holder may keep the floor before auto-release (anti-hog). 0/undefined
   * disables the timeout. Default applied by `createFloorState`.
   */
  maxHoldMs: number;
}

/** Default anti-hog ceiling: 30s of continuous transmission, like a real PTT radio. */
export const DEFAULT_MAX_HOLD_MS = 30_000;

export function createFloorState(roomId: string, maxHoldMs: number = DEFAULT_MAX_HOLD_MS): FloorState {
  return { roomId, holder: null, sinceMs: null, queue: [], maxHoldMs };
}

export function toSnapshot(state: FloorState): FloorSnapshot {
  return {
    roomId: state.roomId,
    holder: state.holder,
    since: state.sinceMs === null ? null : new Date(state.sinceMs).toISOString(),
    queue: [...state.queue],
  };
}

/**
 * Auto-release the holder if they've exceeded the anti-hog ceiling, promoting
 * the next queued participant. Idempotent; call before any decision so a stale
 * holder never blocks a fresh request. Mutates and returns `state`.
 */
export function expireStale(state: FloorState, now: number): FloorState {
  if (
    state.holder !== null &&
    state.maxHoldMs > 0 &&
    state.sinceMs !== null &&
    now - state.sinceMs >= state.maxHoldMs
  ) {
    promoteNext(state, now);
  }
  return state;
}

/** Internal: clear the holder and promote the head of the queue (if any). */
function promoteNext(state: FloorState, now: number): void {
  const next = state.queue.shift();
  if (next !== undefined) {
    state.holder = next;
    state.sinceMs = now;
  } else {
    state.holder = null;
    state.sinceMs = null;
  }
}

export interface RequestOutcome {
  granted: boolean;
  /** 1-based queue position when not granted; 0 when granted. */
  position: number;
}

/**
 * Press PTT. Grants the floor if idle (or refreshes if the caller already holds
 * it); otherwise enqueues FIFO and reports the caller's position. Mutates state.
 */
export function requestFloor(state: FloorState, participant: string, now: number): RequestOutcome {
  expireStale(state, now);

  if (state.holder === null) {
    state.holder = participant;
    state.sinceMs = now;
    // Acquiring clears any prior queued entry for this participant.
    state.queue = state.queue.filter((p) => p !== participant);
    return { granted: true, position: 0 };
  }

  if (state.holder === participant) {
    // Holding PTT down — refresh the hold so a long legitimate transmission
    // isn't cut by the anti-hog timer mid-sentence.
    state.sinceMs = now;
    return { granted: true, position: 0 };
  }

  // Someone else holds the floor → queue (idempotent: no duplicate entries).
  const existing = state.queue.indexOf(participant);
  if (existing !== -1) return { granted: false, position: existing + 1 };
  state.queue.push(participant);
  return { granted: false, position: state.queue.length };
}

/**
 * Release PTT. If the caller holds the floor, it's freed and the next queued
 * participant is promoted. If the caller is only queued, their request is
 * cancelled. No-op otherwise. Mutates state.
 */
export function releaseFloor(state: FloorState, participant: string, now: number): FloorState {
  expireStale(state, now);

  if (state.holder === participant) {
    promoteNext(state, now);
    return state;
  }
  // Not holding — cancel a pending queued request if present.
  state.queue = state.queue.filter((p) => p !== participant);
  return state;
}
