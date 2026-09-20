/**
 * M72 — PIERWSZY MOST, KTÓRY NAPRAWDĘ WYSYŁA, I REJESTR, KTÓRY NIE KŁAMIE.
 *
 * Zmierzone 19.09 (audyt): `@mosadd/bridges` miał trzy mosty i ZERO działających — każda metoda
 * rzucała `BridgeNotImplementedError`, a opis na npm mówił „EXPERIMENTAL scaffold (not
 * functional yet)". Z zewnątrz nie dało się tego odróżnić od gotowego pakietu bez wywołania
 * metody i złapania wyjątku.
 *
 * Ten plik trzyma DWIE rzeczy naraz:
 *   A. Telegram (tryb botowy) robi prawdziwe wołania Bot API i poprawnie mapuje odpowiedzi.
 *   B. Drzwi są uczciwe: `status` mówi prawdę o KAŻDYM moście, a tryb MTProto odmawia wprost.
 *
 * ⛔ ZERO RUCHU DO SIECI. `fetch` jest podmieniany i KAŻDY test sprawdza także URL oraz ciało
 * żądania — test, który tylko udaje odpowiedź, przeszedłby też dla mostu pytającego zły adres.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BridgeNotImplementedError,
  bridges,
  bridgeStatus,
  liveBridges,
  TelegramBridge,
} from "../index.js";
import { TelegramBridgeError } from "../telegram/index.js";

const BOT = { bot_token: "123:ABC" };
const most = new TelegramBridge();

/** Ostatnie żądanie, żeby dało się orzec, DOKĄD most poszedł i z czym. */
let ostatnie: { url: string; body: Record<string, unknown> } | null = null;

function odpowiedz(env: unknown, status = 200) {
  return vi.fn(async (url: string, init: { body: string }) => {
    ostatnie = { url, body: JSON.parse(init.body) as Record<string, unknown> };
    return { status, json: async () => env } as unknown as Response;
  });
}

beforeEach(() => { ostatnie = null; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("M72 — most Telegram (Bot API)", () => {
  it("verifyConfig pyta getMe i oddaje nazwę bota", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: { id: 77, username: "mosadd_bot" } }));
    await expect(most.verifyConfig(BOT)).resolves.toEqual({ ok: true, remote_user: "@mosadd_bot" });
    expect(ostatnie!.url).toBe("https://api.telegram.org/bot123:ABC/getMe");
  });

  it("sendMessage wysyła naprawdę i zwraca id + czas z odpowiedzi Telegrama", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: { message_id: 42, date: 1_700_000_000, chat: { id: -100, type: "group" } } }));
    const r = await most.sendMessage(BOT, { to: "-100", text: "melduję", reply_to: "41" });
    expect(r).toEqual({ id: "42", sent_at: new Date(1_700_000_000 * 1000).toISOString() });
    expect(ostatnie!.url).toBe("https://api.telegram.org/bot123:ABC/sendMessage");
    expect(ostatnie!.body).toEqual({ chat_id: "-100", text: "melduję", reply_to_message_id: 41 });
  });

  /** Dwie wiadomości: jedna z naszej rozmowy, jedna z obcej (ma przesunąć kursor, nie wynik). */
  const PARTIA = {
    ok: true,
    result: [
      { update_id: 10, message: { message_id: 1, date: 1_700_000_000, chat: { id: -100, type: "group" }, from: { id: 5, username: "ala" }, text: "raz" } },
      // Obca rozmowa: NIE wchodzi do wyniku, ale MUSI przesunąć kursor — inaczej kolejne
      // wołanie dostaje ją znowu i pętla nigdy nie rusza z miejsca.
      { update_id: 11, message: { message_id: 2, date: 1_700_000_100, chat: { id: -999, type: "group" }, text: "cudze" } },
    ],
  };

  it("listMessages filtruje do rozmowy", async () => {
    vi.stubGlobal("fetch", odpowiedz(PARTIA));
    const r = await most.listMessages(BOT, { conversation: "-100" });
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]).toMatchObject({ id: "1", network: "telegram", conversation: "-100", from: "@ala", text: "raz" });
    expect(ostatnie!.body).not.toHaveProperty("offset");
  });

  /**
   * ⛔ ZAMEK NA PUŁAPKĘ Z 20.09. Pierwsza wersja mostu oddawała `next_cursor = ostatni + 1`
   * BEZ PYTANIA i przyjmowała go z powrotem jako offset. Czyli najoczywistsza pętla, jaką da
   * się napisać nad tym interfejsem — czytaj, oddaj kursor, czytaj — przy drugim obrocie
   * mówiła Telegramowi „zapomnij wszystko wcześniejsze", i to dla KAŻDEGO, kto czyta tym
   * tokenem bota. Komentarz nad tą linią mówił dokładnie odwrotnie do tego, co robiła.
   *
   * Te trzy testy trzymają obie strony zamka: bez zgody nie wychodzi offset I nie wraca
   * kursor (więc pętli nie da się zbudować), ze zgodą wychodzi dokładnie to, co dostaliśmy.
   */
  it("⛔ bez zgody kursor NIE wraca — nie da się zbudować pętli, która kasuje", async () => {
    vi.stubGlobal("fetch", odpowiedz(PARTIA));
    const r = await most.listMessages(BOT, { conversation: "-100" });
    expect(
      r.next_cursor,
      "most oddał dodatni offset bez zgody — czyli zastawił pułapkę na zwykłą pętlę czytania",
    ).toBeNull();
  });

  it("⛔ bez zgody podany kursor NIE idzie do Telegrama jako offset", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: [] }));
    // Nawet gdy wołający poda kursor (np. zapamiętany skądinąd), brak zgody = brak kasowania.
    const r = await most.listMessages(BOT, { conversation: "-100", cursor: "12" });
    expect(ostatnie!.body, "offset wyszedł mimo braku `consume` — to kasuje kolejkę bota").not.toHaveProperty("offset");
    expect(r.next_cursor).toBeNull();
  });

  it("ze zgodą: kursor liczony z CAŁEJ partii, a podany offset idzie co do liczby", async () => {
    vi.stubGlobal("fetch", odpowiedz(PARTIA));
    const pierwsze = await most.listMessages(BOT, { conversation: "-100", consume: true });
    expect(pierwsze.next_cursor, "kursor musi wynikać z obcego update_id 11, nie z naszego 10").toBe("12");

    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: [] }));
    const drugie = await most.listMessages(BOT, { conversation: "-100", consume: true, cursor: pierwsze.next_cursor! });
    expect(ostatnie!.body.offset).toBe(12);
    expect(drugie.next_cursor, "pusta partia nie ma czego potwierdzać").toBeNull();
  });

  it("resolveHandle dokleja @ i oddaje id czatu", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: { id: -1001, type: "channel", title: "Sztab" } }));
    await expect(most.resolveHandle(BOT, "sztab")).resolves.toEqual({ id: "-1001", display_name: "Sztab" });
    expect(ostatnie!.body.chat_id).toBe("@sztab");
  });

  it("odmowa Telegrama wraca z JEGO powodem, nie jako „request failed”", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: false, description: "Unauthorized", error_code: 401 }, 401));
    await expect(most.verifyConfig(BOT)).rejects.toBeInstanceOf(TelegramBridgeError);
    await expect(most.verifyConfig(BOT)).rejects.toThrow(/Unauthorized.*401/s);
  });

  it("409 na getUpdates mówi o webhooku i co z nim zrobić", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: false, description: "Conflict", error_code: 409 }, 409));
    await expect(most.listMessages(BOT, { conversation: "-100" })).rejects.toThrow(/webhook[\s\S]*deleteWebhook/);
  });

  it("⛔ tryb MTProto odmawia WPROST i mówi, że tryb botowy działa", async () => {
    const user = { api_id: "1", api_hash: "h", session: "s" };
    await expect(most.verifyConfig(user)).rejects.toBeInstanceOf(BridgeNotImplementedError);
    await expect(most.verifyConfig(user)).rejects.toThrow(/bot mode IS implemented/);
  });

  it("pusta konfiguracja mówi, KTÓRY tryb jest zbudowany", async () => {
    await expect(most.verifyConfig({})).rejects.toThrow(/bot_token.*IMPLEMENTED/s);
  });

  it("pusty tekst nie wychodzi w świat", async () => {
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: {} }));
    await expect(most.sendMessage(BOT, { to: "-100", text: "" })).rejects.toThrow(/empty text/);
    expect(ostatnie, "most poszedł do sieci z pustą wiadomością").toBeNull();
  });
});

describe("M72 — rejestr mówi prawdę o każdym moście", () => {
  it("status jest zadeklarowany na KAŻDYM moście", () => {
    for (const [network, b] of Object.entries(bridges)) {
      expect(["live", "scaffold"], `${network} bez statusu`).toContain(b.status);
    }
  });

  it("bridgeStatus() zgadza się z zachowaniem: atrapa rzuca, żywy nie", async () => {
    expect(bridgeStatus()).toEqual({ matrix: "scaffold", discord: "scaffold", telegram: "live" });
    // Asercja na ZACHOWANIU, nie na etykiecie — inaczej wystarczyłoby przekłamać pole.
    await expect(bridges.discord.verifyConfig({ token: "t" })).rejects.toBeInstanceOf(BridgeNotImplementedError);
    await expect(bridges.matrix.verifyConfig({ homeserver: "https://x", access_token: "t", user_id: "@b:x" }))
      .rejects.toBeInstanceOf(BridgeNotImplementedError);
    vi.stubGlobal("fetch", odpowiedz({ ok: true, result: { id: 1, username: "b" } }));
    await expect(bridges.telegram.verifyConfig(BOT)).resolves.toMatchObject({ ok: true });
  });

  it("liveBridges() to nie jest już pusta lista", () => {
    expect(liveBridges()).toEqual(["telegram"]);
  });

  it("opis paczki na npm nie mówi już „not functional yet”", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, resolve } = await import("node:path");
    const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const opis = String(JSON.parse(readFileSync(pkg, "utf8")).description);
    expect(opis).not.toMatch(/not functional yet/i);
    expect(opis).toMatch(/TELEGRAM IS LIVE/);
    // ⛔ …ale „live" bez granicy jest obietnicą. Opis na npm to jedyne zdanie, które człowiek
    //    czyta PRZED instalacją — musi nieść to, czego `read` NIE robi.
    expect(opis, "npm obiecuje `read` i nie mówi, że to kolejka, nie historia").toMatch(/not message history/i);
    expect(opis, "npm nie ostrzega, że przesunięcie kursora kasuje").toMatch(/consume/);
  });

  it("README nie opisuje już pakietu, którego każda metoda rzuca", async () => {
    // Ten plik jedzie na npm (pole `files`) i do 20.09 mówił „Do not depend on this package.
    // The adapters throw BridgeNotImplementedError from every handler" — czyli opis paczki i
    // jej własne README twierdziły co innego o tym samym kodzie.
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, resolve } = await import("node:path");
    const readme = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../README.md"), "utf8");
    expect(readme).not.toMatch(/throw\s+`?BridgeNotImplementedError`?\s+from every handler/i);
    expect(readme, "README musi nazwać granicę: kolejka, nie historia").toMatch(/NOT history/i);
    expect(readme, "README musi nazwać kasujący kursor").toMatch(/consume:\s*true/);
  });
});
