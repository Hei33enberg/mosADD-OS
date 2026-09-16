/**
 * Voice/file blob upload helper.
 *
 * The `message-send` contract carries voice/ptt/file bodies via an
 * `attachments[]` array of `{ kind, bucket, path, mime, duration_ms, key_ref }`
 * descriptors. The actual bytes must be uploaded to Supabase Storage FIRST; the
 * message row only references them by `{ bucket, path }`.
 *
 * This module centralises that upload so every channel's voice/file/ptt tool
 * (mDM, mIRC) produces an identical attachment descriptor.
 *
 * STATUS: scaffold. The Storage upload path below is real (supabase-js
 * `storage.from(bucket).upload`), but two things are TODO and gated on the
 * Lane A / CTO backend contract:
 *   - DONE 2026-09-16: bucket names + write policy CONFIRMED against the live
 *     project (see defaultBucket()/ownerFolder()). The old defaults
 *     ('file-blobs', 'voice-blobs') did not exist in the project, so EVERY
 *     file/voice send from MCP died with `Bucket not found` — reproduced on
 *     mDM_send_file, mIRC_send_file and mDM_send_voice before the fix.
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
  // ⛔ TYLKO BUCKETY, KTÓRE ISTNIEJĄ I PRZYJMĄ TEN JWT (potwierdzone na żywym
  // projekcie rooffhgbxafyjcwmwpsy, 16.09):
  //   chat-files     → bucket istnieje (limit 100 MB). INSERT policy
  //                    "Users upload chat files": (storage.foldername(name))[1] = auth.uid()
  //                    SELECT policy dopuszcza też członka wątku: is_thread_member(auth.uid(), foldername[2])
  //   voice-messages → bucket istnieje. INSERT policy
  //                    "Users can upload voice messages": foldername(name)[1] = auth.uid()
  // Poprzednie domyślne ('file-blobs' dla file, 'voice-blobs' dla voice/ptt) NIE
  // ISTNIEJĄ w projekcie — stąd "Bucket not found" na mDM_send_file, mIRC_send_file
  // i mDM_send_voice. Nazwy są tu jednym źródłem prawdy: gdy bucket zniknie,
  // zawodzi JAWNIE, a nie po cichu ląduje w innym miejscu.
  return kind === "file" ? "chat-files" : "voice-messages";
}

/** `sub` z JWT tej sesji, czyli `auth.uid()` — PIERWSZY segment ścieżki.
 *
 * ⛔ NIE OZDOBA I NIE OPCJA. Jedyny segment, który sprawdzają polityki INSERT obu
 * bucketów: `(storage.foldername(name))[1] = auth.uid()`. Ścieżka bez segmentu
 * użytkownika (`<thread>/<uuid>.ext`, jak było) przechodzi upload do momentu,
 * w którym baza odrzuca wiersz — czyli wysyłka pliku jest ZAWSZE martwa, i to
 * komunikatem, który nie mówi dlaczego. Ta sama konwencja co w aplikacji:
 * `apps/web/src/lib/ircApi.ts: uploadChatFile()` → `<user.id>/<thread>/<ts>_<nazwa>`.
 */
function jwtSub(jwt: string): string | null {
  const part = jwt.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json?.sub === "string" && json.sub ? json.sub : null;
  } catch {
    return null;
  }
}

function ownerFolder(userJwt: string | undefined): string {
  const sub = userJwt ? jwtSub(userJwt) : null;
  if (!sub) {
    throw new Error(
      "blob upload refused: no user id in the session JWT — bucket policy requires foldername[1] = auth.uid(); run `mosadd login` (or set MOSADD_USER_JWT) and retry",
    );
  }
  return sub;
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
  const env = readSupabaseEnv();
  const sb = getSupabase();
  const bucket = args.bucket ?? defaultBucket(args.kind);
  const ext = args.filename?.split(".").pop() ?? mimeExt(args.mime);
  // ⛔ KOLEJNOŚĆ SEGMENTÓW JEST CZĘŚCIĄ KONTRAKTU Z POLITYKĄ: <auth.uid()>/<wątek>/<uuid>.<ext>.
  const folder = args.prefix ? args.prefix.replace(/[^a-zA-Z0-9._/-]/g, "-").replace(/^\/+|\/+$/g, "") : "";
  const path = [ownerFolder(env.userJwt), folder, `${randomId()}${ext ? "." + ext : ""}`]
    .filter(Boolean).join("/");

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
