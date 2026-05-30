/**
 * mDM E2EE golden path (LINEAR-2357) — the "done" bar.
 *
 * Two parties (alice, bob) sharing ONE backend that acts as both the message
 * store AND the key directory (decision "1a": prekey bundles ride the same
 * DmProvider as messages). Proves:
 *   1. both publish prekey bundles via the provider,
 *   2. alice mDM_send → X3DH handshake + ratchet → bob mDM_list decrypts it,
 *   3. the bytes on the wire are CIPHERTEXT, not plaintext (no test-theater),
 *   4. bob replies on the established session → alice mDM_list decrypts it.
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
import { InMemoryMdmKeyStore } from "../crypto/mdm-session.js";
import type { MosaddToolContext } from "../types.js";

/** Shared store: message log + key directory, both keyed in one place. */
class SharedBackend {
  readonly messages: Array<{ id: string; senderId: string; payload: Uint8Array; threadId: string }> = [];
  readonly bundles = new Map<string, Uint8Array>();
}

/** One participant's view onto the shared backend. */
class ClientProvider implements DmProvider {
  constructor(
    private readonly backend: SharedBackend,
    private readonly myId: string,
  ) {}
  async selfId(): Promise<string> {
    return this.myId;
  }
  async send(args: DmSendArgs): Promise<DmSendResult> {
    const id = `m${this.backend.messages.length + 1}`;
    this.backend.messages.push({ id, senderId: this.myId, payload: args.payload, threadId: args.threadId });
    return { id, deliveredAt: new Date(0).toISOString() };
  }
  async list(args: DmListArgs): Promise<DmListResult> {
    return {
      messages: this.backend.messages
        .filter((m) => m.threadId === args.threadId)
        .map((m) => ({
          id: m.id,
          senderId: m.senderId,
          payload: m.payload,
          timestamp: new Date(0).toISOString(),
          threadId: m.threadId,
        })),
      nextCursor: null,
    };
  }
  async publishPrekeyBundle(bundle: Uint8Array): Promise<void> {
    this.backend.bundles.set(this.myId, bundle);
  }
  async fetchPrekeyBundle(peerId: string): Promise<Uint8Array | null> {
    return this.backend.bundles.get(peerId) ?? null;
  }
}

const tool = (name: string) => {
  const t = mdmTools.find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t.handler;
};

function ctxFor(backend: SharedBackend, id: string): MosaddToolContext {
  return {
    options: { mode: "local", hubUrl: "https://mcp.mosadd.com" },
    providers: { dm: new ClientProvider(backend, id), keys: new InMemoryMdmKeyStore() },
    log: () => {},
  };
}

describe("mDM E2EE golden path — X3DH handshake + ratchet, both directions", () => {
  it("delivers an encrypted message alice→bob and a reply bob→alice", async () => {
    const backend = new SharedBackend();
    const alice = ctxFor(backend, "alice");
    const bob = ctxFor(backend, "bob");

    // 1. Both publish their prekey bundles (so first contact is possible).
    await tool("mDM_publish_keys")({}, alice);
    const bobPub = (await tool("mDM_publish_keys")({}, bob)) as { one_time_prekeys: number };
    expect(bobPub.one_time_prekeys).toBeGreaterThan(0);

    // 2. Alice sends an encrypted DM to Bob (first contact → X3DH handshake).
    const sent = (await tool("mDM_send")({ to: "bob", text: "first contact" }, alice)) as {
      encrypted: boolean;
    };
    expect(sent.encrypted).toBe(true);

    // 3. The wire bytes must be CIPHERTEXT — the plaintext must NOT appear.
    const wire = backend.messages[0]!.payload;
    const wireStr = Buffer.from(wire).toString("utf8");
    expect(wireStr).not.toContain("first contact");
    expect(wireStr).toContain("mosadd.e2ee.v1"); // it IS our sealed envelope

    // 4. Bob lists the thread and decrypts Alice's message.
    const bobView = (await tool("mDM_list")({ contact_id: "alice" }, bob)) as {
      messages: Array<{ text: string; sender_identity_id: string; encrypted: boolean }>;
    };
    const fromAlice = bobView.messages.find((m) => m.sender_identity_id === "alice");
    expect(fromAlice?.text).toBe("first contact");
    expect(fromAlice?.encrypted).toBe(true);

    // 5. Bob replies on the now-established session (no new handshake).
    await tool("mDM_send")({ to: "alice", text: "copy that" }, bob);

    // 6. Alice decrypts Bob's reply.
    const aliceView = (await tool("mDM_list")({ contact_id: "bob" }, alice)) as {
      messages: Array<{ text: string; sender_identity_id: string }>;
    };
    const fromBob = aliceView.messages.find((m) => m.sender_identity_id === "bob");
    expect(fromBob?.text).toBe("copy that");
  });

  it("mDM_send fails with an actionable error when the peer has no published keys", async () => {
    const backend = new SharedBackend();
    const alice = ctxFor(backend, "alice");
    // Bob never published — no bundle to fetch.
    await expect(tool("mDM_send")({ to: "bob", text: "hi" }, alice)).rejects.toThrow(
      /has not published a prekey bundle/i,
    );
  });

  it("rejects a tampered (MITM) prekey bundle instead of starting a session", async () => {
    const backend = new SharedBackend();
    const alice = ctxFor(backend, "alice");
    const bob = ctxFor(backend, "bob");

    await tool("mDM_publish_keys")({}, bob);

    // MITM swaps Bob's DH identity key (a SIGNED field) in the directory entry,
    // keeping it valid base64 so it parses — only the signature should catch it.
    const obj = JSON.parse(Buffer.from(backend.bundles.get("bob")!).toString("utf8"));
    obj.ik = (obj.ik[0] === "A" ? "B" : "A") + obj.ik.slice(1);
    backend.bundles.set("bob", new Uint8Array(Buffer.from(JSON.stringify(obj), "utf8")));

    await expect(tool("mDM_send")({ to: "bob", text: "intercept me" }, alice)).rejects.toThrow(
      /signature verification|man-in-the-middle/i,
    );
  });
});
