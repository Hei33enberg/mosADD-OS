/**
 * ZAMEK „ZERO SZYFROWANIA Z FLOTA" (29.09.2026, rozkaz Krola 28.09: „sciagnij te jebane
 * szyfrowanie z naszych rozmow w kazdym kanale i w kazdej tozsamosci").
 *
 * Dwie reguly bramy MCP, obie zmierzone jako zepsute 28–29.09 (Public\ZERO-SZYFROWANIA-29-09,
 * D1 §3 i S1 §1b):
 *
 *   c1 — DEKODER KANALU. #adm i #command sa otwarte, bez klucza grupowego. Aplikacja zapisuje
 *        tekst kanalu jako goly UTF-8 w base64 (apps/web ircApi.ts `encodePayload`). Stary dekoder
 *        (`mirc-messages.ts` / `mroom-messages.ts` `unpackPayload`) znal tylko koperte JSON, wiec
 *        KAZDY wpis Krola czytal sie liniom jako "<ciphertext>" (f159c8d7, 776b3e9a na #adm).
 *        Teraz: jawny tekst = tekst. "<ciphertext>" zostaje tylko dla prawdziwej koperty klucza
 *        grupowego {iv,ciphertext,hmac}, do ktorej linia nie ma klucza (i dla bajtow nie-UTF-8).
 *
 *   b1 — mDM_send DO FLOTY JAWNIE. Gdy ktoras strona to linia agenta ALBO to wiadomosc do siebie
 *        (to === selfId), wysylka idzie sciezka jawna: encrypted:false, reason:"fleet_plaintext".
 *        Czlowiek↔czlowiek zostaje E2EE bez zmian (koperta X3DH + Double Ratchet).
 *
 * Kazdy zamek sprawdzony na czerwono przed naprawa (kod alpha.54) i pod sabotazem po naprawie.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DmProvider, DmListArgs, DmListResult, DmSendResult } from "@mosadd/providers";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import type { DmSendArgsExt } from "../providers/supabase-dm.js";

// ---- message-list / channel-manage stand-in (the only EFs the list tools call) ----

type StoredRow = { id: string; sender_identity_id: string; encrypted_payload: string; created_at: string };
let storedRows: StoredRow[] = [];
/** channel id → the line holds that channel's group key and opens these payloads */
let groupKeyOpens: (channelId: string, payload: string) => string | null = () => null;

vi.mock("../providers/supabase.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../providers/supabase.js")>()),
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  invokeFunction: async (fn: string) => {
    if (fn === "message-list") return { messages: storedRows, next_before: null };
    throw new Error(`unexpected edge function ${fn}`);
  },
}));

vi.mock("../crypto/channel-e2ee.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../crypto/channel-e2ee.js")>()),
  decryptChannelPayload: async (channelId: string, payload: string) => groupKeyOpens(channelId, payload),
  encryptChannelPayload: async () => null,
}));

const { mircMessagesTools } = await import("../tools/mirc-messages.js");
const { mroomMessagesTools } = await import("../tools/mroom-messages.js");
const { mdmTools } = await import("../tools/mdm.js");
const { defaultProviders } = await import("../server.js");
const { InMemoryVoiceProvider } = await import("../providers/memory-voice.js");
const { SeededMdmKeyStore, serializePublicBundle, isE2eeEnvelope, decryptFromPeer } = await import(
  "../crypto/mdm-session.js"
);

const handler = (list: readonly MosaddTool[], name: string) => {
  const t = list.find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not registered`);
  return t.handler;
};
const noopLog: MosaddToolContext["log"] = () => {};
const listCtx = { log: noopLog } as unknown as MosaddToolContext;

/** Exactly what the app stores for a channel post: base64 of the UTF-8 bytes (ircApi encodePayload). */
const appEncode = (text: string) => Buffer.from(new TextEncoder().encode(text)).toString("base64");
const b64json = (obj: unknown) => Buffer.from(JSON.stringify(obj), "utf8").toString("base64");

const ADM = "6c251ebf-acb4-4f49-bd9a-7fc28e5cfee6";
const KING = "king-identity";
const LINE = "general-line-identity";
const PEER = "peer-human-identity";
// Synthetic (the repo is public — no real message of the King goes into a fixture): Polish
// diacritics, an em dash, an @mention, a newline and an emoji, like the King writes.
const KING_TEXT = "Kto dowodzi flotą? Zgłoście się na #adm — żółć, źdźbło 🦞\n@all baczność";

type ListOut = { messages: Array<{ id: string; text: string }> };

async function readChannel(rows: Array<[string, string]>): Promise<string[]> {
  storedRows = rows.map(([id, payload], i) => ({
    id,
    sender_identity_id: KING,
    encrypted_payload: payload,
    created_at: new Date(i * 1000).toISOString(),
  }));
  const out = (await handler(mircMessagesTools, "mIRC_list_messages")(
    { channel_id: ADM, space_id: "space-adm", limit: 50 },
    listCtx,
  )) as ListOut;
  return out.messages.map((m) => m.text);
}

describe("c1 — dekoder kanalu: tekst Krola czyta sie jako tekst, <ciphertext> tylko dla zamknietej koperty", () => {
  beforeEach(() => {
    storedRows = [];
    groupKeyOpens = () => null;
  });

  it("wpis Krola z aplikacji (goly UTF-8 w base64) na otwartym #adm → czytelny tekst, nie <ciphertext>", async () => {
    const texts = await readChannel([
      ["f159c8d7", appEncode(KING_TEXT)],
      ["776b3e9a", appEncode("@all bacznosc")],
    ]);
    expect(texts).toEqual([KING_TEXT, "@all bacznosc"]);
    expect(texts).not.toContain("<ciphertext>");
  });

  it("koperta mosadd.chat.v1 z narzedzia (linie) → jej tekst, jak dotad", async () => {
    const texts = await readChannel([
      ["line-1", b64json({ v: "mosadd.chat.v1", type: "text", text: "meldunek linii", reply_to: null })],
    ]);
    expect(texts).toEqual(["meldunek linii"]);
  });

  it("koperta klucza grupowego {iv,ciphertext,hmac} BEZ klucza → <ciphertext> zostaje", async () => {
    const texts = await readChannel([["sealed", b64json({ iv: "AAAAAAAAAAAAAAAA", ciphertext: "c2VhbGVk", hmac: "aG1hYw==" })]]);
    expect(texts).toEqual(["<ciphertext>"]);
  });

  it("koperta klucza grupowego, linia MA klucz → odszyfrowany tekst (sciezka bez zmian)", async () => {
    const sealed = b64json({ iv: "AAAAAAAAAAAAAAAA", ciphertext: "c2VhbGVk", hmac: "aG1hYw==" });
    groupKeyOpens = (_c, p) => (p === sealed ? JSON.stringify({ v: "mosadd.chat.v1", type: "text", text: "z klucza" }) : null);
    expect(await readChannel([["sealed", sealed]])).toEqual(["z klucza"]);
  });

  it("koperta ratchetu mDM (v: mosadd.e2ee.*) wklejona w kanal → <ciphertext>", async () => {
    const texts = await readChannel([["e2ee", b64json({ v: "mosadd.e2ee.v2", dh: "x", n: 0, ct: "y" })]]);
    expect(texts).toEqual(["<ciphertext>"]);
  });

  it("bajty nie-UTF-8 → <ciphertext> (to nie slowa)", async () => {
    const texts = await readChannel([["bin", Buffer.from([0xff, 0xfe, 0x00, 0x81, 0xc3]).toString("base64")]]);
    expect(texts).toEqual(["<ciphertext>"]);
  });

  it("glos {audio, mime, dur} → znacznik notatki glosowej (formatVoiceIfAny bez zmian)", async () => {
    const texts = await readChannel([["voice", b64json({ audio: "A".repeat(2000), mime: "audio/webm", dur: 4200 })]]);
    expect(texts).toEqual(["[voice note — 4s]"]);
  });

  it("mROOM: ta sama regula — tekst z aplikacji czyta sie jako tekst", async () => {
    storedRows = [{ id: "r1", sender_identity_id: KING, encrypted_payload: appEncode(KING_TEXT), created_at: new Date(0).toISOString() }];
    const out = (await handler(mroomMessagesTools, "mROOM_list_messages")({ room_id: "room-1" }, listCtx)) as ListOut;
    expect(out.messages.map((m) => m.text)).toEqual([KING_TEXT]);
  });
});

// ---- b1: mDM_send — an in-memory backend shaped like message-send / identities / prekeys ----

type Row = { senderId: string; to: string; threadId: string; payload: Uint8Array; messageType: string };

class Backend {
  readonly rows: Row[] = [];
  readonly bundles = new Map<string, Uint8Array>();
  readonly kinds = new Map<string, string>();
}

class Lane implements DmProvider {
  constructor(private readonly b: Backend, private readonly me: string) {}
  async selfId() { return this.me; }
  async selfKind() { return this.b.kinds.get(this.me) ?? null; }
  async peerKind(id: string) { return this.b.kinds.get(id) ?? null; }
  async send(args: DmSendArgsExt): Promise<DmSendResult> {
    this.b.rows.push({ senderId: this.me, to: args.to, threadId: args.threadId, payload: args.payload, messageType: args.messageType ?? "text" });
    return { id: `m${this.b.rows.length}`, deliveredAt: new Date(0).toISOString() };
  }
  async list(_args: DmListArgs): Promise<DmListResult> { return { messages: [], nextCursor: null }; }
  async publishPrekeyBundle(bundle: Uint8Array) { this.b.bundles.set(this.me, bundle); }
  async fetchPrekeyBundle(peerId: string) { return this.b.bundles.get(peerId) ?? null; }
}

const KEY = "mosadd_sk_live_0123456789abcdef0123456789abcdef";
const gatewayRequest = (b: Backend, me: string): MosaddToolContext => ({
  options: { mode: "cloud", hubUrl: "https://mcp.mosadd.com", apiKey: KEY },
  providers: defaultProviders({ dm: new Lane(b, me), voice: new InMemoryVoiceProvider(me) }, { mdmSecret: KEY }),
  log: noopLog,
});

/** A person with the app: kind human, prekey bundle published by the app at login. */
async function person(b: Backend, id: string, seedByte: number) {
  const keys = new SeededMdmKeyStore(new Uint8Array(32).fill(seedByte));
  b.bundles.set(id, serializePublicBundle(await keys.getOwnMaterial()));
  b.kinds.set(id, "human");
  return keys;
}

type SendOut = { encrypted: boolean; reason?: string; mode: string };
const send = (b: Backend, from: string, to: string, text: string) =>
  handler(mdmTools, "mDM_send")({ to, text }, gatewayRequest(b, from)) as Promise<SendOut>;
const plain = (row: Row) => new TextDecoder().decode(row.payload);

describe("b1 — mDM_send: z liniami floty i z Krolem zawsze jawnie, czlowiek↔czlowiek E2EE", () => {
  it("linia agenta → Krol: encrypted:false, reason fleet_plaintext, Krol czyta goly tekst", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await person(b, KING, 7);
    const s = await send(b, LINE, KING, "meldunek");
    expect(s).toMatchObject({ encrypted: false, reason: "fleet_plaintext" });
    expect(b.rows.at(-1)!.messageType).toBe("txt");
    expect(plain(b.rows.at(-1)!)).toBe("meldunek");
  });

  it("Krol (klucz czlowieka) → linia agenta: jawnie, mimo ze linia ma stary pek", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await person(b, KING, 7);
    b.bundles.set(LINE, serializePublicBundle(await new SeededMdmKeyStore(new Uint8Array(32).fill(9)).getOwnMaterial()));
    const s = await send(b, KING, LINE, "rozkaz");
    expect(s).toMatchObject({ encrypted: false, reason: "fleet_plaintext" });
    expect(plain(b.rows.at(-1)!)).toBe("rozkaz");
  });

  it("Krol pisze do SIEBIE (to === selfId) przez MCP: jawnie — zero kopert we wlasnym watku", async () => {
    const b = new Backend();
    await person(b, KING, 7);
    const s = await send(b, KING, KING, "notatka do siebie");
    expect(s).toMatchObject({ encrypted: false, reason: "fleet_plaintext" });
    const row = b.rows.at(-1)!;
    expect(row.threadId).toBe(`dm:${KING}:${KING}`);
    expect(isE2eeEnvelope(row.payload)).toBe(false);
    expect(plain(row)).toBe("notatka do siebie");
  });

  it("czlowiek → czlowiek: E2EE zostaje — koperta ratchetu, tekstu nie widac, odbiorca otwiera", async () => {
    const b = new Backend();
    await person(b, KING, 7);
    const peerKeys = await person(b, PEER, 5);
    const s = await send(b, KING, PEER, "tajne");
    expect(s).toMatchObject({ encrypted: true, mode: "e2ee" });
    expect(s.reason).not.toBe("fleet_plaintext");
    const row = b.rows.at(-1)!;
    expect(isE2eeEnvelope(row.payload)).toBe(true);
    expect(plain(row)).not.toContain("tajne");
    expect(new TextDecoder().decode(await decryptFromPeer(peerKeys, KING, row.payload))).toBe("tajne");
  });

  it("opisy narzedzi: mDM_send_unencrypted nie jest 'DEPRECATED / prefer mDM_send', obie mowia: floty zawsze jawnie", () => {
    const d = (n: string) => mdmTools.find((t) => t.name === n)!.description;
    expect(d("mDM_send_unencrypted")).not.toMatch(/DEPRECATED|Prefer mDM_send|Will be removed/i);
    for (const n of ["mDM_send", "mDM_send_unencrypted"]) {
      expect(d(n)).toMatch(/fleet lines and with the King: ALWAYS in the clear/);
    }
  });
});
