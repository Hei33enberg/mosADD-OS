import { describe, it, expect } from "vitest";
import { randomBytes } from "../utils";
import { generateX25519KeyPair } from "../x25519";
import { decryptBytes } from "../aes";
import { deriveHkdfKey } from "../hkdf";
import {
  initRatchetInitiator,
  initRatchetResponder,
  ratchetEncrypt,
  ratchetDecrypt,
  type DhRatchetState,
} from "../mdmRatchet";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);

async function pair(): Promise<{ alice: DhRatchetState; bob: DhRatchetState }> {
  const rootKey = randomBytes(32);
  const bobSpk = await generateX25519KeyPair();
  const alice = await initRatchetInitiator(rootKey, bobSpk.publicKey);
  const bob = await initRatchetResponder(rootKey, bobSpk);
  return { alice, bob };
}

describe("mDM Double Ratchet (DH step / PCS — LINEAR-3409)", () => {
  it("delivers a single first message A→B", async () => {
    const { alice, bob } = await pair();
    const { header, ct } = await ratchetEncrypt(alice, enc("hello bob"));
    expect(dec(await ratchetDecrypt(bob, header, ct))).toBe("hello bob");
  });

  it("delivers a full bidirectional conversation across many ratchet turns", async () => {
    const { alice, bob } = await pair();
    const script: Array<["a" | "b", string]> = [
      ["a", "a0"], ["a", "a1"],
      ["b", "b0"],
      ["a", "a2"],
      ["b", "b1"], ["b", "b2"],
      ["a", "a3"],
      ["b", "b3"],
    ];
    for (const [who, msg] of script) {
      if (who === "a") {
        const { header, ct } = await ratchetEncrypt(alice, enc(msg));
        expect(dec(await ratchetDecrypt(bob, header, ct))).toBe(msg);
      } else {
        const { header, ct } = await ratchetEncrypt(bob, enc(msg));
        expect(dec(await ratchetDecrypt(alice, header, ct))).toBe(msg);
      }
    }
  });

  it("POST-COMPROMISE SECURITY: a chain key leaked at message N cannot decrypt messages after the next ratchet turn", async () => {
    const { alice, bob } = await pair();

    const a0 = await ratchetEncrypt(alice, enc("a0"));
    await ratchetDecrypt(bob, a0.header, a0.ct);
    const leakedCkr = bob.ckr ? new Uint8Array(bob.ckr) : null;
    expect(leakedCkr).not.toBeNull();

    const b0 = await ratchetEncrypt(bob, enc("b0"));
    await ratchetDecrypt(alice, b0.header, b0.ct);
    const a1 = await ratchetEncrypt(alice, enc("a1-after-turn"));

    expect(dec(await ratchetDecrypt(bob, a1.header, a1.ct))).toBe("a1-after-turn");

    const mkFromLeaked = await deriveHkdfKey(leakedCkr!, {
      info: new TextEncoder().encode("mosadd-dr-mk"),
      length: 32,
    });
    await expect(decryptBytes(mkFromLeaked, a1.ct)).rejects.toBeTruthy();
  });

  it("forward secrecy: an earlier message slot does not open a later message in the same chain", async () => {
    const { alice, bob } = await pair();
    const m0 = await ratchetEncrypt(alice, enc("m0"));
    const m1 = await ratchetEncrypt(alice, enc("m1"));
    expect(dec(await ratchetDecrypt(bob, m0.header, m0.ct))).toBe("m0");
    expect(dec(await ratchetDecrypt(bob, m1.header, m1.ct))).toBe("m1");
    await expect(ratchetDecrypt(bob, m0.header, m1.ct)).rejects.toBeTruthy();
  });

  it("out-of-order WITHIN a chain: msgs sent 0,1,2 delivered 2,0,1 all decrypt (LINEAR-2478)", async () => {
    const { alice, bob } = await pair();
    const m0 = await ratchetEncrypt(alice, enc("m0"));
    const m1 = await ratchetEncrypt(alice, enc("m1"));
    const m2 = await ratchetEncrypt(alice, enc("m2"));
    expect(dec(await ratchetDecrypt(bob, m2.header, m2.ct))).toBe("m2");
    expect(dec(await ratchetDecrypt(bob, m0.header, m0.ct))).toBe("m0");
    expect(dec(await ratchetDecrypt(bob, m1.header, m1.ct))).toBe("m1");
  });

  it("out-of-order ACROSS a ratchet turn: a delayed message from the previous chain still opens", async () => {
    const { alice, bob } = await pair();
    const m0 = await ratchetEncrypt(alice, enc("m0"));
    const m1 = await ratchetEncrypt(alice, enc("m1")); // chain-1, will arrive LATE
    expect(dec(await ratchetDecrypt(bob, m0.header, m0.ct))).toBe("m0");
    const b0 = await ratchetEncrypt(bob, enc("b0"));
    await ratchetDecrypt(alice, b0.header, b0.ct);
    const a2 = await ratchetEncrypt(alice, enc("a2"));
    expect(dec(await ratchetDecrypt(bob, a2.header, a2.ct))).toBe("a2");
    expect(dec(await ratchetDecrypt(bob, m1.header, m1.ct))).toBe("m1");
  });

  it("bounded skip cache: a gap beyond MAX_SKIP is refused (DoS guard)", async () => {
    const { alice, bob } = await pair();
    const m0 = await ratchetEncrypt(alice, enc("m0"));
    await ratchetDecrypt(bob, m0.header, m0.ct);
    const evilHeader = { dh: m0.header.dh, pn: m0.header.pn, n: 5000 };
    await expect(ratchetDecrypt(bob, evilHeader, m0.ct)).rejects.toThrow(/too many skipped/);
  });
});
