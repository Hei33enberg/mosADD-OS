import { describe, expect, it } from "vitest";
import { generateGroupKey } from "@mosadd/crypto";
import {
  decryptWithGroupKey,
  encryptWithGroupKey,
  signCiphertext,
  unwrapEnvelopeText,
} from "../crypto/channel-e2ee.js";

const envelope = (text: string) =>
  JSON.stringify({ v: "mosadd.chat.v1", type: "text", text, reply_to: null, sent_at: new Date().toISOString() });

describe("channel-e2ee pure core", () => {
  it("roundtrip: encrypt → decrypt returns the original text", async () => {
    const key = generateGroupKey();
    const plain = envelope("Fala 4 żyje");
    const payload = await encryptWithGroupKey(key, plain);
    expect(typeof payload).toBe("string");
    const out = await decryptWithGroupKey(key, payload);
    expect(out).toBe(plain);
  });

  it("decrypt of a legacy (non-JSON) payload returns null", async () => {
    const key = generateGroupKey();
    const legacy = Buffer.from(envelope("stara wiadomość"), "utf8").toString("base64");
    expect(await decryptWithGroupKey(key, legacy)).toBeNull();
  });

  it("tampered ciphertext fails the HMAC check and returns null", async () => {
    const key = generateGroupKey();
    const payload = await encryptWithGroupKey(key, envelope("nie ruszaj"));
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as {
      iv: string;
      ciphertext: string;
      hmac: string;
    };
    // flip one character of the ciphertext
    parsed.ciphertext = (parsed.ciphertext[0] === "A" ? "B" : "A") + parsed.ciphertext.slice(1);
    const tampered = Buffer.from(JSON.stringify(parsed), "utf8").toString("base64");
    expect(await decryptWithGroupKey(key, tampered)).toBeNull();
  });

  it("wrong key does not decrypt", async () => {
    const keyA = generateGroupKey();
    const keyB = generateGroupKey();
    const payload = await encryptWithGroupKey(keyA, envelope("sekret"));
    expect(await decryptWithGroupKey(keyB, payload)).toBeNull();
  });

  it("HMAC is over the base64 ciphertext string (app parity 2C)", async () => {
    const key = generateGroupKey();
    const payload = await encryptWithGroupKey(key, "abc");
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as { ciphertext: string; hmac: string };
    expect(parsed.hmac).toBe(signCiphertext(key, parsed.ciphertext));
  });

  it("unwrapEnvelopeText unwraps toolkit envelopes and leaves raw text", () => {
    expect(unwrapEnvelopeText(envelope("witaj"))).toBe("witaj");
    expect(unwrapEnvelopeText("zwykły tekst")).toBe("zwykły tekst");
    expect(unwrapEnvelopeText('{"audio":"AAAA"}')).toBe('{"audio":"AAAA"}');
  });
});
