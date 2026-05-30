/**
 * Golden-path E2E: the day-1 "done" bar for the provider-abstraction seam.
 *
 * Proves a carrier-aware HOST (e.g. cymru-os) can inject its own transport
 * under mDM without mosadd-os knowing anything about that transport:
 *   1. host learns capabilities (comms_capabilities) and sees mDM_send = "any"
 *      (usable off-grid over radio),
 *   2. host injects a fake RadioProvider,
 *   3. agent calls mDM_send,
 *   4. the opaque payload bytes actually arrive at the injected provider,
 *   5. they round-trip back out via mDM_list.
 *
 * This is the "is it sp, not just written" check the whole 2144 task hinges on.
 */

import { describe, expect, it } from "vitest";
import type {
  DmProvider,
  DmSendArgs,
  DmListArgs,
  DmSendResult,
  DmListResult,
} from "@m0ssad/providers";
import { mdmTools } from "../tools/mdm.js";
import { makeCapabilitiesTool } from "../tools/capabilities.js";
import { allTools } from "../tools/index.js";
import { createMosaddServer } from "../server.js";
import type { MosaddToolContext, ProviderRegistry } from "../types.js";

/** Stand-in for a host-supplied radio transport: captures the bytes it's asked
 *  to send, and replays them on list — i.e. "the message reached the link". */
class FakeRadioDmProvider implements DmProvider {
  public readonly sent: DmSendArgs[] = [];
  async selfId(): Promise<string> {
    return "radio:self-callsign";
  }
  async send(args: DmSendArgs): Promise<DmSendResult> {
    this.sent.push(args);
    return { id: `radio-${this.sent.length}`, deliveredAt: new Date(0).toISOString() };
  }
  async list(args: DmListArgs): Promise<DmListResult> {
    return {
      messages: this.sent
        .filter((s) => s.threadId === args.threadId)
        .map((s, i) => ({
          id: `radio-${i + 1}`,
          senderId: "radio:self-callsign",
          payload: s.payload,
          timestamp: new Date(0).toISOString(),
          threadId: s.threadId,
        })),
      nextCursor: null,
    };
  }
}

function makeCtx(providers: ProviderRegistry): MosaddToolContext {
  return {
    options: { mode: "local", hubUrl: "https://mcp.mosadd.com" },
    providers,
    log: () => {},
  };
}

const getTool = (name: string) => {
  const t = mdmTools.find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t;
};

describe("golden path — host injects transport under mDM", () => {
  it("step 1: comms_capabilities reports mDM_send usable over any carrier", async () => {
    const capTool = makeCapabilitiesTool(allTools);
    const manifest = (await capTool.handler({}, makeCtx({ dm: new FakeRadioDmProvider() }))) as {
      by_requirement: Record<string, string[]>;
    };
    expect(manifest.by_requirement.any).toContain("mDM_send");
  });

  it("steps 2-4: mDM_send delivers the opaque payload to the injected provider", async () => {
    const radio = new FakeRadioDmProvider();
    const ctx = makeCtx({ dm: radio });

    const send = getTool("mDM_send");
    const result = (await send.handler(
      { to: "bob-callsign", text: "rendezvous at grid 4471, 0600" },
      ctx,
    )) as { message_id: string; thread_id: string };

    // The bytes actually reached the transport.
    expect(radio.sent).toHaveLength(1);
    expect(radio.sent[0]!.to).toBe("bob-callsign");
    expect(radio.sent[0]!.payload).toBeInstanceOf(Uint8Array);
    expect(radio.sent[0]!.payload.byteLength).toBeGreaterThan(0);
    expect(result.message_id).toBe("radio-1");

    // The payload is opaque to the provider but carries our text under the hood.
    const decoded = JSON.parse(Buffer.from(radio.sent[0]!.payload).toString("utf8"));
    expect(decoded.text).toBe("rendezvous at grid 4471, 0600");
  });

  it("step 5: mDM_list round-trips the message back through the same provider", async () => {
    const radio = new FakeRadioDmProvider();
    const ctx = makeCtx({ dm: radio });

    await getTool("mDM_send").handler({ to: "bob-callsign", text: "ack" }, ctx);
    const listed = (await getTool("mDM_list").handler({ contact_id: "bob-callsign" }, ctx)) as {
      messages: Array<{ text: string }>;
    };

    expect(listed.messages).toHaveLength(1);
    expect(listed.messages[0]!.text).toBe("ack");
  });

  it("default server wires a DmProvider without a host override (no throw)", () => {
    // Network default path: constructing the server must not require a host to
    // inject anything (it falls back to the Supabase adapter).
    expect(() => createMosaddServer()).not.toThrow();
    expect(() => createMosaddServer({ providers: { dm: new FakeRadioDmProvider() } })).not.toThrow();
  });
});
