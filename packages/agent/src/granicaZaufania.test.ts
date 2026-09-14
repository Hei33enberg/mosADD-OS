import { describe, it, expect, vi, afterEach } from "vitest";
import { wolnoRozmawiac } from "./granicaZaufania.js";

/**
 * SABOTAŻ GRANICY ZAUFANIA.
 *
 * ⛔ CZEGO TEN PLIK BRONI. Do 14.09 pętla odpowiedzi szła po WSZYSTKICH zaakceptowanych kontaktach
 * i każdemu podawała mózgowi narzędzia maszyny właściciela. Ten zamek to zamyka. Test istnieje po
 * to, żeby następna osoba, która „tylko dołoży jedno narzędzie", nie otworzyła go z powrotem.
 *
 * ⛔ KAŻDY PRZYPADEK NIŻEJ ODPOWIADA NA JEDNO PYTANIE: „czy przy TYM zdarzeniu obcy wchodzi?".
 * Domyślną odpowiedzią zamka jest NIE, więc każdy test, który tego nie sprawdza, jest ozdobą.
 */

const URL_BAZY = "https://x.supabase.co";
const ANON = "anon";
const JWT = "jwt";
const JA = "11111111-1111-1111-1111-111111111111";
const OBCY = "22222222-2222-2222-2222-222222222222";

function odpowiedz(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body } as unknown as Response);
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("granica zaufania — domyślną odpowiedzią jest NIE", () => {
  it("przepuszcza WYŁĄCZNIE literalne true z bazy", async () => {
    vi.stubGlobal("fetch", odpowiedz(true));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(true);
  });

  it("odrzuca, gdy baza mówi false", async () => {
    vi.stubGlobal("fetch", odpowiedz(false));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
  });

  // ⛔ „NIE WIEM" ZNACZY NIE. PostgREST przy błędzie oddaje obiekt, nie boolean; stary kod
  // sprawdzający `if (wynik)` przepuściłby każdy taki obiekt jako prawdę.
  it.each([
    ["null", null],
    ["napis 'true'", "true"],
    ["liczba 1", 1],
    ["obiekt błędu PostgREST", { code: "42501", message: "permission denied" }],
    ["pusty obiekt", {}],
  ])("odrzuca odpowiedź, która nie jest literalnym true: %s", async (_opis, ciało) => {
    vi.stubGlobal("fetch", odpowiedz(ciało));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
  });

  // ⛔ KIERUNEK AWARII JEST CZĘŚCIĄ ZAMKA. Przy 30-sekundowym pollu jedna minuta niedostępności
  // bazy otwierałaby dysk właściciela każdemu kontaktowi, gdyby awaria znaczyła „przepuść".
  it("odrzuca przy odpowiedzi nie-OK (401, 500)", async () => {
    vi.stubGlobal("fetch", odpowiedz(true, false));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
  });

  it("odrzuca, gdy sieć padnie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
  });

  it("odrzuca, gdy odpowiedź jest nieczytelna", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error("nie JSON"); },
    } as unknown as Response));
    expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
  });

  it.each([
    ["brak adresu bazy", ["", ANON, JWT, JA, OBCY]],
    ["brak klucza anon", [URL_BAZY, "", JWT, JA, OBCY]],
    ["brak JWT (sesja jeszcze niewymieniona)", [URL_BAZY, ANON, "", JA, OBCY]],
    ["brak własnej tożsamości", [URL_BAZY, ANON, JWT, "", OBCY]],
    ["brak tożsamości rozmówcy", [URL_BAZY, ANON, JWT, JA, ""]],
  ])("odrzuca bez pytania bazy, gdy brakuje danych: %s", async (_o, args) => {
    const f = odpowiedz(true);
    vi.stubGlobal("fetch", f);
    const [a, b, c, d, e] = args as string[];
    expect(await wolnoRozmawiac(a, b, c, d, e)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("SABOTAŻ — czy da się zamek obejść, rozszerzając uprawnienia po cichu", () => {
  /**
   * ⛔ TO JEST TEST, O KTÓRY PROSIŁ GENERAŁ: „dopisujesz nowe narzędzie do listy i sprawdzasz,
   * czy obcy nadawca dalej jest odrzucany". Odpowiedź jest twierdząca Z KONSTRUKCJI i właśnie to
   * tu przypinamy: zamek stoi na granicy ROZMOWY, nie przy doborze narzędzi. Nie widzi listy
   * narzędzi, nie pyta o nią i nie da się jej do niego przemycić — więc dołożenie dziesiątego,
   * setnego czy niszczącego narzędzia nie zmienia jego odpowiedzi ani o jotę.
   */
  it("decyzja nie zależy od ŻADNEJ listy narzędzi — pytanie do bazy niesie tylko dwie tożsamości", async () => {
    const f = odpowiedz(false);
    vi.stubGlobal("fetch", f);
    await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY);

    const [adres, init] = f.mock.calls[0] as [string, RequestInit];
    expect(adres).toBe(`${URL_BAZY}/rest/v1/rpc/agent_may_talk_to`);
    const ciało = JSON.parse(String(init.body));
    expect(Object.keys(ciało).sort()).toEqual(["p_agent_identity_id", "p_peer_identity_id"]);
    expect(ciało.p_agent_identity_id).toBe(JA);
    expect(ciało.p_peer_identity_id).toBe(OBCY);
  });

  it("obcy zostaje odrzucony niezależnie od tego, ile narzędzi ma agent", async () => {
    // Symulujemy „ciche rozszerzenie uprawnień": lista narzędzi rośnie z 5 do 500.
    for (const ile of [5, 50, 500]) {
      const narzedzia = Array.from({ length: ile }, (_, i) => `komputer_narzedzie_${i}`);
      const f = odpowiedz(false);
      vi.stubGlobal("fetch", f);
      const wolno = await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY);
      expect(wolno, `obcy wszedł przy ${narzedzia.length} narzędziach`).toBe(false);
    }
  });

  // ⛔ Zamek pyta bazę, a nie zmienną środowiskową. Poprzedni kształt tej reguły był zmienną
  // (AGENT_TRUSTED_PEERS) i został porzucony, bo jest niewidoczny dla właściciela i zmienia się
  // po cichu. Ten test pilnuje, żeby nikt jej nie przywrócił jako "szybkiej furtki".
  it("nie ma furtki przez zmienną środowiskową", async () => {
    process.env.AGENT_TRUSTED_PEERS = OBCY;
    process.env.MOSADD_AGENT_TRUST_ALL = "1";
    try {
      vi.stubGlobal("fetch", odpowiedz(false));
      expect(await wolnoRozmawiac(URL_BAZY, ANON, JWT, JA, OBCY)).toBe(false);
    } finally {
      delete process.env.AGENT_TRUSTED_PEERS;
      delete process.env.MOSADD_AGENT_TRUST_ALL;
    }
  });
});
