import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptBytes, encryptBytes, generateAesKey } from "../aes";
import { initializeRatchet, ratchetReceive, ratchetSend } from "../doubleRatchet";
import { deriveHkdfKey } from "../hkdf";
import { generateMnemonic, initWordlist, mnemonicToSeed, mnemonicToWords, validateMnemonic } from "../mnemonic";
import { SecureSession } from "../session";
import { createVault, verifyVaultPassphrase } from "../vault";
import { generateX25519KeyPair } from "../x25519";
import { performX3dh } from "../x3dh";

describe("@m0ssad/crypto", () => {
  beforeAll(() => {
    const txt = readFileSync(resolve(__dirname, "../bip39-english.txt"), "utf-8");
    const words = txt.trim().split(/\r?\n/).filter(Boolean);
    initWordlist(words);
  });

  // --------------- mnemonic ---------------

  it("generates and validates mnemonic with deterministic seed length", async () => {
    const mnemonic = await generateMnemonic(128);
    expect(await validateMnemonic(mnemonic)).toBe(true);
    expect(mnemonicToWords(mnemonic)).toHaveLength(12);
    expect((await mnemonicToSeed(mnemonic)).length).toBe(64);
  });

  it("rejects an invalid mnemonic", async () => {
    expect(await validateMnemonic("not a valid mnemonic phrase at all here")).toBe(false);
    expect(await validateMnemonic("")).toBe(false);
  });

  it("mnemonicToSeed is deterministic for same input", async () => {
    const mnemonic = await generateMnemonic(128);
    const seed1 = await mnemonicToSeed(mnemonic);
    const seed2 = await mnemonicToSeed(mnemonic);
    expect(Buffer.from(seed1).toString("hex")).toBe(Buffer.from(seed2).toString("hex"));
  });

  // --------------- AES ---------------

  it("encrypts and decrypts AES payload roundtrip", async () => {
    const key = await generateAesKey();
    const plaintext = new TextEncoder().encode("m0ssad-aes-roundtrip");
    const encrypted = await encryptBytes(key, plaintext);
    const decrypted = await decryptBytes(key, encrypted);
    expect(new TextDecoder().decode(decrypted)).toBe("m0ssad-aes-roundtrip");
  });

  it("AES ciphertext differs across encryptions of same plaintext", async () => {
    const key = await generateAesKey();
    const plaintext = new TextEncoder().encode("identical-input");
    const enc1 = await encryptBytes(key, plaintext);
    const enc2 = await encryptBytes(key, plaintext);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  // --------------- HKDF ---------------

  it("HKDF is deterministic for identical inputs", async () => {
    const ikm = crypto.getRandomValues(new Uint8Array(32));
    const info = new TextEncoder().encode("m0ssad-test");
    const a = await deriveHkdfKey(ikm, { info, length: 32 });
    const b = await deriveHkdfKey(ikm, { info, length: 32 });
    expect(Buffer.from(a).toString("hex")).toBe(Buffer.from(b).toString("hex"));
  });

  it("HKDF produces different output for different info strings", async () => {
    const ikm = crypto.getRandomValues(new Uint8Array(32));
    const a = await deriveHkdfKey(ikm, { info: new TextEncoder().encode("info-a"), length: 32 });
    const b = await deriveHkdfKey(ikm, { info: new TextEncoder().encode("info-b"), length: 32 });
    expect(Buffer.from(a).toString("hex")).not.toBe(Buffer.from(b).toString("hex"));
  });

  // --------------- double ratchet ---------------

  it("ratchet send/receive chain keys advance after each step", async () => {
    const rootKey = crypto.getRandomValues(new Uint8Array(32));
    const state = await initializeRatchet(rootKey, "initiator");

    const step0 = await ratchetSend(state);
    const step1 = await ratchetSend(state);

    expect(step0.messageIndex).toBe(0);
    expect(step1.messageIndex).toBe(1);
    expect(Buffer.from(step0.chainKey).toString("hex")).not.toBe(Buffer.from(step1.chainKey).toString("hex"));
    expect(Buffer.from(step0.messageKey).toString("hex")).not.toBe(Buffer.from(step1.messageKey).toString("hex"));
  });

  it("initiator send chain matches responder receive chain", async () => {
    const rootKey = crypto.getRandomValues(new Uint8Array(32));
    const initiator = await initializeRatchet(rootKey, "initiator");
    const responder = await initializeRatchet(rootKey, "responder");

    const sendStep = await ratchetSend(initiator);
    const recvStep = await ratchetReceive(responder);

    expect(sendStep.messageIndex).toBe(recvStep.messageIndex);
    expect(Buffer.from(sendStep.messageKey).toString("hex")).toBe(Buffer.from(recvStep.messageKey).toString("hex"));
  });

  // --------------- SecureSession ---------------

  it("encrypts and decrypts SecureSession both directions", async () => {
    const rootKey = crypto.getRandomValues(new Uint8Array(32));
    const initiator = await SecureSession.fromRootKey(rootKey, "initiator");
    const responder = await SecureSession.fromRootKey(rootKey, "responder");

    const firstEnvelope = await initiator.encrypt(new TextEncoder().encode("hello-responder"));
    const firstPlain = await responder.decrypt(firstEnvelope);
    expect(new TextDecoder().decode(firstPlain)).toBe("hello-responder");

    const secondEnvelope = await responder.encrypt(new TextEncoder().encode("hello-initiator"));
    const secondPlain = await initiator.decrypt(secondEnvelope);
    expect(new TextDecoder().decode(secondPlain)).toBe("hello-initiator");
  });

  it("SecureSession handles multiple sequential messages in one direction", async () => {
    const rootKey = crypto.getRandomValues(new Uint8Array(32));
    const sender = await SecureSession.fromRootKey(rootKey, "initiator");
    const receiver = await SecureSession.fromRootKey(rootKey, "responder");

    const messages = ["first", "second", "third", "fourth", "fifth"];
    for (const msg of messages) {
      const envelope = await sender.encrypt(new TextEncoder().encode(msg));
      const plain = await receiver.decrypt(envelope);
      expect(new TextDecoder().decode(plain)).toBe(msg);
    }
  });

  it("SecureSession rejects replayed message (out-of-order index)", async () => {
    const rootKey = crypto.getRandomValues(new Uint8Array(32));
    const sender = await SecureSession.fromRootKey(rootKey, "initiator");
    const receiver = await SecureSession.fromRootKey(rootKey, "responder");

    const env0 = await sender.encrypt(new TextEncoder().encode("msg-0"));

    const plain0 = await receiver.decrypt(env0);
    expect(new TextDecoder().decode(plain0)).toBe("msg-0");

    // Replaying the same envelope (index=0) when receiver expects index=1
    await expect(receiver.decrypt(env0)).rejects.toThrow("Out-of-order message index");
  });

  // --------------- vault ---------------

  it("creates vault and verifies passphrase", async () => {
    const vault = await createVault({ lockPassphrase: "s3cr3t-pass", mosaddEmail: "123456789@mosadd.com" });
    expect(vault.identity.mosaddEmail).toBe("123456789@mosadd.com");
    expect(await verifyVaultPassphrase("s3cr3t-pass", vault.lockSalt, vault.lockVerifier)).toBe(true);
    expect(await verifyVaultPassphrase("wrong-pass", vault.lockSalt, vault.lockVerifier)).toBe(false);
  });

  it("vault contains valid 12-word mnemonic", async () => {
    const vault = await createVault({ lockPassphrase: "test" });
    expect(vault.words).toHaveLength(12);
    expect(await validateMnemonic(vault.mnemonic)).toBe(true);
    expect(vault.masterKey).toHaveLength(32);
    expect(vault.storageKey).toHaveLength(32);
    expect(vault.lockSalt).toHaveLength(16);
    expect(vault.lockVerifier).toHaveLength(32);
  });

  it("vault mnemonic recovery produces same master key", async () => {
    const original = await createVault({ lockPassphrase: "recovery-test" });
    const recovered = await createVault({ mnemonic: original.mnemonic, lockPassphrase: "new-pass" });

    expect(Buffer.from(recovered.masterKey).toString("hex")).toBe(Buffer.from(original.masterKey).toString("hex"));
    expect(Buffer.from(recovered.storageKey).toString("hex")).toBe(Buffer.from(original.storageKey).toString("hex"));
  });

  // --------------- X3DH ---------------

  it("performs X3DH exchange and derives root key", async () => {
    const initiatorIdentity = await generateX25519KeyPair();
    const initiatorEphemeral = await generateX25519KeyPair();
    const recipientIdentity = await generateX25519KeyPair();
    const recipientSignedPreKey = await generateX25519KeyPair();
    const recipientOneTimePreKey = await generateX25519KeyPair();

    const result = await performX3dh(initiatorIdentity.privateKey, initiatorEphemeral.privateKey, {
      identityPublicKey: recipientIdentity.publicKey,
      signedPreKeyPublicKey: recipientSignedPreKey.publicKey,
      oneTimePreKeyPublicKey: recipientOneTimePreKey.publicKey
    });

    expect(result.rootKey).toHaveLength(32);
    expect(result.sharedSecrets).toHaveLength(4);
    for (const secret of result.sharedSecrets) {
      expect(secret).toHaveLength(32);
    }
  });

  it("X3DH without one-time pre-key produces 3 shared secrets", async () => {
    const initiatorIdentity = await generateX25519KeyPair();
    const initiatorEphemeral = await generateX25519KeyPair();
    const recipientIdentity = await generateX25519KeyPair();
    const recipientSignedPreKey = await generateX25519KeyPair();

    const result = await performX3dh(initiatorIdentity.privateKey, initiatorEphemeral.privateKey, {
      identityPublicKey: recipientIdentity.publicKey,
      signedPreKeyPublicKey: recipientSignedPreKey.publicKey,
    });

    expect(result.rootKey).toHaveLength(32);
    expect(result.sharedSecrets).toHaveLength(3);
  });

  it("X3DH root key is deterministic for same key material", async () => {
    const ik = await generateX25519KeyPair();
    const ek = await generateX25519KeyPair();
    const rIk = await generateX25519KeyPair();
    const rSpk = await generateX25519KeyPair();

    const bundle = { identityPublicKey: rIk.publicKey, signedPreKeyPublicKey: rSpk.publicKey };
    const r1 = await performX3dh(ik.privateKey, ek.privateKey, bundle);
    const r2 = await performX3dh(ik.privateKey, ek.privateKey, bundle);

    expect(Buffer.from(r1.rootKey).toString("hex")).toBe(Buffer.from(r2.rootKey).toString("hex"));
  });

  // --------------- X25519 key generation ---------------

  it("generates unique X25519 key pairs", async () => {
    const kp1 = await generateX25519KeyPair();
    const kp2 = await generateX25519KeyPair();
    expect(Buffer.from(kp1.publicKey).toString("hex")).not.toBe(Buffer.from(kp2.publicKey).toString("hex"));
  });
});
