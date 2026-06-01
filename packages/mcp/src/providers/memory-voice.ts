/**
 * InMemoryVoiceProvider — a self-contained mTALK provider for local mode,
 * off-grid single-process use, and tests. It runs the reference floor-control
 * FSM (floor.ts) in process, so the PTT discipline is fully exercised without
 * any media server. It does NOT mint real media credentials (joinTicket returns
 * a local stub) — real audio transport is the network/radio provider's job.
 */

import type {
  VoiceProvider,
  FloorSnapshot,
  FloorRequestResult,
  VoiceJoinTicket,
} from "@mosadd/providers";
import {
  createFloorState,
  requestFloor as fsmRequest,
  releaseFloor as fsmRelease,
  expireStale,
  toSnapshot,
  type FloorState,
} from "../voice/floor.js";

export class InMemoryVoiceProvider implements VoiceProvider {
  private readonly rooms = new Map<string, FloorState>();

  constructor(
    private readonly myId: string,
    /** Injectable clock for deterministic tests; defaults to wall time. */
    private readonly clock: () => number = () => Date.now(),
  ) {}

  async selfId(): Promise<string> {
    return this.myId;
  }

  async createRoom(label?: string): Promise<{ roomId: string }> {
    const roomId = label ? `mtalk:${label}` : `mtalk:${this.myId}`;
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, createFloorState(roomId));
    return { roomId };
  }

  async joinTicket(roomId: string): Promise<VoiceJoinTicket> {
    this.ensure(roomId);
    return { token: `local:${this.myId}`, url: "local://mtalk", identity: this.myId, roomId };
  }

  async requestFloor(roomId: string): Promise<FloorRequestResult> {
    const state = this.ensure(roomId);
    const outcome = fsmRequest(state, this.myId, this.clock());
    return { granted: outcome.granted, position: outcome.position, snapshot: toSnapshot(state) };
  }

  async releaseFloor(roomId: string): Promise<FloorSnapshot> {
    const state = this.ensure(roomId);
    fsmRelease(state, this.myId, this.clock());
    return toSnapshot(state);
  }

  async floorState(roomId: string): Promise<FloorSnapshot> {
    const state = this.ensure(roomId);
    expireStale(state, this.clock());
    return toSnapshot(state);
  }

  /** Shared backend handle so multiple participants' providers see one room. */
  shareRoomsWith(other: InMemoryVoiceProvider): void {
    (other as unknown as { rooms: Map<string, FloorState> }).rooms = this.rooms;
  }

  private ensure(roomId: string): FloorState {
    let state = this.rooms.get(roomId);
    if (!state) {
      state = createFloorState(roomId);
      this.rooms.set(roomId, state);
    }
    return state;
  }
}
