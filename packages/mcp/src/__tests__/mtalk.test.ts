/**
 * mTALK PTT golden path — the half-duplex floor discipline (the kill feature).
 *
 * Two participants (alice, bob) share ONE room (one floor). Proves through the
 * actual mTALK tools:
 *   1. first to press PTT is GRANTED the floor,
 *   2. a second presser is DENIED and QUEUED (half-duplex — one talker),
 *   3. releasing the floor PROMOTES the next in the queue automatically,
 *   4. the anti-hog timeout auto-bumps a holder who never releases,
 *   5. join credentials are issued for the media transport.
 *
 * Deterministic: the in-memory voice provider takes an injected clock, so the
 * anti-hog timeout is tested without real time passing.
 */

import { describe, expect, it } from "vitest";
import { mtalkTools } from "../tools/mtalk.js";
import { InMemoryVoiceProvider } from "../providers/memory-voice.js";
import { InMemoryMdmKeyStore } from "../crypto/mdm-session.js";
import type { DmProvider } from "@mosadd/providers";
import type { MosaddToolContext } from "../types.js";

const tool = (name: string) => {
  const t = mtalkTools.find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t.handler;
};

// mTALK tools never touch dm/keys; a minimal stub satisfies the type.
const dmStub = {} as unknown as DmProvider;

function ctxFor(voice: InMemoryVoiceProvider): MosaddToolContext {
  return {
    options: { mode: "local", hubUrl: "https://mcp.mosadd.com" },
    providers: { dm: dmStub, keys: new InMemoryMdmKeyStore(), voice },
    log: () => {},
  };
}

describe("mTALK PTT floor discipline — half-duplex, queue, promotion, anti-hog", () => {
  it("grants one speaker, queues the next, promotes on release", async () => {
    let now = 1_000;
    const clock = () => now;
    const aliceVoice = new InMemoryVoiceProvider("alice", clock);
    const bobVoice = new InMemoryVoiceProvider("bob", clock);
    aliceVoice.shareRoomsWith(bobVoice); // one shared room/floor
    const alice = ctxFor(aliceVoice);
    const bob = ctxFor(bobVoice);

    // Open a shared room.
    const { room_id } = (await tool("mTALK_open")({ label: "ops" }, alice)) as { room_id: string };
    expect(room_id).toContain("ops");

    // 1. Alice presses PTT first → granted.
    const aPress = (await tool("mTALK_press")({ room_id }, alice)) as {
      granted: boolean;
      position: number;
      holder: string | null;
    };
    expect(aPress.granted).toBe(true);
    expect(aPress.holder).toBe("alice");

    // 2. Bob presses while Alice holds → denied + queued at position 1.
    const bPress = (await tool("mTALK_press")({ room_id }, bob)) as {
      granted: boolean;
      position: number;
      holder: string | null;
      queue: string[];
    };
    expect(bPress.granted).toBe(false);
    expect(bPress.position).toBe(1);
    expect(bPress.holder).toBe("alice");
    expect(bPress.queue).toEqual(["bob"]);

    // 3. Alice releases → Bob is promoted to holder automatically.
    const released = (await tool("mTALK_release")({ room_id }, alice)) as {
      holder: string | null;
      queue: string[];
    };
    expect(released.holder).toBe("bob");
    expect(released.queue).toEqual([]);

    // State reads consistently from Bob's side too.
    const state = (await tool("mTALK_state")({ room_id }, bob)) as { holder: string | null };
    expect(state.holder).toBe("bob");
  });

  it("auto-bumps a holder who exceeds the anti-hog timeout", async () => {
    let now = 0;
    const clock = () => now;
    const aliceVoice = new InMemoryVoiceProvider("alice", clock);
    const bobVoice = new InMemoryVoiceProvider("bob", clock);
    aliceVoice.shareRoomsWith(bobVoice);
    const alice = ctxFor(aliceVoice);
    const bob = ctxFor(bobVoice);

    const { room_id } = (await tool("mTALK_open")({ label: "ops" }, alice)) as { room_id: string };

    await tool("mTALK_press")({ room_id }, alice); // alice holds at t=0
    const bPress = (await tool("mTALK_press")({ room_id }, bob)) as { granted: boolean };
    expect(bPress.granted).toBe(false); // queued behind alice

    // Advance past the 30s anti-hog ceiling; next floor read auto-promotes bob.
    now = 31_000;
    const state = (await tool("mTALK_state")({ room_id }, bob)) as { holder: string | null };
    expect(state.holder).toBe("bob"); // alice was bumped, bob promoted
  });

  it("issues join credentials for the media transport", async () => {
    const voice = new InMemoryVoiceProvider("alice");
    const alice = ctxFor(voice);
    const { room_id } = (await tool("mTALK_open")({}, alice)) as { room_id: string };
    const join = (await tool("mTALK_join")({ room_id }, alice)) as {
      token: string;
      url: string;
      identity: string;
    };
    expect(join.identity).toBe("alice");
    expect(join.token).toBeTruthy();
    expect(join.url).toBeTruthy();
  });
});
