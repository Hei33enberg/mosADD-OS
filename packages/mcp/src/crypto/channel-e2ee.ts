/**
 * Channel E2EE for MCP toolkit LINES (F4 / LINEAR-5934).
 *
 * The mosadd.com app encrypts text on password/private channels with a per-channel
 * group key (AES-256-GCM + HMAC-SHA256), wrapped for each member to the member's
 * X25519 identity key published as `identities.signed_prekey_pub`. Until now the
 * toolkit could not join that scheme: it held no identity key at all, so an agent
 * line saw every encrypted channel as "<ciphertext>" and its own posts landed
 * server-readable (unreadable by the app).
 *
 * This module gives a LINE the same parity:
 *   1. ensureLineChannelKey() — resolves the key's identity (identities.user_id),
 *      provisions a PERSISTENT X25519 keypair in `mosadd_channel_line_keys` (RLS: only the
 *      line's own auth user) and publishes the public half to
 *      identities.signed_prekey_pub, so app-side invites wrap the group key to it.
 *      Provisioning is REFUSED for human identities — their X25519 key is derived
 *      on-device from the vault master key and must never be shadowed.
 *   2. getGroupKey(channelId) — reads the line's own `channel_keys` row (newest
 *      key_version), unwraps the group key (X25519 + HKDF "m0ssad-group-wrap"),
 *      caches it per process.
 *   3. encryptChannelPayload / decryptChannelPayload — byte-compatible with the
 *      app (useChannelCrypto): ciphertext JSON {iv, ciphertext, hmac} with
 *      HMAC-SHA256 over the base64 ciphertext STRING, whole envelope base64.
 *
 * FAIL-SOFT: every entry point returns null on any error (no identity, no wrapped
 * key, bad HMAC, wrong key) instead of throwing, so callers fall back to the
 * legacy server-readable path exactly as before. The scheme only upgrades a
 * channel the line actually holds a group key for.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  decryptText,
  encryptText,
  exportX25519KeyPair,
  fromBase64,
  generateX25519KeyPair,
  toBase64,
  unwrapGroupKey,
  type WrappedGroupKey,
} from "@mosadd/crypto";
import { getSupabase, readSupabaseEnv } from "../providers/supabase.js";

interface LineChannelKey {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

// ---- Pure core (unit-tested) ----

/** HMAC-SHA256 over the base64 ciphertext string, exactly like the app (2C). */
export function signCiphertext(groupKey: Uint8Array, ciphertextB64: string): string {
  return createHmac("sha256", Buffer.from(groupKey)).update(ciphertextB64, "utf8").digest("base64");
}

/** AES-256-GCM encrypt + HMAC + JSON envelope + base64 (the stored payload). */
export async function encryptWithGroupKey(groupKey: Uint8Array, plaintext: string): Promise<string> {
  const encrypted = await encryptText(groupKey, plaintext);
  const hmac = signCiphertext(groupKey, encrypted.ciphertext);
  return Buffer.from(JSON.stringify({ ...encrypted, hmac }), "utf8").toString("base64");
}

/**
 * Base64 envelope → HMAC check (tamper = null) → AES-GCM decrypt.
 * Returns null for anything that is not a valid, untampered group-key payload.
 */
export async function decryptWithGroupKey(groupKey: Uint8Array, payloadB64: string): Promise<string | null> {
  try {
    const decoded = Buffer.from(payloadB64, "base64").toString("utf8");
    if (!decoded.startsWith("{")) return null;
    const parsed = JSON.parse(decoded) as { iv?: string; ciphertext?: string; hmac?: string };
    if (!parsed.iv || !parsed.ciphertext) return null;
    if (parsed.hmac) {
      const expected = createHmac("sha256", Buffer.from(groupKey)).update(parsed.ciphertext, "utf8").digest();
      const got = Buffer.from(parsed.hmac, "base64");
      if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    }
    return await decryptText(groupKey, { iv: parsed.iv, ciphertext: parsed.ciphertext });
  } catch {
    return null;
  }
}

/** Unwrap a `mosadd.chat.v1` envelope produced by toolkit posts; leave app-sent raw text. */
export function unwrapEnvelopeText(plain: string): string {
  if (plain.length > 2 && plain.startsWith("{") && plain.endsWith("}") && plain.includes("mosadd.chat")) {
    try {
      const env = JSON.parse(plain) as { v?: string; type?: string; text?: string };
      if (typeof env.text === "string" && env.v === "mosadd.chat.v1" && (env.type === "text" || env.type === undefined)) {
        return env.text;
      }
    } catch {
      /* not an envelope */
    }
  }
  return plain;
}

// ---- Supabase glue (per-process caches) ----

let cachedIdentity: { id: string; kind: string | null } | null = null;
let cachedLineKey: LineChannelKey | null = null;
let provisioning: Promise<LineChannelKey | null> | null = null;
const groupKeyCache = new Map<string, Uint8Array>();

/** Resolve the identity behind the current Supabase session (per process). */
async function resolveIdentity(): Promise<{ id: string; kind: string | null } | null> {
  if (cachedIdentity) return cachedIdentity;
  try {
    readSupabaseEnv();
    const sb = getSupabase();
    const { data: u, error: ue } = await sb.auth.getUser();
    if (ue || !u?.user) return null;
    const { data: identity, error } = await sb
      .from("identities")
      .select("id, kind")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error || !identity?.id) return null;
    cachedIdentity = { id: identity.id as string, kind: (identity.kind as string | null) ?? null };
    return cachedIdentity;
  } catch {
    return null;
  }
}

/**
 * Keep identities.signed_prekey_pub == the line's public key. Idempotent and
 * silent-failing: a stale SPK only degrades NEW invites (they would wrap to the
 * old key), so never throw here — the line key still works for existing rows.
 */
async function syncPublishedKey(identityId: string, publicKeyB64: string): Promise<void> {
  try {
    const sb = getSupabase();
    const { data: row } = await sb
      .from("identities")
      .select("signed_prekey_pub")
      .eq("id", identityId)
      .maybeSingle();
    if (row?.signed_prekey_pub === publicKeyB64) return;
    const { error } = await sb.from("identities").update({ signed_prekey_pub: publicKeyB64 }).eq("id", identityId);
    if (error) {
      // Surface the RLS/GRANT truth once per process instead of dying silently —
      // agents must know WHY a future invite would wrap to the wrong key.
      cachedIdentity = null;
    }
  } catch {
    /* never throw from a sync helper */
  }
}

/**
 * Get-or-provision the line's persistent channel keypair. Publishes the public
 * half to identities.signed_prekey_pub so app-side invites wrap the group key to
 * it. Returns null (never throws) for human identities or on any failure.
 */
export async function ensureLineChannelKey(): Promise<LineChannelKey | null> {
  if (cachedLineKey) return cachedLineKey;
  if (provisioning) return provisioning;
  provisioning = (async (): Promise<LineChannelKey | null> => {
    try {
      const identity = await resolveIdentity();
      if (!identity) return null;
      // ⛔ Only agent/robot lines: a human identity's X25519 key is vault-derived
      // on-device; publishing a server-generated key here would hijack its
      // signed_prekey_pub and break the app's own decrypt (F4 design decision).
      if (identity.kind !== "agent" && identity.kind !== "robot") return null;

      const sb = getSupabase();
      const { data: row, error: readErr } = await sb
        .from("mosadd_channel_line_keys")
        .select("public_key, private_key")
        .eq("identity_id", identity.id)
        .maybeSingle();
      if (readErr) return null;

      if (row?.private_key) {
        const key: LineChannelKey = { publicKey: fromBase64(row.public_key), privateKey: fromBase64(row.private_key) };
        await syncPublishedKey(identity.id, row.public_key);
        cachedLineKey = key;
        return key;
      }

      // Fresh keypair. Race (two cold processes): PK conflict → ignoreDuplicates,
      // then re-read the winner so both processes converge on ONE keypair.
      const pair = await generateX25519KeyPair();
      const exported = await exportX25519KeyPair(pair);
      const { data: u } = await sb.auth.getUser();
      const userId = u?.user?.id;
      if (!userId) return null;
      await sb
        .from("mosadd_channel_line_keys")
        .upsert(
          { identity_id: identity.id, user_id: userId, public_key: exported.publicKey, private_key: exported.privateKey, key_version: 1 },
          { onConflict: "identity_id", ignoreDuplicates: true },
        );
      const { data: winner, error: winnerErr } = await sb
        .from("mosadd_channel_line_keys")
        .select("public_key, private_key")
        .eq("identity_id", identity.id)
        .maybeSingle();
      if (winnerErr || !winner?.private_key) return null;

      // Publish the public half — the app wraps group keys for new members to this.
      await syncPublishedKey(identity.id, winner.public_key);

      const key: LineChannelKey = { publicKey: fromBase64(winner.public_key), privateKey: fromBase64(winner.private_key) };
      cachedLineKey = key;
      return key;
    } catch {
      return null;
    }
  })();
  try {
    return await provisioning;
  } finally {
    provisioning = null;
  }
}

/**
 * Unwrap this channel's group key for the line (newest key_version), cached per
 * process. Returns null when the line has no key material or no wrapped row —
 * callers then use the legacy plaintext path.
 */
export async function getGroupKey(channelId: string): Promise<Uint8Array | null> {
  const cached = groupKeyCache.get(channelId);
  if (cached) return cached;
  try {
    const lineKey = await ensureLineChannelKey();
    if (!lineKey) return null;
    const identity = await resolveIdentity();
    if (!identity) return null;
    const sb = getSupabase();
    const { data: row, error } = await sb
      .from("channel_keys")
      .select("wrapped_group_key")
      .eq("channel_id", channelId)
      .eq("identity_id", identity.id)
      .order("key_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !row?.wrapped_group_key) return null;
    const wrapped = JSON.parse(row.wrapped_group_key) as WrappedGroupKey;
    const groupKey = await unwrapGroupKey(wrapped, lineKey.privateKey);
    groupKeyCache.set(channelId, groupKey);
    return groupKey;
  } catch {
    return null;
  }
}

/**
 * Encrypt text for a channel with a group key. Returns null (no encryption —
 * caller uses legacy plaintext) when the line holds no group key for it.
 */
export async function encryptChannelPayload(channelId: string, plaintext: string): Promise<string | null> {
  const groupKey = await getGroupKey(channelId);
  if (!groupKey) return null;
  try {
    return await encryptWithGroupKey(groupKey, plaintext);
  } catch {
    return null;
  }
}

/**
 * Decrypt a stored payload for a channel. Returns null when the payload is not
 * group-key encrypted, tampered, or the line holds no key for the channel.
 */
export async function decryptChannelPayload(channelId: string, payloadB64: string): Promise<string | null> {
  const groupKey = await getGroupKey(channelId);
  if (!groupKey) return null;
  return decryptWithGroupKey(groupKey, payloadB64);
}

/** Exposed for tests: reset the per-process caches. */
export function resetChannelE2eeCaches(): void {
  cachedIdentity = null;
  cachedLineKey = null;
  groupKeyCache.clear();
}

/** Exposed for tests/ops: the line's published public key (base64), or null. */
export async function lineChannelPublicKey(): Promise<string | null> {
  const lineKey = await ensureLineChannelKey();
  return lineKey ? toBase64(lineKey.publicKey) : null;
}
