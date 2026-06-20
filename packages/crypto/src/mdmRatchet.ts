/**
 * mDM Double Ratchet WITH a Diffie-Hellman ratchet step — post-compromise
 * security (PCS) for 1:1 DMs. LINEAR-3409.
 *
 * The legacy `doubleRatchet.ts` is symmetric-only: every chain key is derived
 * from the single X3DH root key via HKDF, so leaking ONE chain key compromises
 * every future message. This module adds the Signal "DH ratchet": each time a
 * party receives a message carrying a NEW ratchet public key, fresh X25519 DH
 * entropy is mixed into the root key, healing the session — a key compromised at
 * message N does NOT decrypt messages after the next ratchet turn.
 *
 * It is ADDITIVE: `doubleRatchet.ts` (used by SecureSession → LiveKit calls +
 * mobile) is untouched. This drives the mDM `mosadd.e2ee.v2` envelope only.
 *
 * Scope: strict in-order WITHIN a chain — a gap throws (skipped-message-key
 * caching for lossy/out-of-order transports is LINEAR-2478). Byte-identical in
 * @m0ssad/crypto (app) and @mosadd/crypto (toolkit) so app↔toolkit DMs interop.
 */

import { deriveHkdfKey } from "./hkdf";
import { deriveSharedSecret, generateX25519KeyPair } from "./x25519";
import { encryptBytes, decryptBytes, type EncryptedPayload } from "./aes";

const _enc = new TextEncoder();

/** Serializable per-peer Double Ratchet state (all key material is raw bytes). */
export interface DhRatchetState {
  rk: Uint8Array;        // root key
  dhsPub: Uint8Array;    // my current ratchet public key
  dhsPriv: Uint8Array;   // my current ratchet private key
  dhrPub?: Uint8Array;   // peer's current ratchet public key (set on first DH ratchet)
  cks?: Uint8Array;      // sending chain key
  ckr?: Uint8Array;      // receiving chain key
  ns: number;            // messages sent in the current sending chain
  nr: number;            // messages received in the current receiving chain
  pn: number;            // messages in the previous sending chain
}

/** Per-message ratchet header carried on the wire (alongside the ciphertext). */
export interface DhRatchetHeader {
  dh: Uint8Array;        // sender's current ratchet public key
  pn: number;            // length of the sender's previous sending chain
  n: number;             // message number in the sender's current sending chain
}

// KDF_RK: HKDF keyed by the root key, fed the DH output → (new root key, chain key).
// Produces rk(32) ‖ ck(32). The 32-byte root-key invariant is load-bearing for
// app↔toolkit interop — do NOT change the split/length without updating BOTH the
// @m0ssad/crypto and @mosadd/crypto copies. The guard catches a silent divergence
// (wrong-length salt → garbage keys that fail to decrypt) at the source.
async function kdfRk(rk: Uint8Array, dhOut: Uint8Array): Promise<{ rk: Uint8Array; ck: Uint8Array }> {
  if (rk.length !== 32) throw new Error(`mDM ratchet: root key must be 32 bytes, got ${rk.length}`);
  const out = await deriveHkdfKey(dhOut, { salt: rk, info: _enc.encode("mosadd-dr-rk"), length: 64 });
  return { rk: out.slice(0, 32), ck: out.slice(32, 64) };
}

// KDF_CK: advance a chain key + derive a one-time message key (distinct info domains).
async function kdfCk(ck: Uint8Array): Promise<{ ck: Uint8Array; mk: Uint8Array }> {
  const nextCk = await deriveHkdfKey(ck, { info: _enc.encode("mosadd-dr-ck"), length: 32 });
  const mk = await deriveHkdfKey(ck, { info: _enc.encode("mosadd-dr-mk"), length: 32 });
  return { ck: nextCk, mk };
}

function sameKey(a: Uint8Array | undefined, b: Uint8Array): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Initiator (Alice): rootKey from X3DH + the peer's SIGNED PREKEY public key as
 * the initial remote ratchet key. Establishes her first sending chain immediately
 * (so her first message already carries fresh DH entropy).
 *
 * SECURITY: `peerSignedPrekeyPub` MUST come from a bundle whose Ed25519 signature
 * was verified (mdm-session `verifyPublicBundle`) BEFORE this call — it seeds both
 * the X3DH shared secret and the initial ratchet key. Passing an unverified key
 * lets a network MITM control the session and defeats post-compromise security.
 */
export async function initRatchetInitiator(
  rootKey: Uint8Array,
  peerSignedPrekeyPub: Uint8Array,
): Promise<DhRatchetState> {
  const dhs = await generateX25519KeyPair();
  const dh = await deriveSharedSecret(dhs.privateKey, peerSignedPrekeyPub);
  const { rk, ck } = await kdfRk(rootKey, dh);
  return {
    rk,
    dhsPub: dhs.publicKey,
    dhsPriv: dhs.privateKey,
    dhrPub: peerSignedPrekeyPub,
    cks: ck,
    ckr: undefined,
    ns: 0,
    nr: 0,
    pn: 0,
  };
}

/**
 * Responder (Bob): rootKey from X3DH + his OWN signed-prekey keypair as the
 * initial ratchet keypair (so DH(Alice.ratchet, Bob.SPK) on Alice's side equals
 * DH(Bob.SPK, Alice.ratchet) on Bob's side). Bob's chains are established when he
 * receives Alice's first message.
 */
export async function initRatchetResponder(
  rootKey: Uint8Array,
  ownSignedPrekey: { publicKey: Uint8Array; privateKey: Uint8Array },
): Promise<DhRatchetState> {
  return {
    rk: rootKey,
    dhsPub: ownSignedPrekey.publicKey,
    dhsPriv: ownSignedPrekey.privateKey,
    dhrPub: undefined,
    cks: undefined,
    ckr: undefined,
    ns: 0,
    nr: 0,
    pn: 0,
  };
}

/** Seal one message; advances the sending chain. Mutates `state`. */
export async function ratchetEncrypt(
  state: DhRatchetState,
  plaintext: Uint8Array,
): Promise<{ header: DhRatchetHeader; ct: EncryptedPayload }> {
  if (!state.cks) {
    throw new Error("mDM ratchet: no sending chain yet (a responder must receive a message before replying).");
  }
  const { ck, mk } = await kdfCk(state.cks);
  state.cks = ck;
  const header: DhRatchetHeader = { dh: state.dhsPub, pn: state.pn, n: state.ns };
  state.ns += 1;
  const ct = await encryptBytes(mk, plaintext);
  return { header, ct };
}

// A DH ratchet turn: re-key the root + both chains from fresh DH entropy.
async function dhRatchet(state: DhRatchetState, header: DhRatchetHeader): Promise<void> {
  state.pn = state.ns;
  state.ns = 0;
  state.nr = 0;
  state.dhrPub = header.dh;
  // Receiving chain from DH(my current private, their new public).
  const recv = await kdfRk(state.rk, await deriveSharedSecret(state.dhsPriv, state.dhrPub));
  state.rk = recv.rk;
  state.ckr = recv.ck;
  // Fresh sending keypair + sending chain from DH(my new private, their new public).
  const newDhs = await generateX25519KeyPair();
  state.dhsPub = newDhs.publicKey;
  state.dhsPriv = newDhs.privateKey;
  const send = await kdfRk(state.rk, await deriveSharedSecret(state.dhsPriv, state.dhrPub));
  state.rk = send.rk;
  state.cks = send.ck;
}

/**
 * Open one message; performs a DH ratchet turn when the header carries a new
 * ratchet key. Strict in-order: a gap throws (skipped keys = LINEAR-2478).
 * Mutates `state`.
 */
export async function ratchetDecrypt(
  state: DhRatchetState,
  header: DhRatchetHeader,
  ct: EncryptedPayload,
): Promise<Uint8Array> {
  if (!sameKey(state.dhrPub, header.dh)) {
    // The previous receiving chain must be fully consumed before the turn.
    if (header.pn !== state.nr) {
      throw new Error(
        `mDM ratchet: message skipped before a ratchet turn (expected ${state.nr} in the prior chain, header says ${header.pn}); skipped-key handling is LINEAR-2478.`,
      );
    }
    await dhRatchet(state, header);
  }
  if (header.n !== state.nr) {
    throw new Error(
      `mDM ratchet: out-of-order message (expected ${state.nr}, got ${header.n}); skipped-key handling is LINEAR-2478.`,
    );
  }
  if (!state.ckr) throw new Error("mDM ratchet: no receiving chain.");
  const { ck, mk } = await kdfCk(state.ckr);
  // Decrypt (AEAD tag check) BEFORE advancing the receiving chain, so a corrupt or
  // tampered message is rejected WITHOUT desyncing the ratchet — the next valid
  // message still opens. (Atomicity across a DH-ratchet turn is out of scope here;
  // strict in-order recovery / skipped keys = LINEAR-2478.)
  const plaintext = await decryptBytes(mk, ct);
  state.ckr = ck;
  state.nr += 1;
  return plaintext;
}
