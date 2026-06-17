/**
 * Voice/file blob upload helper.
 *
 * The `message-send` contract carries voice/ptt/file bodies via an
 * `attachments[]` array of `{ kind, bucket, path, mime, duration_ms, key_ref }`
 * descriptors. The actual bytes must be uploaded to Supabase Storage FIRST; the
 * message row only references them by `{ bucket, path }`.
 *
 * This module centralises that upload so every channel's voice/file/ptt tool
 * (mDM, mROOM, mIRC) produces an identical attachment descriptor.
 *
 * STATUS: scaffold. The Storage upload path below is real (supabase-js
 * `storage.from(bucket).upload`), but two things are TODO and gated on the
 * Lane A / CTO backend contract:
 *   - TODO(Lane A): confirm bucket names (`voice-blobs` for voice/ptt) and the
 *     RLS/policy that lets an agent JWT or hub-claim JWT write to them.
 *   - TODO(Lane A): mDM voice is CLIENT-ENCRYPTED — the bytes must be sealed
 *     (per-recipient, via @mosadd/crypto) before upload and `key_ref` must point
 *     at the wrapped content key. Today this helper uploads the bytes as-is and
 *     sets key_ref:null. Do NOT use for mDM voice until the seal step lands.
 */

import { getSupabase, readSupabaseEnv } from "./supabase.js";

export type AttachmentKind = "voice" | "file" | "ptt";

/** The descriptor shape `message-send` expects inside `attachments[]`. */
export interface AttachmentDescriptor {
  kind: AttachmentKind;
  bucket: string;
  path: string;
  mime: string;
  duration_ms?: number | null;
  /** Reference to the wrapped content-encryption key (E2EE channels only). */
  key_ref?: string | null;
  /** Original filename, for `kind:'file'`. */
  filename?: string | null;
  size_bytes?: number | null;
}

export interface UploadBlobArgs {
  kind: AttachmentKind;
  /** Raw bytes to upload. Caller is responsible for any E2EE sealing first. */
  bytes: Uint8Array;
  mime: string;
  /** Storage bucket. Defaults: voice/ptt → 'voice-blobs', file → 'file-blobs'. */
  bucket?: string;
  /** Sub-path prefix inside the bucket (e.g. the thread id). */
  prefix?: string;
  duration_ms?: number | null;
  filename?: string | null;
  /** Reference to the wrapped content key, when the caller pre-sealed the bytes. */
  key_ref?: string | null;
}

function defaultBucket(kind: AttachmentKind): string {
  // TODO(Lane A): confirm canonical bucket names + write policy for agent JWTs.
  return kind === "file" ? "file-blobs" : "voice-blobs";
}

function randomId(): string {
  // crypto.randomUUID is available on Node >=18 (package engines floor).
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Upload bytes to Supabase Storage and return the attachment descriptor to embed
 * in `message-send`'s `attachments[]`.
 */
export async function uploadBlob(args: UploadBlobArgs): Promise<AttachmentDescriptor> {
  readSupabaseEnv();
  const sb = getSupabase();
  const bucket = args.bucket ?? defaultBucket(args.kind);
  const ext = args.filename?.split(".").pop() ?? mimeExt(args.mime);
  const path = `${args.prefix ? args.prefix.replace(/[^a-zA-Z0-9._/-]/g, "-") + "/" : ""}${randomId()}${ext ? "." + ext : ""}`;

  const { error } = await sb.storage.from(bucket).upload(path, args.bytes, {
    contentType: args.mime,
    upsert: false,
  });
  if (error) {
    throw new Error(`blob upload to ${bucket}/${path} failed: ${error.message}`);
  }

  return {
    kind: args.kind,
    bucket,
    path,
    mime: args.mime,
    duration_ms: args.duration_ms ?? null,
    key_ref: args.key_ref ?? null,
    filename: args.filename ?? null,
    size_bytes: args.bytes.byteLength,
  };
}

function mimeExt(mime: string): string {
  const map: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
  };
  return map[mime] ?? "";
}

/**
 * Decode a base64 / data-URL string into bytes. Agents hand us audio/file
 * content as base64 (MCP is JSON-only — no binary channel), so every voice/file
 * tool funnels through this.
 */
export function decodeBase64Body(b64: string): Uint8Array {
  const cleaned = b64.includes(",") && b64.startsWith("data:") ? b64.slice(b64.indexOf(",") + 1) : b64;
  return new Uint8Array(Buffer.from(cleaned, "base64"));
}
