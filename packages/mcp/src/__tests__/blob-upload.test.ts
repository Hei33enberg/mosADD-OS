/**
 * LANA PLIKOW — ŻYWA, NIE DOPISANA Z PAMIĘCI (16.09).
 *
 * Zmierzone PRZED poprawką, na żywym MCP (mcp.mosadd.com), 1 KB text/plain:
 *   mDM_send_file  → "blob upload to file-blobs/dm-…/….txt failed: Bucket not found"
 *   mDM_send_voice → "blob upload to voice-blobs/dm-…/….webm failed: Bucket not found"
 * Buckety `file-blobs` i `voice-blobs` NIE ISTNIEJĄ w projekcie — lista bucketów
 * (16.09) to: secure_vault, brand_assets, chat-files, gemstone-models, voice-messages,
 * chat-attachments, odyssey-media, raydio-media, voice-samples, mayl-attachments,
 * rag-uploads, ptt-recordings, avatars, downloads, orb-media, founder-archive, krol-wrzutki.
 *
 * Dwa zamki, każdy pilnuje jednej połowy kontraktu z polityką RLS:
 *   1. bucket, który istnieje I przyjmie ten JWT (chat-files / voice-messages);
 *   2. ścieżka z `auth.uid()` jako PIERWSZYM segmentem, bo obie polityki INSERT
 *      sprawdzają dokładnie `(storage.foldername(name))[1] = auth.uid()`.
 * Ścieżka bez segmentu użytkownika to wysyłka, która ZAWSZE padnie — i padnie
 * komunikatem, który nie mówi dlaczego.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

const SUB = "05261c7d-f34a-4fb2-a0e0-0f85149eb0ce";
const THREAD = "dm-dbe85c4e-ec79-4e9a-a55d-7274e0e3296e-4cd1894d-b878-4fe4-b221-084419f7d225";

function jwt(sub: string | null): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(sub ? { sub, role: "authenticated" } : { role: "authenticated" })}.sig`;
}

/** Co dokładnie poszło do magazynu — jedno miejsce prawdy dla obu zamków. */
let lastCall: { bucket: string; path: string; mime: string } | null = null;
let userJwt: string | undefined = jwt(SUB);

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://x.supabase.co", anonKey: "anon", userJwt }),
  getSupabase: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _bytes: Uint8Array, opts: { contentType: string }) => {
          lastCall = { bucket, path, mime: opts.contentType };
          return { error: null };
        },
      }),
    },
  }),
}));

const { uploadBlob, decodeBase64Body } = await import("../providers/blob-upload.js");

beforeEach(() => { lastCall = null; userJwt = jwt(SUB); });

describe("blob-upload — bucket i ścieżka, które polityka RLS naprawdę przyjmie", () => {
  it("plik idzie do chat-files, a ścieżka zaczyna się od auth.uid()", async () => {
    const desc = await uploadBlob({
      kind: "file",
      bytes: new Uint8Array([1, 2, 3]),
      mime: "text/plain",
      prefix: THREAD,
      filename: "lana-plikow-test.txt",
    });

    expect(lastCall!.bucket).toBe("chat-files");
    expect(desc.bucket).toBe("chat-files");
    const [uid, thread, file] = lastCall!.path.split("/");
    expect(uid).toBe(SUB);                       // ← to sprawdza polityka INSERT
    expect(thread).toBe(THREAD);
    expect(file).toMatch(/^[0-9a-f-]{36}\.txt$/);
    expect(desc.path).toBe(lastCall!.path);
  });

  it("głos idzie do voice-messages (nie do nieistniejącego voice-blobs)", async () => {
    const desc = await uploadBlob({ kind: "voice", bytes: new Uint8Array([1]), mime: "audio/webm", prefix: THREAD });
    expect(lastCall!.bucket).toBe("voice-messages");
    expect(desc.bucket).toBe("voice-messages");
    expect(lastCall!.path.split("/")[0]).toBe(SUB);
  });

  it("ptt też ląduje w buckecie, który istnieje i ma politykę INSERT", async () => {
    await uploadBlob({ kind: "ptt", bytes: new Uint8Array([1]), mime: "audio/ogg", prefix: "chat-abc" });
    expect(lastCall!.bucket).toBe("voice-messages");
    expect(lastCall!.path).toMatch(new RegExp(`^${SUB}/chat-abc/[0-9a-f-]{36}\\.ogg$`));
  });

  it("bez JWT użytkownika upload jest ODRZUCONY, zanim poleci bajt", async () => {
    userJwt = undefined;
    await expect(uploadBlob({ kind: "file", bytes: new Uint8Array([1]), mime: "text/plain" }))
      .rejects.toThrow(/auth\.uid\(\)/);
    expect(lastCall).toBeNull();                  // nic nie poszło do magazynu
  });

  it("ścieżka z pamięci przechodzi przez ten sam dekoder base64 (kontrakt narzędzi)", () => {
    expect(new TextDecoder().decode(decodeBase64Body("VEVTVCAxNg=="))).toBe("TEST 16");
  });
});
