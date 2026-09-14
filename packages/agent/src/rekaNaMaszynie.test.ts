import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * SABOTAŻ RĘKI NA MASZYNIE — test, który pada, gdy narzędzia wracają bez jawnej decyzji.
 *
 * ⛔ PO CO TEN PLIK ISTNIEJE. Wydanie 0.2.42 naprawia start wbudowanego agenta w Elektronie.
 * Do tej naprawy agent ginął ułamek sekundy po starcie, więc brak smyczy nic nie kosztował.
 * Po niej — każdy zaakceptowany kontakt właściciela mógłby kazać jego maszynie zrobić ZRZUT
 * CAŁEGO EKRANU. Dlatego ręka jest wyłączona do zera i ten test pilnuje, żeby ktoś nie włączył
 * jej z powrotem „przy okazji", dokładając narzędzie albo prostując flagę.
 *
 * ⛔ WARUNEK, KTÓRY TEN PLIK EGZEKWUJE (dowodzący wydaniem, 14.09): ręka wraca WYŁĄCZNIE razem
 * z kompletną smyczą — bramka nadawcy, korzeń wybrany przez właściciela, lista zakazów pod
 * właściwy system, zgoda przed wykonaniem. Kto włącza ręce, ten NAJPIERW dopisuje te cztery
 * rzeczy i DOPIERO POTEM zmienia ten test. Zmiana testu bez nich jest cofnięciem decyzji.
 *
 * Lista narzędzi powstaje przy ŁADOWANIU MODUŁU, więc każdy przypadek ładuje moduł od nowa
 * (`resetModules` + `import()`), zamiast liczyć na to, że podmiana zmiennej zadziała wstecz.
 */

async function wczytajNarzedzia() {
  vi.resetModules();
  const m = await import("./local-tools.js");
  return m.narzedziaLokalne;
}

beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("ręka na maszynie — domyślnie ZERO narzędzi", () => {
  it("bez żadnej zmiennej model nie widzi ani jednego narzędzia maszyny", async () => {
    vi.stubEnv("MOSADD_AGENT_RECE", "");
    expect(await wczytajNarzedzia()).toHaveLength(0);
  });

  // ⛔ KIERUNEK AWARII. Każda z tych wartości to „ktoś próbował włączyć i nie trafił" albo
  // „konfiguracja się rozjechała". Wszystkie muszą dać ciszę, nie otwartą rękę.
  it.each([
    ["pusta wartość", ""],
    ["true", "true"],
    ["yes", "yes"],
    ["TAK", "TAK"],
    ["0", "0"],
    ["1 ze spacją", " 1"],
    ["dwa", "2"],
    ["on", "on"],
  ])("nie włącza się na wartość, która nie jest dokładnym \"1\": %s", async (_o, wartosc) => {
    vi.stubEnv("MOSADD_AGENT_RECE", wartosc);
    expect(await wczytajNarzedzia()).toHaveLength(0);
  });

  it("samo włączenie POLECEŃ nie wskrzesza reszty ręki", async () => {
    // Stara furtka. Gdyby ktoś ustawił tylko ją, licząc że „przecież odczyt zawsze działał".
    vi.stubEnv("MOSADD_AGENT_KOMPUTER", "1");
    vi.stubEnv("MOSADD_AGENT_RECE", "");
    expect(await wczytajNarzedzia()).toHaveLength(0);
  });

  it("wskazanie korzenia katalogu też nie jest włącznikiem", async () => {
    vi.stubEnv("MOSADD_AGENT_ROOT", "C:/tmp/piaskownica");
    vi.stubEnv("MOSADD_AGENT_RECE", "");
    expect(await wczytajNarzedzia()).toHaveLength(0);
  });
});

describe("SABOTAŻ — dołożenie narzędzia nie omija wyłącznika", () => {
  /**
   * ⛔ TO JEST TEST, O KTÓRY PROSIŁ DOWODZĄCY WYDANIEM: „dopisz narzędzie do listy i sprawdź,
   * że dalej jest odmowa". Wyłącznik stoi na CAŁEJ liście, nie przy poszczególnych narzędziach,
   * więc dopisanie dziesiątego czy setnego niczego nie otwiera. Ten test przypina tę własność do
   * liczby: gdy ręka jest wyłączona, długość listy wynosi ZERO niezależnie od tego, ile narzędzi
   * zdefiniowano w module.
   */
  it("przy wyłączonej ręce lista ma zero pozycji, choć w module zdefiniowano ich pięć", async () => {
    vi.stubEnv("MOSADD_AGENT_RECE", "");
    vi.stubEnv("MOSADD_AGENT_KOMPUTER", "1");
    vi.resetModules();
    const m = await import("./local-tools.js");
    // Narzędzia SĄ w module — nie usunęliśmy ich, tylko odcięliśmy wydawanie.
    expect(typeof m.receWlaczone).toBe("function");
    expect(m.narzedziaLokalne).toHaveLength(0);
  });

  it("po jawnym włączeniu wracają WSZYSTKIE — żeby było widać, co dokładnie odcinamy", async () => {
    vi.stubEnv("MOSADD_AGENT_RECE", "1");
    vi.stubEnv("MOSADD_AGENT_KOMPUTER", "");
    const n = await wczytajNarzedzia();
    const nazwy = n.map((x: { name: string }) => x.name).sort();
    expect(nazwy).toEqual(["komputer_czytaj", "komputer_pliki", "komputer_stan", "komputer_zrzut"]);
  });

  it("z ręką i poleceniami dochodzi szósta pozycja, nie wcześniej", async () => {
    vi.stubEnv("MOSADD_AGENT_RECE", "1");
    vi.stubEnv("MOSADD_AGENT_KOMPUTER", "1");
    const n = await wczytajNarzedzia();
    expect(n.map((x: { name: string }) => x.name)).toContain("komputer_uruchom");
    expect(n).toHaveLength(5);
  });

  // ⛔ ZRZUT EKRANU JEST POWODEM, DLA KTÓREGO ZAWĘŻENIE KORZENIA NIE WYSTARCZYŁO.
  // Fotografuje CAŁY ekran i tylko ZAPISUJE plik wewnątrz korzenia — piaskownica katalogu go
  // nie ogranicza. Ten test pilnuje, żeby przy wyłączonej ręce nie było go w liście w ogóle.
  it("zrzut ekranu jest niedostępny przy wyłączonej ręce, mimo wskazanego korzenia", async () => {
    vi.stubEnv("MOSADD_AGENT_RECE", "");
    vi.stubEnv("MOSADD_AGENT_ROOT", "C:/tmp/piaskownica");
    const n = await wczytajNarzedzia();
    expect(n.map((x: { name: string }) => x.name)).not.toContain("komputer_zrzut");
  });
});
