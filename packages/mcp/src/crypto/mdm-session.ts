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
  deriveHkdfKey,
  deriveSharedSecret,
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
  initRatchetInitiator,
  initRatchetResponder,
  ratchetEncrypt,
  ratchetDecrypt,
  type EncryptedPayload,
  type RatchetState,
  type DhRatchetState,
  type SessionRole,
} from "@mosadd/crypto";
import type { DmProvider } from "@mosadd/providers";

export const PREKEY_BUNDLE_VERSION = "mosadd.prekeys.v1" as const;
/** Legacy symmetric-ratchet envelope (no PCS). Still DECODED for back-compat. */
export const E2EE_ENVELOPE_VERSION = "mosadd.e2ee.v1" as const;
/** Double-Ratchet-with-DH envelope — post-compromise security (LINEAR-3409). New sends use this. */
export const E2EE_ENVELOPE_VERSION_V2 = "mosadd.e2ee.v2" as const;

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

/**
 * Persisted per-peer ratchet session. Plain data → trivially serializable.
 * A session is either v1 (`ratchet`, symmetric) or v2 (`ratchet2`, DH ratchet /
 * PCS). New sessions are v2; an existing v1 session keeps running v1.
 */
export interface MdmSessionRecord {
  ratchet?: RatchetState;       // v1 (legacy symmetric)
  ratchet2?: DhRatchetState;    // v2 (DH ratchet, PCS — LINEAR-3409)
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

  /**
   * OPTIONAL symmetric SELF-READ key (32 bytes), derived from the same recoverable
   * seed as the identity. Present only on seed-backed keystores. With it the sender
   * seals a copy of every outgoing DM to itself (`self_payload`, tag "s1.") that any
   * process holding the same seed can open again — the cross-process answer to the
   * "local sent-items cache only" note above. Null/absent = no self copy.
   */
  getSelfKeyBytes?(): Promise<Uint8Array | null>;
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

// ---- Seed-backed keystore: ONE stable identity, not a new one per call ----
//
// ⛔ WHY (measured 27.09.2026, LINEAR-6089 follow-up): the hosted gateway builds a fresh
// McpServer per HTTP request, so the default InMemoryMdmKeyStore minted a BRAND-NEW random
// identity for every single mDM_send. Every envelope carried an X3DH header from an identity
// that existed for one request and was never published — the sender could never read its own
// message again (no self_payload, no key), and the recipient's recoverable copy could not be
// written (it needs the sender's PUBLISHED identity). The app (mosADD f95557f) now says WHY such
// a bubble is unreadable; this is the source fix, so new messages are born readable.
//
// The fix mirrors the web client exactly (apps/web/src/lib/mdmKeyStore.ts, LINEAR-3521 P2): the
// whole identity is derived by HKDF from ONE recoverable 32-byte seed, with the SAME labels, zero
// one-time prekeys and signed-prekey id 1 — so the bundle is byte-identical on every process that
// knows the seed. The web takes its seed from the login secret; an MCP runtime has no password,
// its login secret IS the API key (`mosadd_sk_live_…`) — see deriveMdmSeedFromSecret below.

/** X25519 base point (u = 9, little-endian). X25519(k, 9) is exactly k's public key. */
const X25519_BASE_POINT = (() => {
  const b = new Uint8Array(32);
  b[0] = 9;
  return b;
})();

/**
 * Deterministic X25519 pair from a 32-byte seed (the seed IS the private scalar — same
 * convention as the web's x25519KeyPairFromSeed). The published @mosadd/crypto has no
 * seed constructor, so the public half is computed as X25519(seed, basepoint), which is the
 * definition of the public key (the curve library clamps the scalar in both paths).
 */
async function x25519PairFromSeed(seed: Uint8Array): Promise<X25519Pair> {
  const privateKey = seed.length === 32 ? seed : seed.slice(0, 32);
  const publicKey = await deriveSharedSecret(privateKey, X25519_BASE_POINT);
  return { privateKey, publicKey };
}

const utf8 = new TextEncoder();

async function subSeed(seed: Uint8Array, label: string): Promise<Uint8Array> {
  return deriveHkdfKey(seed, { info: utf8.encode(label), length: 32 });
}

/** Same derivation, same labels as the web's deriveOwnMaterialFromSeed — keep them in lockstep. */
export async function deriveOwnMaterialFromSeed(seed: Uint8Array): Promise<OwnPrekeyMaterial> {
  const [idSeed, signSeed, spkSeed] = await Promise.all([
    subSeed(seed, "mosadd-mdm-identity-x25519"),
    subSeed(seed, "mosadd-mdm-signing-ed25519"),
    subSeed(seed, "mosadd-mdm-signed-prekey-x25519"),
  ]);
  return {
    identity: await x25519PairFromSeed(idSeed),
    signingIdentity: await generateEd25519KeyPair(signSeed),
    signedPrekey: { id: 1, pair: await x25519PairFromSeed(spkSeed) },
    oneTimePrekeys: [],
  };
}

/**
 * The recoverable 32-byte seed of an MCP runtime, from its login secret (the API key).
 * Same key → same identity on every gateway instance, every call, every restart. A rotated
 * key is a new login secret and therefore a new identity — exactly like a changed PIN on web.
 * Not escrow: nothing here is stored; whoever holds the key could already act as the account.
 */
export async function deriveMdmSeedFromSecret(secret: string): Promise<Uint8Array> {
  return deriveHkdfKey(utf8.encode(secret), {
    salt: utf8.encode("mosadd-mcp-api-key"),
    info: utf8.encode("mosadd-mdm-identity-seed"),
    length: 32,
  });
}

/**
 * Keystore anchored to a recoverable seed. Identity, signing key and signed prekey are
 * derived (stable); ratchet sessions and the sent cache stay in memory for this process.
 * No one-time prekeys: a stateless process could never remember which ones were consumed.
 */
export class SeededMdmKeyStore implements MdmKeyStore {
  private material: Promise<OwnPrekeyMaterial> | null = null;
  private readonly sessions = new Map<string, MdmSessionRecord>();
  private readonly sentMessages = new Map<string, Uint8Array>();

  constructor(private readonly seed: Uint8Array) {
    if (!seed || seed.length < 32) throw new Error("SeededMdmKeyStore needs a 32-byte seed");
  }

  static async fromSecret(secret: string): Promise<SeededMdmKeyStore> {
    return new SeededMdmKeyStore(await deriveMdmSeedFromSecret(secret));
  }

  getOwnMaterial(): Promise<OwnPrekeyMaterial> {
    if (!this.material) this.material = deriveOwnMaterialFromSeed(this.seed);
    return this.material;
  }

  async takeOneTimePrekey(_id: number): Promise<Uint8Array | undefined> {
    return undefined; // the seeded bundle publishes none
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

  /** Same label as the web's getSelfKeyBytes ("mosadd-mdm-self-read"). */
  async getSelfKeyBytes(): Promise<Uint8Array | null> {
    return deriveHkdfKey(this.seed, { info: utf8.encode("mosadd-mdm-self-read"), length: 32 });
  }
}

/**
 * A keystore that derives its seed lazily from a secret — lets a synchronous factory
 * (defaultProviders) hand out a stable-identity keystore without awaiting HKDF up front.
 */
export class SecretMdmKeyStore implements MdmKeyStore {
  private inner: Promise<SeededMdmKeyStore> | null = null;
  constructor(private readonly secret: string) {}
  private store(): Promise<SeededMdmKeyStore> {
    if (!this.inner) this.inner = SeededMdmKeyStore.fromSecret(this.secret);
    return this.inner;
  }
  async getOwnMaterial() { return (await this.store()).getOwnMaterial(); }
  async takeOneTimePrekey(id: number) { return (await this.store()).takeOneTimePrekey(id); }
  async getSession(peerId: string) { return (await this.store()).getSession(peerId); }
  async putSession(peerId: string, record: MdmSessionRecord) { return (await this.store()).putSession(peerId, record); }
  async putSentMessage(messageId: string, plaintext: Uint8Array) { return (await this.store()).putSentMessage(messageId, plaintext); }
  async getSentMessage(messageId: string) { return (await this.store()).getSentMessage(messageId); }
  async getSelfKeyBytes() { return (await this.store()).getSelfKeyBytes(); }
}

// ---- Recoverable copies: the web's wire format, byte for byte ----
//
// Two opaque AES-GCM strings ride next to the ratchet envelope in `messages`:
//   self_payload           "s1." + b64(iv‖ct)  — sealed to the SENDER's self-read key
//   recipient_self_payload "r1." + b64(iv‖ct)  — sealed to HKDF(ECDH(sender IK, recipient IK))
// Formats, tags and HKDF labels are copied from apps/web/src/lib/mdmE2ee.ts (sealForSelf /
// sealForPeerRecoverable) — the app opens exactly these. The server never reads them.

const SELF_TAG = "s1.";
const PEER_RECOVERABLE_TAG = "r1.";
const PEER_RECOVERABLE_INFO = "mosadd.mdm.recipient-recoverable.v1";

async function aesGcmSeal(tag: string, keyBytes: Uint8Array, plaintext: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext as BufferSource));
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv, 0);
  packed.set(ct, iv.length);
  return tag + toBase64(packed);
}

async function aesGcmOpen(tag: string, keyBytes: Uint8Array, sealed: string): Promise<Uint8Array | null> {
  if (!sealed.startsWith(tag)) return null;
  const packed = fromBase64(sealed.slice(tag.length));
  if (packed.length <= 12) return null;
  const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "AES-GCM" }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, key, packed.slice(12));
  return new Uint8Array(pt);
}

/** Sender's own copy ("s1."). Null when the keystore has no seed. Never throws. */
export async function sealForSelf(keystore: MdmKeyStore, plaintext: Uint8Array): Promise<string | null> {
  try {
    const keyBytes = (await keystore.getSelfKeyBytes?.()) ?? null;
    if (!keyBytes) return null;
    return await aesGcmSeal(SELF_TAG, keyBytes, plaintext);
  } catch {
    return null;
  }
}

/** Open an "s1." copy with this keystore's self-read key. Null when absent/foreign. Never throws. */
export async function openSelfSealed(keystore: MdmKeyStore, sealed: string | null | undefined): Promise<Uint8Array | null> {
  try {
    if (!sealed) return null;
    const keyBytes = (await keystore.getSelfKeyBytes?.()) ?? null;
    if (!keyBytes) return null;
    return await aesGcmOpen(SELF_TAG, keyBytes, sealed);
  } catch {
    return null;
  }
}

async function pairKey(keystore: MdmKeyStore, otherIdentityPublicKey: Uint8Array): Promise<Uint8Array> {
  const own = await keystore.getOwnMaterial();
  const secret = await deriveSharedSecret(own.identity.privateKey, otherIdentityPublicKey);
  return deriveHkdfKey(secret, { info: utf8.encode(PEER_RECOVERABLE_INFO), length: 32 });
}

/** Recipient-openable copy ("r1.") for a VERIFIED peer bundle. Never throws. */
export async function sealForPeerRecoverable(
  keystore: MdmKeyStore,
  peer: PublicPrekeyBundle,
  plaintext: Uint8Array,
): Promise<string | null> {
  try {
    return await aesGcmSeal(PEER_RECOVERABLE_TAG, await pairKey(keystore, peer.identityPublicKey), plaintext);
  } catch {
    return null;
  }
}

/** Open an "r1." copy written by the peer whose VERIFIED bundle is given. Never throws. */
export async function openPeerRecoverable(
  keystore: MdmKeyStore,
  sender: PublicPrekeyBundle,
  sealed: string | null | undefined,
): Promise<Uint8Array | null> {
  try {
    if (!sealed) return null;
    return await aesGcmOpen(PEER_RECOVERABLE_TAG, await pairKey(keystore, sender.identityPublicKey), sealed);
  } catch {
    return null;
  }
}

/** Fetch + parse + signature-check a peer bundle. Null when absent or failing verification. */
export async function fetchVerifiedBundle(dm: DmProvider, peerId: string): Promise<PublicPrekeyBundle | null> {
  const raw = await dm.fetchPrekeyBundle(peerId);
  if (!raw) return null;
  const parsed = parsePublicBundle(raw);
  return verifyPublicBundle(parsed) ? parsed : null;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

export type OwnBundleState =
  /** the directory already holds exactly our identity */
  | "consistent"
  /** the directory had no bundle (or we own the identity) and now holds ours */
  | "published"
  /** someone else's key material is published for this identity and we must not replace it */
  | "foreign";

/**
 * Make the key directory agree with this keystore's identity — WITHOUT hijacking a human's keys.
 *
 * - directory == ours            → "consistent" (no write).
 * - directory empty              → publish ours → "published".
 * - directory differs, we OWN it → publish ours → "published". An AGENT line's identity has no
 *   other runtime than its key; a stale bundle there is dead material from an old random run.
 * - directory differs, human     → "foreign". A person's bundle is anchored to their login
 *   secret in the app; overwriting it from an agent key would break every DM to that person.
 *   The ratchet envelope still works (it carries its own handshake); only the recipient's
 *   recoverable copy is skipped, because it would be sealed under the wrong identity.
 */
export async function ensureOwnBundlePublished(
  keystore: MdmKeyStore,
  dm: DmProvider,
  selfId: string,
  opts: { mayReplaceForeign: boolean },
): Promise<OwnBundleState> {
  const own = await keystore.getOwnMaterial();
  const raw = await dm.fetchPrekeyBundle(selfId);
  if (raw) {
    let published: PublicPrekeyBundle | null = null;
    try { published = parsePublicBundle(raw); } catch { published = null; }
    if (
      published &&
      sameBytes(published.identityPublicKey, own.identity.publicKey) &&
      sameBytes(published.signingIdentityPublicKey, own.signingIdentity.publicKey) &&
      sameBytes(published.signedPrekey.publicKey, own.signedPrekey.pair.publicKey)
    ) {
      return "consistent";
    }
    if (!opts.mayReplaceForeign) return "foreign";
  }
  await dm.publishPrekeyBundle(serializePublicBundle(own));
  return "published";
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

/** v2 envelope: carries the DH ratchet header (dh/pn/n) instead of a flat index. */
interface E2eeEnvelopeV2 {
  v: typeof E2EE_ENVELOPE_VERSION_V2;
  hdr?: { ik: string; ek: string; opk?: number };
  dh: string;   // base64 ratchet public key
  pn: number;
  n: number;
  ct: EncryptedPayload;
}

/** Quick check whether on-wire bytes are an mDM E2EE envelope (v1 or v2). */
export function isE2eeEnvelope(bytes: Uint8Array): boolean {
  try {
    const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (!obj?.ct) return false;
    if (obj.v === E2EE_ENVELOPE_VERSION) return typeof obj.i === "number";
    if (obj.v === E2EE_ENVELOPE_VERSION_V2) return typeof obj.dh === "string" && typeof obj.n === "number";
    return false;
  } catch {
    return false;
  }
}

/** Read the envelope version without validating the rest. */
function peekEnvelopeVersion(bytes: Uint8Array): string | undefined {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"))?.v;
  } catch {
    return undefined;
  }
}

function serializeEnvelope(env: E2eeEnvelope | E2eeEnvelopeV2): Uint8Array {
  return new Uint8Array(Buffer.from(JSON.stringify(env), "utf8"));
}

function parseEnvelope(bytes: Uint8Array): E2eeEnvelope {
  const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (obj?.v !== E2EE_ENVELOPE_VERSION) throw new Error(`Unsupported mDM envelope version: ${obj?.v}`);
  return obj as E2eeEnvelope;
}

function parseEnvelopeV2(bytes: Uint8Array): E2eeEnvelopeV2 {
  const obj = JSON.parse(Buffer.from(bytes).toString("utf8"));
  if (obj?.v !== E2EE_ENVELOPE_VERSION_V2) throw new Error(`Unsupported mDM envelope version: ${obj?.v}`);
  return obj as E2eeEnvelopeV2;
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
    // New sessions use the DH ratchet (v2 / PCS). The initial remote ratchet key
    // is the peer's signed prekey (the X3DH→DR handoff). LINEAR-3409.
    const ratchet2 = await initRatchetInitiator(rootKey, peer.signedPrekey.publicKey);
    session = {
      ratchet2,
      role: "initiator",
      pendingHandshake: { ik: own.identity.publicKey, ek: ephemeral.publicKey, opkId: opk?.id },
    };
  }

  // v2 (DH ratchet) path for new + v2 sessions.
  if (session.ratchet2) {
    const { header, ct } = await ratchetEncrypt(session.ratchet2, plaintext);
    const env: E2eeEnvelopeV2 = {
      v: E2EE_ENVELOPE_VERSION_V2,
      dh: toBase64(header.dh),
      pn: header.pn,
      n: header.n,
      ct,
    };
    if (session.pendingHandshake) {
      env.hdr = {
        ik: toBase64(session.pendingHandshake.ik),
        ek: toBase64(session.pendingHandshake.ek),
        opk: session.pendingHandshake.opkId,
      };
      session.pendingHandshake = undefined;
    }
    await keystore.putSession(peerId, session);
    return serializeEnvelope(env);
  }

  // v1 (legacy symmetric) path — only for a session already established as v1.
  const step = await ratchetSend(session.ratchet!);
  const ct = await encryptBytes(step.messageKey, plaintext);
  const env: E2eeEnvelope = { v: E2EE_ENVELOPE_VERSION, i: step.messageIndex, ct };
  if (session.pendingHandshake && step.messageIndex === 0) {
    env.hdr = {
      ik: toBase64(session.pendingHandshake.ik),
      ek: toBase64(session.pendingHandshake.ek),
      opk: session.pendingHandshake.opkId,
    };
  }
  session.pendingHandshake = undefined;
  await keystore.putSession(peerId, session);
  return serializeEnvelope(env);
}

// ---- Decrypt (receive) ----

/**
 * Open an envelope from `peerId`, running X3DH (responder) on the first message
 * to derive the shared root key. Returns the inner plaintext bytes.
 */
/** Run X3DH (responder side) from a first-contact handshake header → shared root key. */
async function responderRootKey(
  keystore: MdmKeyStore,
  hdr: { ik: string; ek: string; opk?: number },
): Promise<Uint8Array> {
  const own = await keystore.getOwnMaterial();
  let oneTimePreKeyPrivateKey: Uint8Array | undefined;
  if (hdr.opk !== undefined) {
    oneTimePreKeyPrivateKey = await keystore.takeOneTimePrekey(hdr.opk);
    if (!oneTimePreKeyPrivateKey) {
      throw new Error(`Handshake references one-time prekey ${hdr.opk} which is unknown or already consumed.`);
    }
  }
  const { rootKey } = await performX3dhResponder(
    {
      identityPrivateKey: own.identity.privateKey,
      signedPreKeyPrivateKey: own.signedPrekey.pair.privateKey,
      oneTimePreKeyPrivateKey,
    },
    {
      initiatorIdentityPublicKey: fromBase64(hdr.ik),
      initiatorEphemeralPublicKey: fromBase64(hdr.ek),
      usedOneTimePreKeyId: hdr.opk,
    },
  );
  return rootKey;
}

export async function decryptFromPeer(
  keystore: MdmKeyStore,
  peerId: string,
  envelopeBytes: Uint8Array,
): Promise<Uint8Array> {
  // v2 (DH ratchet / PCS) — LINEAR-3409.
  if (peekEnvelopeVersion(envelopeBytes) === E2EE_ENVELOPE_VERSION_V2) {
    const env = parseEnvelopeV2(envelopeBytes);
    let session = await keystore.getSession(peerId);
    if (!session) {
      if (!env.hdr) {
        throw new Error(`No session with "${peerId}" and the message carries no handshake header — cannot decrypt.`);
      }
      const rootKey = await responderRootKey(keystore, env.hdr);
      const own = await keystore.getOwnMaterial();
      const ratchet2 = await initRatchetResponder(rootKey, {
        publicKey: own.signedPrekey.pair.publicKey,
        privateKey: own.signedPrekey.pair.privateKey,
      });
      session = { ratchet2, role: "responder" };
    }
    if (!session.ratchet2) {
      throw new Error(`Received a v2 mDM envelope but the session with "${peerId}" is v1 — refusing to mix ratchets.`);
    }
    const plaintext = await ratchetDecrypt(
      session.ratchet2,
      { dh: fromBase64(env.dh), pn: env.pn, n: env.n },
      env.ct,
    );
    await keystore.putSession(peerId, session);
    return plaintext;
  }

  // v1 (legacy symmetric) — back-compat decode.
  const env = parseEnvelope(envelopeBytes);
  let session = await keystore.getSession(peerId);
  if (!session) {
    if (!env.hdr) {
      throw new Error(`No session with "${peerId}" and the message carries no handshake header — cannot decrypt.`);
    }
    const rootKey = await responderRootKey(keystore, env.hdr);
    const ratchet = await initializeRatchet(rootKey, "responder");
    session = { ratchet, role: "responder" };
  }
  if (!session.ratchet) {
    throw new Error(`Received a v1 mDM envelope but the session with "${peerId}" is v2 — refusing to mix ratchets.`);
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
