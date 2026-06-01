/**
 * mDM end-to-end encryption — session layer (LINEAR-2357).
 *
 * Sits ABOVE the DmProvider. The provider moves opaque bytes; THIS module
 * decides what those bytes are: an X3DH handshake + Double Ratchet ciphertext
 * envelope, produced from `@mosadd/crypto` primitives.
 *
 * Flow (decision "1a" — prekey distribution rides the DmProvider):
 *   - Each peer publishes a prekey bundle via `dm.publishPrekeyBundle(bytes)`.
 *   - First contact: sender `dm.fetchPrekeyBundle(peer)` → X3DH (initiator) →
 *     Double Ratchet. The first ciphertext carries a handshake header
 *     (initiator IK + EK + consumed one-time-prekey id) so the recipient can
 *     run X3DH (responder) and derive the SAME root key.
 *   - Subsequent messages reuse the stored ratchet session (no header).
 *
 * SCOPE / known follow-ups (tracked on LINEAR-2357, NOT silently hidden):
 *   - Ratchet is strict in-order (no skipped-message keys) — fine for a single
 *     ordered thread; out-of-order/lossy transports need skipped-key handling.
 *   - Signed-prekey signature is carried but NOT yet verified (auth follow-up).
 *   - Initiator "glare" (both sides open simultaneously) not resolved.
 *   - Default keystore is in-memory (per-process); file/OS-keychain backing is
 *     a follow-up. The MdmKeyStore seam makes that a drop-in.
 */

import {
  decryptBytes,
  encryptBytes,
  generateEd25519KeyPair,
  generateX25519KeyPair,
  initializeRatchet,
  performX3dh,
  performX3dhResponder,
  ratchetReceive,
  ratchetSend,
  signEd25519,
  verifyEd25519,
  toBase64,
  fromBase64,
  type EncryptedPayload,
  type RatchetState,
  type SessionRole,
} from "@mosadd/crypto";
import type { DmProvider } from "@mosadd/providers";

export const PREKEY_BUNDLE_VERSION = "mosadd.prekeys.v1" as const;
export const E2EE_ENVELOPE_VERSION = "mosadd.e2ee.v1" as const;

const DEFAULT_ONE_TIME_PREKEYS = 8;

// ---- Key material types ----

interface X25519Pair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** The local peer's long-term identity + prekeys (private halves included). */
export interface OwnPrekeyMaterial {
  /** X25519 DH identity — used in X3DH. */
  identity: X25519Pair;
  /**
   * Ed25519 SIGNING identity — the long-term key a peer pins out-of-band
   * (the "safety number"). Signs the bundle so a network/radio MITM can't swap
   * the signed prekey or DH identity in transit.
   */
  signingIdentity: { publicKey: Uint8Array; privateKey: Uint8Array };
  signedPrekey: { id: number; pair: X25519Pair };
  oneTimePrekeys: Array<{ id: number; pair: X25519Pair }>;
}

/** A peer's PUBLIC prekey bundle, as parsed off the wire. */
export interface PublicPrekeyBundle {
  identityPublicKey: Uint8Array;
  /** Ed25519 signing-identity public key the signature is verified against. */
  signingIdentityPublicKey: Uint8Array;
  signedPrekey: { id: number; publicKey: Uint8Array };
  oneTimePrekeys: Array<{ id: number; publicKey: Uint8Array }>;
  /** Ed25519 signature over (DH identity pub ‖ signed-prekey pub). */
  signature: Uint8Array;
}

/** Persisted per-peer ratchet session. Plain data → trivially serializable. */
export interface MdmSessionRecord {
  ratchet: RatchetState;
  role: SessionRole;
  /** Handshake header still owed to the peer (initiator only, until first send). */
  pendingHandshake?: { ik: Uint8Array; ek: Uint8Array; opkId?: number };
}

/**
 * Local custody of private key material + ratchet sessions. The default impl
 * is in-memory; a host may inject a file- or keychain-backed implementation.
 */
export interface MdmKeyStore {
  /** Own identity + prekeys. Generated lazily on first access, then stable. */
  getOwnMaterial(): Promise<OwnPrekeyMaterial>;
  /** Consume (one-time) a prekey private by id. Returns undefined if unknown. */
  takeOneTimePrekey(id: number): Promise<Uint8Array | undefined>;
  getSession(peerId: string): Promise<MdmSessionRecord | undefined>;
  putSession(peerId: string, record: MdmSessionRecord): Promise<void>;

  /**
   * OPTIONAL local "sent items" cache. The Double Ratchet is forward-secret and
   * asymmetric: once we seal a message for a peer we cannot re-derive its
   * plaintext from our own ratchet on read. So mDM_list cannot show the sender
   * their OWN outgoing text unless we keep a local copy. These two methods are
   * that copy — keyed by the provider-assigned message id.
   *
   * Honesty note: this is a LOCAL plaintext cache, not synced across devices.
   * A second device (or a fresh process) won't have it and will fall back to a
   * "<encrypted · sent by you>" marker. Cross-device sent-history sync is a
   * tracked follow-up (would need an encrypt-to-self session). Optional so
   * existing MdmKeyStore implementations keep compiling.
   */
  putSentMessage?(messageId: string, plaintext: Uint8Array): Promise<void>;
  getSentMessage?(messageId: string): Promise<Uint8Array | undefined>;
}

// ---- In-memory keystore (default) ----

export class InMemoryMdmKeyStore implements MdmKeyStore {
  private material: OwnPrekeyMaterial | null = null;
  private readonly oneTimeById = new Map<number, Uint8Array>();
  private readonly sessions = new Map<string, MdmSessionRecord>();
  private readonly sentMessages = new Map<string, Uint8Array>();

  async getOwnMaterial(): Promise<OwnPrekeyMaterial> {
    if (this.material) return this.material;
    const identity = await generateX25519KeyPair();
    const signingIdentity = await generateEd25519KeyPair();
    const signedPrekeyPair = await generateX25519KeyPair();
    const signedPrekey = { id: randomId(), pair: signedPrekeyPair };
    const oneTimePrekeys: OwnPrekeyMaterial["oneTimePrekeys"] = [];
    for (let i = 0; i < DEFAULT_ONE_TIME_PREKEYS; i += 1) {
      const pair = await generateX25519KeyPair();
      const id = randomId();
      oneTimePrekeys.push({ id, pair });
      this.oneTimeById.set(id, pair.privateKey);
    }
    this.material = { identity, signingIdentity, signedPrekey, oneTimePrekeys };
    return this.material;
  }

  async takeOneTimePrekey(id: number): Promise<Uint8Array | undefined> {
    const priv = this.oneTimeById.get(id);
    if (priv) this.oneTimeById.delete(id); // one-time: consume on use
    return priv;
  }

  async getSession(peerId: string): Promise<MdmSessionRecord | undefined> {
    return this.sessions.get(peerId);
  }

  async putSession(peerId: string, record: MdmSessionRecord): Promise<void> {
    this.sessions.set(peerId, record);
  }

  async putSentMessage(messageId: string, plaintext: Uint8Array): Promise<void> {
    this.sentMessages.set(messageId, plaintext);
  }

  async getSentMessage(messageId: string): Promise<Uint8Array | undefined> {
    return this.sentMessages.get(messageId);
  }
}

function randomId(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

// ---- Bundle codec (opaque bytes the provider moves) ----

/**
 * The exact bytes signed by / verified against the Ed25519 signing identity:
 * the DH identity public key concatenated with the signed-prekey public key.
 * Binding both means a MITM cannot swap either without invalidating the sig.
 */
function bundleSigningMessage(dhIdentityPub: Uint8Array, signedPrekeyPub: Uint8Array): Uint8Array {
  const msg = new Uint8Array(dhIdentityPub.length + signedPrekeyPub.length);
  msg.set(dhIdentityPub, 0);
  msg.set(signedPrekeyPub, dhIdentityPub.length);
  return msg;
}

export function serializePublicBundle(material: OwnPrekeyMaterial): Uint8Array {
  const signature = signEd25519(
    material.signingIdentity.privateKey,
    bundleSigningMessage(material.identity.publicKey, material.signedPrekey.pair.publicKey),
  );
  const json = JSON.stringify({
    v: PREKEY_BUNDLE_VERSION,
    ik: toBase64(material.identity.publicKey),
    sik: toBase64(material.signingIdentity.publicKey),
    spk: { id: material.signedPrekey.id, pub: toBase64(material.signedPrekey.pair.publicKey) },
    opks: material.oneTimePrekeys.map((k) => ({ id: k.id, pub: toBase64(k.pair.publicKey) })),
    sig: toBase64(signature),
  });
  return new Uint8Array(Buffer.from(json, "utf8"));
}

export function parsePublicBundle(bytes: Uint8Array): PublicPrekeyBundle {
  const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (obj?.v !== PREKEY_BUNDLE_VERSION) {
    throw new Error(`Unsupported prekey bundle version: ${obj?.v}`);
  }
  if (typeof obj.sik !== "string" || typeof obj.sig !== "string") {
    throw new Error("Prekey bundle is missing its signing identity / signature.");
  }
  return {
    identityPublicKey: fromBase64(obj.ik),
    signingIdentityPublicKey: fromBase64(obj.sik),
    signedPrekey: { id: obj.spk.id, publicKey: fromBase64(obj.spk.pub) },
    oneTimePrekeys: (obj.opks ?? []).map((k: { id: number; pub: string }) => ({
      id: k.id,
      publicKey: fromBase64(k.pub),
    })),
    signature: fromBase64(obj.sig),
  };
}

/**
 * Verify the bundle's self-signature: the signing identity must have signed
 * (DH identity ‖ signed prekey). Rejecting a bad signature is the MITM defense
 * at X3DH first contact — an attacker who rewrites the bundle in transit cannot
 * forge this without the peer's Ed25519 signing private key.
 *
 * NOTE: this authenticates the bundle UNDER its signing identity. Pinning that
 * identity (safety numbers / TOFU) is a separate layer, tracked on 2342.
 */
export function verifyPublicBundle(bundle: PublicPrekeyBundle): boolean {
  return verifyEd25519(
    bundle.signature,
    bundleSigningMessage(bundle.identityPublicKey, bundle.signedPrekey.publicKey),
    bundle.signingIdentityPublicKey,
  );
}

// ---- Envelope codec ----

interface E2eeEnvelope {
  v: typeof E2EE_ENVELOPE_VERSION;
  /** Handshake header — present only on the initiator's first message. */
  hdr?: { ik: string; ek: string; opk?: number };
  /** Ratchet message index (strict in-order). */
  i: number;
  ct: EncryptedPayload;
}

/** Quick check whether on-wire bytes are an mDM E2EE envelope (vs legacy plaintext). */
export function isE2eeEnvelope(bytes: Uint8Array): boolean {
  try {
    const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
    return obj?.v === E2EE_ENVELOPE_VERSION && typeof obj?.i === "number" && !!obj?.ct;
  } catch {
    return false;
  }
}

function serializeEnvelope(env: E2eeEnvelope): Uint8Array {
  return new Uint8Array(Buffer.from(JSON.stringify(env), "utf8"));
}

function parseEnvelope(bytes: Uint8Array): E2eeEnvelope {
  const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (obj?.v !== E2EE_ENVELOPE_VERSION) throw new Error(`Unsupported mDM envelope version: ${obj?.v}`);
  return obj as E2eeEnvelope;
}

// ---- Publish ----

/** Serialize the local bundle and hand it to the provider's key directory. */
export async function publishOwnPrekeys(
  keystore: MdmKeyStore,
  dm: DmProvider,
): Promise<{ oneTimePrekeyCount: number }> {
  const material = await keystore.getOwnMaterial();
  await dm.publishPrekeyBundle(serializePublicBundle(material));
  return { oneTimePrekeyCount: material.oneTimePrekeys.length };
}

// ---- Encrypt (send) ----

/**
 * Seal `plaintext` for `peerId`, establishing an X3DH+ratchet session on first
 * contact (fetching the peer's published bundle via the provider). Returns the
 * opaque envelope bytes to hand to `dm.send`.
 */
export async function encryptForPeer(
  keystore: MdmKeyStore,
  dm: DmProvider,
  peerId: string,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  let session = await keystore.getSession(peerId);

  if (!session) {
    const raw = await dm.fetchPrekeyBundle(peerId);
    if (!raw) {
      throw new Error(
        `Peer "${peerId}" has not published a prekey bundle yet, so an encrypted session cannot be established. ` +
          `Ask them to run mDM_publish_keys, or use mDM_send_unencrypted (deprecated) for the migration window.`,
      );
    }
    const peer = parsePublicBundle(raw);
    // MITM defense: reject a bundle whose self-signature doesn't verify before
    // we derive any key material from it.
    if (!verifyPublicBundle(peer)) {
      throw new Error(
        `Prekey bundle for "${peerId}" failed signature verification — refusing to start an ` +
          `encrypted session (possible tampering / man-in-the-middle).`,
      );
    }
    const own = await keystore.getOwnMaterial();
    const ephemeral = await generateX25519KeyPair();
    const opk = peer.oneTimePrekeys[0]; // pick one if offered

    const { rootKey } = await performX3dh(own.identity.privateKey, ephemeral.privateKey, {
      identityPublicKey: peer.identityPublicKey,
      signedPreKeyPublicKey: peer.signedPrekey.publicKey,
      oneTimePreKeyPublicKey: opk?.publicKey,
    });
    const ratchet = await initializeRatchet(rootKey, "initiator");
    session = {
      ratchet,
      role: "initiator",
      pendingHandshake: { ik: own.identity.publicKey, ek: ephemeral.publicKey, opkId: opk?.id },
    };
  }

  const step = await ratchetSend(session.ratchet);
  const ct = await encryptBytes(step.messageKey, plaintext);
  const env: E2eeEnvelope = { v: E2EE_ENVELOPE_VERSION, i: step.messageIndex, ct };

  if (session.pendingHandshake && step.messageIndex === 0) {
    env.hdr = {
      ik: toBase64(session.pendingHandshake.ik),
      ek: toBase64(session.pendingHandshake.ek),
      opk: session.pendingHandshake.opkId,
    };
  }
  // Header owed only on the first message; clear it after.
  session.pendingHandshake = undefined;
  await keystore.putSession(peerId, session);
  return serializeEnvelope(env);
}

// ---- Decrypt (receive) ----

/**
 * Open an envelope from `peerId`, running X3DH (responder) on the first message
 * to derive the shared root key. Returns the inner plaintext bytes.
 */
export async function decryptFromPeer(
  keystore: MdmKeyStore,
  peerId: string,
  envelopeBytes: Uint8Array,
): Promise<Uint8Array> {
  const env = parseEnvelope(envelopeBytes);
  let session = await keystore.getSession(peerId);

  if (!session) {
    if (!env.hdr) {
      throw new Error(
        `No session with "${peerId}" and the message carries no handshake header — cannot decrypt.`,
      );
    }
    const own = await keystore.getOwnMaterial();
    let oneTimePreKeyPrivateKey: Uint8Array | undefined;
    if (env.hdr.opk !== undefined) {
      oneTimePreKeyPrivateKey = await keystore.takeOneTimePrekey(env.hdr.opk);
      if (!oneTimePreKeyPrivateKey) {
        throw new Error(
          `Handshake references one-time prekey ${env.hdr.opk} which is unknown or already consumed.`,
        );
      }
    }
    const { rootKey } = await performX3dhResponder(
      {
        identityPrivateKey: own.identity.privateKey,
        signedPreKeyPrivateKey: own.signedPrekey.pair.privateKey,
        oneTimePreKeyPrivateKey,
      },
      {
        initiatorIdentityPublicKey: fromBase64(env.hdr.ik),
        initiatorEphemeralPublicKey: fromBase64(env.hdr.ek),
        usedOneTimePreKeyId: env.hdr.opk,
      },
    );
    const ratchet = await initializeRatchet(rootKey, "responder");
    session = { ratchet, role: "responder" };
  }

  const step = await ratchetReceive(session.ratchet);
  if (step.messageIndex !== env.i) {
    throw new Error(
      `Out-of-order mDM message (expected ratchet index ${step.messageIndex}, got ${env.i}). ` +
        `Skipped-key handling is a tracked follow-up (LINEAR-2357).`,
    );
  }
  const plaintext = await decryptBytes(step.messageKey, env.ct);
  await keystore.putSession(peerId, session);
  return plaintext;
}
