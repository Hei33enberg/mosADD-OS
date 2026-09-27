/**
 * ZAMEK (27.09.2026, nastepstwo LINEAR-6089): koperta wyslana przez mDM_send z MCP ma byc
 * CZYTELNA — u nadawcy i u odbiorcy — a nie tylko „zaszyfrowana".
 *
 * Zmierzone na prod 27.09: mDM_send przez brame mcp.mosadd.com
 *   1. przy kazdym wywolaniu rodzil NOWA tozsamosc (InMemoryMdmKeyStore na zadanie HTTP),
 *   2. nie zapisywal self_payload ani recipient_self_payload,
 *   3. pisal message_type "text" zamiast "txt".
 * Skutek: nadawca nie odczyta wlasnej wiadomosci nigdy wiecej, odbiorca tylko przez ratchet.
 *
 * Prawdziwa kryptografia (X3DH + Double Ratchet + AES-GCM + HKDF z @mosadd/crypto), zero atrap
 * szyfru. Kazde "zadanie" bramy = SWIEZY serwer z tym samym kluczem API — dokladnie jak handler
 * bramy (createMosaddServer per request). Otwieracze "s1."/"r1." w tym pliku sa WIERNA KOPIA
 * algorytmu aplikacji (apps/web/src/lib/mdmE2ee.ts: tryReadOwnSelf / tryOpenPeerRecoverable),
 * a wektory KAT policzone bibliotekami aplikacji (@noble 2.0.1 z drzewa mosADD).
 */

import { describe, expect, it } from "vitest";
import type { DmProvider, DmListArgs, DmListResult, DmSendResult } from "@mosadd/providers";
import { deriveHkdfKey, deriveSharedSecret, fromBase64, toBase64 } from "@mosadd/crypto";
import { mdmTools } from "../tools/mdm.js";
import { defaultProviders } from "../server.js";
import {
  SeededMdmKeyStore,
  decryptFromPeer,
  deriveOwnMaterialFromSeed,
  parsePublicBundle,
  serializePublicBundle,
  type MdmKeyStore,
} from "../crypto/mdm-session.js";
import type { DmMessageExt, DmSendArgsExt } from "../providers/supabase-dm.js";
import { InMemoryVoiceProvider } from "../providers/memory-voice.js";
import type { MosaddToolContext } from "../types.js";

// ---- a backend shaped like message-send / message-list / prekey directory ----

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
}

class Lane implements DmProvider {
  constructor(private readonly b: Backend, private readonly me: string) {}
  async selfId() { return this.me; }
  async selfKind() { return this.b.kinds.get(this.me) ?? null; }
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
  async publishPrekeyBundle(bundle: Uint8Array) { this.b.bundles.set(this.me, bundle); }
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

// ---- the app's openers, copied algorithm-for-algorithm from apps/web/src/lib/mdmE2ee.ts ----

async function appOpenAesGcm(tag: string, keyBytes: Uint8Array, sealed: string | null): Promise<string | null> {
  if (!sealed || !sealed.startsWith(tag)) return null;
  const packed = fromBase64(sealed.slice(tag.length));
  if (packed.length <= 12) return null;
  const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "AES-GCM" }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, key, packed.slice(12));
  return new TextDecoder().decode(pt);
}

/** tryOpenPeerRecoverable: HKDF(ECDH(my IK priv, SENDER's PUBLISHED IK), info) → AES-GCM. */
async function appOpenRecipientCopy(b: Backend, me: MdmKeyStore, senderId: string, sealed: string | null) {
  const raw = b.bundles.get(senderId);
  if (!raw) return null;
  const sender = parsePublicBundle(raw);
  const own = await me.getOwnMaterial();
  const secret = await deriveSharedSecret(own.identity.privateKey, sender.identityPublicKey);
  const k = await deriveHkdfKey(secret, {
    info: new TextEncoder().encode("mosadd.mdm.recipient-recoverable.v1"),
    length: 32,
  });
  return appOpenAesGcm("r1.", k, sealed);
}

/** tryReadOwnSelf: HKDF(seed, "mosadd-mdm-self-read") → AES-GCM over "s1.". */
async function appOpenSelfCopy(seed: Uint8Array, sealed: string | null) {
  const k = await deriveHkdfKey(seed, { info: new TextEncoder().encode("mosadd-mdm-self-read"), length: 32 });
  return appOpenAesGcm("s1.", k, sealed);
}

const API_KEY = "mosadd_sk_live_0123456789abcdef0123456789abcdef";
const LINE = "general-line-identity";
const KING = "king-identity";

describe("mDM_send z MCP — koperta czytelna u nadawcy i u odbiorcy (zamek 27.09)", () => {
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
    const a = await gatewayRequest(b, LINE, API_KEY).providers.keys.getOwnMaterial();
    const c = await gatewayRequest(b, LINE, API_KEY).providers.keys.getOwnMaterial();
    expect(toBase64(a.identity.publicKey)).toBe(toBase64(c.identity.publicKey));
    expect(toBase64(a.signedPrekey.pair.publicKey)).toBe(toBase64(c.signedPrekey.pair.publicKey));
    const other = await gatewayRequest(b, LINE, API_KEY + "ff").providers.keys.getOwnMaterial();
    expect(toBase64(other.identity.publicKey)).not.toBe(toBase64(a.identity.publicKey));
  });

  it("wysylka linii do Krola: txt + self_payload + recipient_self_payload; oboje czytaja po nowym zadaniu", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    const kingSeed = new Uint8Array(32).fill(7);
    const king = await appOf(b, KING, 7);

    const sent = (await tool("mDM_send")({ to: KING, text: "meldunek: brama czytelna" }, gatewayRequest(b, LINE, API_KEY))) as {
      sender_copy: boolean; recipient_copy: boolean; identity: string; message_id: string;
    };
    expect(sent).toMatchObject({ sender_copy: true, recipient_copy: true });
    expect(["published", "consistent"]).toContain(sent.identity);

    const row = b.rows.at(-1)!;
    expect(row.messageType).toBe("txt");
    expect(row.selfPayload).toMatch(/^s1\./);
    expect(row.recipientSelfPayload).toMatch(/^r1\./);
    // ciphertext na drucie, nie tekst
    expect(Buffer.from(row.payload).toString("utf8")).not.toContain("meldunek");
    expect(row.selfPayload).not.toContain("meldunek");

    // NADAWCA: nowe zadanie bramy (inna lambda, pusta pamiec wyslanych) czyta swoja wiadomosc.
    const lineRead = (await tool("mDM_list")({ contact_id: KING }, gatewayRequest(b, LINE, API_KEY))) as {
      messages: Array<{ text: string; sender_identity_id: string }>;
    };
    expect(lineRead.messages.map((m) => m.text)).toEqual(["meldunek: brama czytelna"]);

    // ODBIORCA w aplikacji, BEZ sesji ratchetu (nowe urzadzenie): kopia r1. algorytmem aplikacji.
    expect(await appOpenRecipientCopy(b, king, LINE, row.recipientSelfPayload)).toBe("meldunek: brama czytelna");
    // ODBIORCA przez ratchet (koperta niesie naglowek X3DH do opublikowanego peku Krola).
    const viaRatchet = await decryptFromPeer(new SeededMdmKeyStore(kingSeed), LINE, row.payload);
    expect(new TextDecoder().decode(viaRatchet)).toBe("meldunek: brama czytelna");

    // Druga wysylka z NOWEGO zadania: ta sama tozsamosc -> pek w katalogu sie nie zmienia.
    const bundleBefore = toBase64(b.bundles.get(LINE)!);
    const second = (await tool("mDM_send")({ to: KING, text: "drugi" }, gatewayRequest(b, LINE, API_KEY))) as { identity: string };
    expect(second.identity).toBe("consistent");
    expect(toBase64(b.bundles.get(LINE)!)).toBe(bundleBefore);
    expect(await appOpenRecipientCopy(b, king, LINE, b.rows.at(-1)!.recipientSelfPayload)).toBe("drugi");
  });

  it("watek wlasny linii (dm:ja:ja): nadawca czyta z nowego zadania, kopia s1. otwiera sie algorytmem aplikacji", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    await tool("mDM_send")({ to: LINE, text: "notatka do siebie" }, gatewayRequest(b, LINE, API_KEY));
    const row = b.rows.at(-1)!;
    expect(row.threadId).toBe(`dm:${LINE}:${LINE}`);
    expect(row.messageType).toBe("txt");
    expect(row.selfPayload).toMatch(/^s1\./);

    const read = (await tool("mDM_list")({ contact_id: LINE }, gatewayRequest(b, LINE, API_KEY))) as {
      messages: Array<{ text: string }>;
    };
    expect(read.messages.map((m) => m.text)).toEqual(["notatka do siebie"]);

    // To samo ziarno w aplikacji otwiera kopie wlasna jej algorytmem (tryReadOwnSelf).
    const { deriveMdmSeedFromSecret } = await import("../crypto/mdm-session.js");
    expect(await appOpenSelfCopy(await deriveMdmSeedFromSecret(API_KEY), row.selfPayload)).toBe("notatka do siebie");
  });

  it("linia agenta ze starym losowym pekiem: pek zastapiony; pek CZLOWIEKA z aplikacji nigdy nie nadpisany", async () => {
    // agent: martwy pek po dawnym losowym przebiegu -> zastapiony stala tozsamoscia
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    const stale = serializePublicBundle(await new SeededMdmKeyStore(new Uint8Array(32).fill(99)).getOwnMaterial());
    b.bundles.set(LINE, stale);
    await appOf(b, KING, 7);
    const r = (await tool("mDM_send")({ to: KING, text: "x" }, gatewayRequest(b, LINE, API_KEY))) as { identity: string };
    expect(r.identity).toBe("published");
    expect(toBase64(b.bundles.get(LINE)!)).not.toBe(toBase64(stale));

    // czlowiek (klucz Krola uzyty przez agenta): pek aplikacji zostaje, kopii r1. nie ma (bylaby pod zla tozsamoscia)
    const h = new Backend();
    const kingApp = serializePublicBundle(await (await appOf(h, KING, 7)).getOwnMaterial());
    await appOf(h, "peer", 5);
    const hr = (await tool("mDM_send")({ to: "peer", text: "y" }, gatewayRequest(h, KING, API_KEY))) as {
      identity: string; recipient_copy: boolean; sender_copy: boolean;
    };
    expect(hr).toMatchObject({ identity: "foreign", recipient_copy: false, sender_copy: true });
    expect(toBase64(h.bundles.get(KING)!)).toBe(toBase64(kingApp));
    expect(h.rows.at(-1)!.messageType).toBe("txt");
  });

  it("odbior w MCP: wiadomosc Krola z kopia r1. czytelna w bramie bez sesji ratchetu", async () => {
    const b = new Backend();
    b.kinds.set(LINE, "agent");
    const king = await appOf(b, KING, 7);
    // linia publikuje swoj pek (pierwsze zadanie), Krol pisze z aplikacji z kopia r1.
    await tool("mDM_send")({ to: KING, text: "hej" }, gatewayRequest(b, LINE, API_KEY));
    const { sealForPeerRecoverable, fetchVerifiedBundle, encryptForPeer } = await import("../crypto/mdm-session.js");
    const kingLane = new Lane(b, KING);
    const lineBundle = (await fetchVerifiedBundle(kingLane, LINE))!;
    const inner = new TextEncoder().encode("rozkaz od Krola");
    // ratchet Krola jest juz daleko (n>=1, bez naglowka) — brama go nie ma; ratuje ja r1.
    await encryptForPeer(king, kingLane, LINE, new TextEncoder().encode("pierwsza"));
    const env = await encryptForPeer(king, kingLane, LINE, inner);
    await kingLane.send({
      to: LINE,
      threadId: `dm:${[KING, LINE].sort().join(":")}`,
      payload: env,
      messageType: "txt",
      recipientSelfPayload: await sealForPeerRecoverable(king, lineBundle, inner),
    });
    const read = (await tool("mDM_list")({ contact_id: KING }, gatewayRequest(b, LINE, API_KEY))) as {
      messages: Array<{ text: string; sender_identity_id: string }>;
    };
    expect(read.messages.find((m) => m.sender_identity_id === KING)?.text).toBe("rozkaz od Krola");
  });
});
