/**
 * SupabaseVoiceProvider — the default (network) mTALK provider.
 *
 * Audio media: a LiveKit room, credentials minted by the existing
 * `livekit-token` Edge Function. Floor control: the `mtalk-floor` Edge Function
 * holds the AUTHORITATIVE per-room floor state (running the same reference FSM
 * as floor.ts) and broadcasts changes over Supabase Realtime for sub-100ms PTT
 * grant. mosadd-os just asks and relays the answer.
 */

import type {
  VoiceProvider,
  FloorSnapshot,
  FloorRequestResult,
  VoiceJoinTicket,
} from "@mosadd/providers";
import { getSupabase, invokeFunction, readSupabaseEnv } from "./supabase.js";

const ROOM_PREFIX = "mosadd-room-";

export class SupabaseVoiceProvider implements VoiceProvider {
  private cachedSelfId: string | null = null;

  async selfId(): Promise<string> {
    if (this.cachedSelfId) return this.cachedSelfId;
    readSupabaseEnv();
    const sb = getSupabase();
    const { data: u, error: ue } = await sb.auth.getUser();
    if (ue || !u?.user) {
      throw new Error(
        "Unable to resolve current user. Ensure MOSADD_USER_JWT is set to a valid Supabase session token.",
      );
    }
    const { data: identity, error } = await sb
      .from("identities")
      .select("id")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error || !identity) {
      throw new Error("Current user has no mosadd identity row. Sign in to mosadd.com first.");
    }
    this.cachedSelfId = identity.id as string;
    return this.cachedSelfId;
  }

  async createRoom(label?: string): Promise<{ roomId: string }> {
    const self = await this.selfId();
    const roomId = `${ROOM_PREFIX}${label ? slug(label) : self}`;
    // Floor row is created lazily by mtalk-floor on first request; nothing to do
    // here beyond returning the canonical id.
    return { roomId };
  }

  async joinTicket(roomId: string): Promise<VoiceJoinTicket> {
    const self = await this.selfId();
    type TokenResp = { token: string; url: string; roomName: string; identity: string };
    const data = await invokeFunction<TokenResp>("livekit-token", {
      roomName: roomId,
      identity: self,
    });
    return { token: data.token, url: data.url, identity: data.identity, roomId: data.roomName };
  }

  async requestFloor(roomId: string): Promise<FloorRequestResult> {
    return invokeFunction<FloorRequestResult>("mtalk-floor", { action: "request", room_id: roomId });
  }

  async releaseFloor(roomId: string): Promise<FloorSnapshot> {
    const data = await invokeFunction<{ snapshot: FloorSnapshot }>("mtalk-floor", {
      action: "release",
      room_id: roomId,
    });
    return data.snapshot;
  }

  async floorState(roomId: string): Promise<FloorSnapshot> {
    const data = await invokeFunction<{ snapshot: FloorSnapshot }>("mtalk-floor", {
      action: "state",
      room_id: roomId,
    });
    return data.snapshot;
  }
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
