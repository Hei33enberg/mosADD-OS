/**
 * channel-payload — stored channel/room payload (base64) → the text a reader should see.
 *
 * Plaintext for agent lines since 29.09 (owner decision 28.09: no encryption on agent-line conversations,
 * in any channel or identity). #adm and #command are OPEN channels with no group key,
 * yet every line reading them through this gateway saw the King's posts as "<ciphertext>". Nothing
 * was encrypted: the app stores channel text as plain UTF-8 in base64 (apps/web ircApi.ts
 * `encodePayload`), while the old decoder here understood ONLY a JSON `mosadd.chat.v1` envelope
 * and stamped everything else "<ciphertext>". Measured 28.09–29.09 on #adm (f159c8d7, 776b3e9a).
 *
 * Rule now (same as mdm.ts `unpackPayload` and the mKEEPER bridge `decodePayload.mjs`):
 *   - JSON envelope with `text`                 → that text (toolkit posts, unchanged)
 *   - sealed envelope a reader cannot open:
 *       group-key seal {iv, ciphertext, hmac?}  → "<ciphertext>"
 *       mDM ratchet envelope v: "mosadd.e2ee.*" → "<ciphertext>"
 *   - any other JSON (e.g. voice {audio, mime, dur}) → raw JSON, so `formatVoiceIfAny` can shape it
 *   - plain UTF-8 text                          → the text itself (what the app wrote)
 *   - bytes that are not UTF-8 / carry control characters → "<ciphertext>" (opaque, not words)
 *
 * Never throws.
 */

export const CIPHERTEXT_MARKER = "<ciphertext>";

const STRICT_BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
// C0 controls except TAB / LF / CR, plus DEL: a "text" that carries them is bytes, not words.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** A sealed envelope nobody without the key can read (group-key seal or mDM ratchet). */
export function isSealedEnvelope(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.iv === "string" && typeof o.ciphertext === "string") return true;
  if (typeof o.v === "string" && o.v.startsWith("mosadd.e2ee")) return true;
  return false;
}

/** Stored payload (base64 of UTF-8, as message-list returns it) → readable text. */
export function decodeStoredPayloadText(payload: string | null | undefined): string {
  if (typeof payload !== "string" || payload.length === 0) return "";

  let raw: string;
  const compact = payload.replace(/\s+/g, "");
  if (compact.length % 4 === 0 && STRICT_BASE64.test(compact)) {
    try {
      raw = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(compact, "base64"));
    } catch {
      return CIPHERTEXT_MARKER; // opaque bytes, not UTF-8
    }
  } else {
    raw = payload; // a row stored as raw text, not base64
  }

  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw) as unknown;
      if (isSealedEnvelope(obj)) return CIPHERTEXT_MARKER;
      const text = (obj as { text?: unknown } | null)?.text;
      if (typeof text === "string") return text;
      return raw;
    } catch {
      /* plain text that happens to start with "{" */
    }
  }

  if (CONTROL_CHARS.test(raw)) return CIPHERTEXT_MARKER;
  return raw;
}
