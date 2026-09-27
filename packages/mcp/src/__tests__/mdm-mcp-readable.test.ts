/**
 * ZAMEK (27.09.2026, nastepstwo LINEAR-6089, POPRAWKA po niezaleznej weryfikacji toru mdm-brama):
 * wiadomosc wyslana przez mDM_send z MCP ma byc CZYTELNA u nadawcy i u odbiorcy — na KAZDYM
 * kluczu tej samej tozsamosci, nie tylko na tym, ktory ja wyslal — a aplikacja ma mowic PRAWDE,
 * gdy czegos pokazac nie moze.
 *
 * Co zmierzono 27.09:
 *   1. mDM_send przez brame rodzil NOWA tozsamosc co wywolanie (keystore w pamieci na zadanie HTTP).
 *   2. Pierwsza poprawka (alpha.53) dala tozsamosc stala per KLUCZ API i pozwolila linii agenta
 *      podmieniac pek w katalogu. Tozsamosc ma WIELE aktywnych kluczy (general@: 8, wszystkie
 *      uzywane w 3 dni; 7 z 17 agentow ma po kilka), wiec pek przeskakiwal miedzy tozsamosciami:
 *      kopia s1. otwierala sie tylko pod kluczem, ktory ja zapisal, a kopie r1. przestawaly sie
 *      otwierac u odbiorcy po nastepnej wysylce innym kluczem.
 *   3. alpha.53 pisala tez `txt` + s1. pod ziarnem z klucza API na kluczu CZLOWIEKA — aplikacja
 *      (mdmE2ee.ts readOwnMdmMessage) nie otwiera takiej kopii i podawala FALSZYWY powod
 *      („wyslane z innego urzadzenia" / „odblokuj tozsamosc") zamiast „wyslane przez MCP".
 *
 * Naprawa u zrodla = regula Krola (DECYZJE-KROLA 20.09 12:56Z „E2EE wewnetrzne = zero"): gdy
 * strona rozmowy jest linia agenta, DM idzie JAWNIE — tak samo robi aplikacja (peerIsAgent).
 * Jawny tekst czyta kazdy klucz linii i aplikacja odbiorcy na kazdym urzadzeniu; pek nie jest
 * potrzebny, wiec nie ma czego podmieniac. Czlowiek↔czlowiek zostaje E2EE, a MCP na kluczu
 * czlowieka NIE rusza jego peku z aplikacji, nie pisze kopii s1. i znakuje koperte `text`.
 *
 * Prawdziwa kryptografia (X3DH + Double Ratchet + AES-GCM + HKDF z @mosadd/crypto), zero atrap
 * szyfru. Kazde "zadanie" bramy = SWIEZY serwer z danym kluczem API — jak handler bramy.
 */

import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import type { DmProvider, DmListArgs, DmListResult, DmSendResult } from "@mosadd/providers";
import { deriveHkdfKey, fromBase64, toBase64 } from "@mosadd/crypto";
import { mdmTools } from "../tools/mdm.js";
import { createMosaddServer, defaultProviders } from "../server.js";
import {
  SeededMdmKeyStore,
  decryptFromPeer,
  deriveMdmSeedFromSecret,
  deriveOwnMaterialFromSeed,
  encryptForPeer,
  fetchVerifiedBundle,
  sealForPeerRecoverable,
  serializePublicBundle,
  type MdmKeyStore,
} from "../crypto/mdm-session.js";
import type { DmMessageExt, DmSendArgsExt } from "../providers/supabase-dm.js";
import { InMemoryVoiceProvider } from "../providers/memory-voice.js";
import type { MosaddToolContext } from "../types.js";

// ---- a backend shaped like message-send / message-list / prekey directory / identities ----

type Row = {
  id: string;
  senderId: string;
  to: string;
  threadId: string;
  payload: Uint8Array;
  messageType: string;
  selfPayload: string | null;
  recipientSelfPayload: string | null;
};

class Backend {
  readonly rows: Row[] = [];
  readonly bundles = new Map<string, Uint8Array>();
  readonly kinds = new Map<string, string>();
  publishes = 0;
}

class Lane implements DmProvider {
  constructor(private readonly b: Backend, private readonly me: string) {}
  async selfId() { return this.me; }
  async selfKind() { return this.b.kinds.get(this.me) ?? null; }
  async peerKind(id: string) { return this.b.kinds.get(id) ?? null; }
  async send(args: DmSendArgsExt): Promise<DmSendResult> {
    const id = `m${this.b.rows.length + 1}`;
    this.b.rows.push({
      id,
      senderId: this.me,
      to: args.to,
      threadId: args.threadId,
      payload: args.payload,
      messageType: args.messageType ?? "text",
      selfPayload: args.selfPayload ?? null,
      recipientSelfPayload: args.recipientSelfPayload ?? null,
    });
    return { id, deliveredAt: new Date(0).toISOString() };
  }
  async list(args: DmListArgs): Promise<DmListResult> {
    // message_list_v2: self_payload only to its sender, recipient_self_payload only to the others.
    const messages: DmMessageExt[] = this.b.rows
      .filter((r) => r.threadId === args.threadId)
      .map((r) => ({
        id: r.id,
        senderId: r.senderId,
        payload: r.payload,
        timestamp: new Date(0).toISOString(),
        threadId: r.threadId,
        messageType: r.messageType,
        selfPayload: r.senderId === this.me ? r.selfPayload : null,
        recipientSelfPayload: r.senderId !== this.me ? r.recipientSelfPayload : null,
      }));
    return { messages, nextCursor: null };
  }
  async publishPrekeyBundle(bundle: Uint8Array) {
    this.b.publishes += 1;
    this.b.bundles.set(this.me, bundle);
  }
  async fetchPrekeyBundle(peerId: string) { return this.b.bundles.get(peerId) ?? null; }
}

const tool = (name: string) => {
  const t = mdmTools.find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t.handler;
};

const noopLog: MosaddToolContext["log"] = () => {};

/** One gateway request: a FRESH provider registry built from the API key, like handler.ts. */
function gatewayRequest(b: Backend, me: string, apiKey: string): MosaddToolContext {
  const providers = defaultProviders(
    { dm: new Lane(b, me), voice: new InMemoryVoiceProvider(me) },
    { mdmSecret: apiKey },
  );
  return { options: { mode: "cloud", hubUrl: "https://mcp.mosadd.com", apiKey }, providers, log: noopLog };
}

/** The app of a person: a seed-anchored keystore with its bundle published (login did it). */
async function appOf(b: Backend, me: string, seedByte: number) {
  const keys = new SeededMdmKeyStore(new Uint8Array(32).fill(seedByte));
  b.bundles.set(me, serializePublicBundle(await keys.getOwnMaterial()));
  b.kinds.set(me, "human");
  return keys;
}

/** What the app shows for a plaintext row (ircApi decodePayload: base64 → UTF-8 text). */
const appPlaintext = (row: Row) => new TextDecoder().decode(row.payload);

// ---- the app's decisions, algorithm-for-algorithm from apps/web/src/lib/mdmE2ee.ts ----
// (the drift check at the bottom compares these lines with the app's source on origin/main)

async function appOpenAesGcm(tag: string, keyBytes: Uint8Array, sealed: string | null): Promise<string | null> {
  if (!sealed || !sealed.startsWith(tag)) return null;
  const packed = fromBase64(sealed.slice(tag.length));
  if (packed.length <= 12) return null;
  const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "AES-GCM" }, false, ["decrypt"]);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, key, packed.slice(12));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

/**
 * readOwnMdmMessage (f95557f), for a device that holds the owner's app seed. Steps 2 (this
 * device's sent memory) is empty by construction: the message was sent by MCP, not this device.
 */
async function appReadOwn(
  appSeed: Uint8Array,
  appKeys: MdmKeyStore,
  myIdentityId: string,
  row: Row,
): Promise<{ text: string; reason: null } | { text: null; reason: "key" | "agent" | "device" }> {
  const selfKey = await deriveHkdfKey(appSeed, { info: new TextEncoder().encode("mosadd-mdm-self-read"), length: 32 });
  const zKopii = await appOpenAesGcm("s1.", selfKey, row.selfPayload);
  if (zKopii != null) return { text: zKopii, reason: null };
  const maKlucz = true;
  const para = row.threadId.slice(3).split(":thread:")[0]!.split(":");
  const doSiebie = para.length === 2 && para[0] === myIdentityId && para[1] === myIdentityId;
  if (doSiebie && maKlucz) {
    try {
      return { text: new TextDecoder().decode(await decryptFromPeer(appKeys, myIdentityId, row.payload)), reason: null };
    } catch { /* fall through */ }
  }
  const kopiaDlaMnie = doSiebie || (!!row.selfPayload && row.selfPayload.startsWith("s1."));
  if (!maKlucz && kopiaDlaMnie) return { text: null, reason: "key" };
  return { text: null, reason: row.messageType === "text" ? "agent" : "device" };
}

const KEY_A = "mosadd_sk_live_0123456789abcdef0123456789abcdef";
const KEY_B = "mosadd_sk_live_fedcba9876543210fedcba9876543210"; // druga, rownolegle aktywna, ta sama linia
const LINE = "general-line-identity";
const KING = "king-identity";
const PEER = "peer-human-identity";

type SendOut = {
  message_id: string;
  encrypted: boolean;
  mode: string;
  identity: string;
  sender_copy: boolean;
  recipient_copy: boolean;
};
type ListOut = { messages: Array<{ text: string; sender_identity_id: string; encrypted: boolean }> };

describe("mDM_send z MCP — czytelne na kazdym kluczu, prawdziwe powody w aplikacji (zamek 27.09)", () => {
  it("KAT: tozsamosc z ziarna jest bit w bit ta, ktora wylicza aplikacja", async () => {
    const seed = new Uint8Array(32).map((_, i) => i + 1);
    const m = await deriveOwnMaterialFromSeed(seed);
    // policzone @noble/curves+hashes 2.0.1 z drzewa mosADD (tych samych, na ktorych stoi web)
    expect(toBase64(m.identity.publicKey)).toBe("kGJhDa1OHhlUYRQ0ZgztQfIucOPLxkdOK2iBJpNEWEU=");
    expect(toBase64(m.signingIdentity.publicKey)).toBe("4XxF9XwcOS25C+G8oS/NGXor6ahKsOklnpq3JUQHfVY=");
    expect(toBase64(m.signedPrekey.pair.publicKey)).toBe("0/QU9p52caXSkyjLx/PH4C/9A/UzOZaPRecMtVBQj0Y=");
    expect(m.signedPrekey.id).toBe(1);
    expect(m.oneTimePrekeys).toHaveLength(0);
    expect(toBase64((await new SeededMdmKeyStore(seed).getSelfKeyBytes())!)).toBe(
      "M3XnFLHiETCzgVS+X/Uvl52BhWL9l1EsorKIOXvmKjI=",
    );
  });

  it("dwa zadania bramy z tym samym kluczem = JEDNA tozsamosc (nie nowa co wywolanie)", async () => {
    const b = new Backend();
    const a = await gatewayRequest(b, LINE, KEY_A).providers.keys.getOwnMaterial();
    const c = await gatewayRequest(b, LINE, KEY_A).providers.keys.getOwnMaterial();
    expect(toBase64(a.identity.publicKey)).toBe(toBase64(c.identity.publicKey));
    expect(toBase64(a.signedPrekey.pair.publicKey)).toBe(toBase64(c.signedPrekey.pair.publicKey));
  });

  it("linia agenta, DWA klucze naprzemiennie: jawny txt, kazdy klucz czyta wszystko, Krol czyta w aplikacji, katalog nietkniety", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await appOf(b, KING, 7);

    const s1 = (await tool("mDM_send")({ to: KING, text: "meldunek z klucza A" }, gatewayRequest(b, LINE, KEY_A))) as SendOut;
    const s2 = (await tool("mDM_send")({ to: KING, text: "meldunek z klucza B" }, gatewayRequest(b, LINE, KEY_B))) as SendOut;
    const s3 = (await tool("mDM_send")({ to: KING, text: "znow klucz A" }, gatewayRequest(b, LINE, KEY_A))) as SendOut;
    for (const s of [s1, s2, s3]) {
      expect(s).toMatchObject({ encrypted: false, mode: "plaintext_agent_lane", sender_copy: true, recipient_copy: true, identity: "untouched" });
    }

    // Katalog kluczy: ZERO zapisow — pek linii nie istnieje, wiec nie ma czego przestawiac.
    expect(b.publishes).toBe(0);
    expect(b.bundles.has(LINE)).toBe(false);

    for (const row of b.rows) {
      expect(row.messageType).toBe("txt");
      expect(row.selfPayload).toBeNull();
      expect(row.recipientSelfPayload).toBeNull();
    }
    // Krol w aplikacji, na DOWOLNYM urzadzeniu: jawny tekst, bez kluczy i bez ratchetu.
    expect(b.rows.map(appPlaintext)).toEqual(["meldunek z klucza A", "meldunek z klucza B", "znow klucz A"]);

    // Nadawca: KAZDY klucz linii, swieze zadanie (pusta pamiec wyslanych), czyta WSZYSTKIE trzy.
    for (const k of [KEY_A, KEY_B]) {
      const read = (await tool("mDM_list")({ contact_id: KING }, gatewayRequest(b, LINE, k))) as ListOut;
      expect(read.messages.map((m) => m.text)).toEqual(["meldunek z klucza A", "meldunek z klucza B", "znow klucz A"]);
    }
  });

  it("watek wlasny linii (dm:ja:ja): zapis kluczem A, odczyt kluczem B", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await tool("mDM_send")({ to: LINE, text: "notatka do siebie" }, gatewayRequest(b, LINE, KEY_A));
    const row = b.rows.at(-1)!;
    expect(row.threadId).toBe(`dm:${LINE}:${LINE}`);
    expect(row.messageType).toBe("txt");
    const read = (await tool("mDM_list")({ contact_id: LINE }, gatewayRequest(b, LINE, KEY_B))) as ListOut;
    expect(read.messages.map((m) => m.text)).toEqual(["notatka do siebie"]);
    expect(b.publishes).toBe(0);
  });

  it("czlowiek pisze przez MCP DO linii agenta: jawnie (jak peerIsAgent w aplikacji)", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await appOf(b, KING, 7);
    const s = (await tool("mDM_send")({ to: LINE, text: "rozkaz" }, gatewayRequest(b, KING, KEY_A))) as SendOut;
    expect(s.mode).toBe("plaintext_agent_lane");
    expect(appPlaintext(b.rows.at(-1)!)).toBe("rozkaz");
    const lineRead = (await tool("mDM_list")({ contact_id: KING }, gatewayRequest(b, LINE, KEY_B))) as ListOut;
    expect(lineRead.messages.map((m) => m.text)).toEqual(["rozkaz"]);
  });

  it("klucz CZLOWIEKA do czlowieka: E2EE, pek z aplikacji nietkniety, bez s1., typ `text` — aplikacja mowi PRAWDZIWY powod", async () => {
    const b = new Backend();
    const kingSeed = new Uint8Array(32).fill(7);
    const kingApp = await appOf(b, KING, 7);
    const kingBundle = toBase64(b.bundles.get(KING)!);
    const peerApp = await appOf(b, PEER, 5);

    const s = (await tool("mDM_send")({ to: PEER, text: "tajne" }, gatewayRequest(b, KING, KEY_A))) as SendOut;
    expect(s).toMatchObject({ encrypted: true, mode: "e2ee", identity: "foreign", sender_copy: false, recipient_copy: false });
    const row = b.rows.at(-1)!;
    expect(row.messageType).toBe("text");
    expect(row.selfPayload).toBeNull();
    expect(appPlaintext(row)).not.toContain("tajne");
    expect(b.publishes).toBe(0);
    expect(toBase64(b.bundles.get(KING)!)).toBe(kingBundle);

    // Odbiorca czyta przez ratchet (koperta niesie naglowek X3DH do JEGO peku z aplikacji).
    expect(new TextDecoder().decode(await decryptFromPeer(peerApp, KING, row.payload))).toBe("tajne");
    // Wlasciciel w aplikacji: tresci nie ma (MCP nie zna ziarna aplikacji) i powod jest PRAWDZIWY.
    expect(await appReadOwn(kingSeed, kingApp, KING, row)).toEqual({ text: null, reason: "agent" });
  });

  it("klucz czlowieka, notatka do siebie: aplikacja OTWIERA ja wlasnymi kluczami", async () => {
    const b = new Backend();
    const kingSeed = new Uint8Array(32).fill(7);
    const kingApp = await appOf(b, KING, 7);
    await tool("mDM_send")({ to: KING, text: "do siebie z MCP" }, gatewayRequest(b, KING, KEY_A));
    const row = b.rows.at(-1)!;
    expect(row.messageType).toBe("text");
    expect(await appReadOwn(kingSeed, kingApp, KING, row)).toEqual({ text: "do siebie z MCP", reason: null });
  });

  it("czlowiek BEZ peku: MCP nie publikuje sam (ani mDM_send, ani autoPublishKeys); jawne mDM_publish_keys moze", async () => {
    const b = new Backend();
    b.kinds.set(KING, "human");
    await appOf(b, PEER, 5);
    const s = (await tool("mDM_send")({ to: PEER, text: "x" }, gatewayRequest(b, KING, KEY_A))) as SendOut;
    expect(s.identity).toBe("absent");
    expect(b.bundles.has(KING)).toBe(false);

    createMosaddServer({ apiKey: KEY_A, autoPublishKeys: true, providers: { dm: new Lane(b, KING), voice: new InMemoryVoiceProvider(KING) } });
    await new Promise((r) => setTimeout(r, 50));
    expect(b.bundles.has(KING)).toBe(false);
    expect(b.publishes).toBe(0);

    const p = (await tool("mDM_publish_keys")({}, gatewayRequest(b, KING, KEY_A))) as { published: boolean; identity: string };
    expect(p).toMatchObject({ published: true, identity: "published" });
  });

  it("jawne mDM_publish_keys na kluczu czlowieka NIE nadpisuje peku z aplikacji", async () => {
    const b = new Backend();
    await appOf(b, KING, 7);
    const before = toBase64(b.bundles.get(KING)!);
    const p = (await tool("mDM_publish_keys")({}, gatewayRequest(b, KING, KEY_A))) as { published: boolean; identity: string; note?: string };
    expect(p).toMatchObject({ published: false, identity: "foreign" });
    expect(p.note).toBeTruthy();
    expect(toBase64(b.bundles.get(KING)!)).toBe(before);
    expect(b.publishes).toBe(0);
  });

  it("autoPublishKeys na linii agenta: zero zapisow w katalogu (zaden z jej kluczy nie przestawia peku)", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    for (const k of [KEY_A, KEY_B]) {
      createMosaddServer({ apiKey: k, autoPublishKeys: true, providers: { dm: new Lane(b, LINE), voice: new InMemoryVoiceProvider(LINE) } });
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(b.publishes).toBe(0);
    expect(b.bundles.has(LINE)).toBe(false);
  });

  it("stara koperta E2EE od Krola z kopia r1. (pek linii sprzed poprawki) dalej czytelna w bramie", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    const king = await appOf(b, KING, 7);
    // pek linii opublikowany przez alpha.53 z ziarna klucza A
    b.bundles.set(LINE, serializePublicBundle(await new SeededMdmKeyStore(await deriveMdmSeedFromSecret(KEY_A)).getOwnMaterial()));
    const kingLane = new Lane(b, KING);
    const lineBundle = (await fetchVerifiedBundle(kingLane, LINE))!;
    const inner = new TextEncoder().encode("rozkaz od Krola");
    await encryptForPeer(king, kingLane, LINE, new TextEncoder().encode("pierwsza"));
    const env = await encryptForPeer(king, kingLane, LINE, inner);
    await kingLane.send({
      to: LINE,
      threadId: `dm:${[KING, LINE].sort().join(":")}`,
      payload: env,
      messageType: "txt",
      recipientSelfPayload: await sealForPeerRecoverable(king, lineBundle, inner),
    });
    const read = (await tool("mDM_list")({ contact_id: KING }, gatewayRequest(b, LINE, KEY_A))) as ListOut;
    expect(read.messages.find((m) => m.sender_identity_id === KING)?.text).toBe("rozkaz od Krola");
  });

  // Straznik rozjazdu z aplikacja: dwie reguly, na ktorych stoi ta poprawka, czytane ze zrodla
  // aplikacji na origin/main repo mosADD (MOSADD_WEB_REPO albo C:/Projects/mosADD). Bez repo obok
  // (np. CI bez siostrzanego drzewa) — pominiety, nie zielony na slepo.
  const webRepo = process.env.MOSADD_WEB_REPO ?? "C:/Projects/mosADD";
  const appSource = (path: string): string | null => {
    try {
      return execFileSync("git", ["-C", webRepo, "show", `origin/main:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return null;
    }
  };
  const mdmE2ee = appSource("apps/web/src/lib/mdmE2ee.ts");
  const ircApi = appSource("apps/web/src/lib/ircApi.ts");
  it.skipIf(!mdmE2ee || !ircApi)("kontrakt aplikacji: `text` = powod agent, s1. = kopia dla mnie, agent = jawnie", () => {
    expect(mdmE2ee).toContain('reason: msg.message_type === "text" ? "agent" : "device"');
    expect(mdmE2ee).toContain("const kopiaDlaMnie = doSiebie || (!!msg.self_payload && msg.self_payload.startsWith(SELF_TAG));");
    expect(mdmE2ee).toContain('const SELF_TAG = "s1.";');
    expect(ircApi).toContain('input.threadId.startsWith("dm:") && !input.peerIsAgent');
  });
});
