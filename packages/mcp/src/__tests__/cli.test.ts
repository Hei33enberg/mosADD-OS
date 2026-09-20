/**
 * M71 — `mosadd <verb>` MA BYĆ WIERSZEM POLECEŃ, A NIE JEDNĄ GAŁĘZIĄ „uruchom serwer".
 *
 * Zmierzone 19.09 (audyt): `src/bin/mcp.ts` obsługiwał wyłącznie `login | logout | whoami`;
 * każde inne słowo — także literówka — uruchamiało serwer MCP po stdio i WISIAŁO, czekając na
 * protokół na stdin. Człowiek z zainstalowanym `@mosadd/mcp` nie miał żadnego sposobu, żeby
 * wysłać jedną wiadomość bez odpalania agenta.
 *
 * ── CO TEN PLIK TRZYMA ──────────────────────────────────────────────────────────────────────
 *  1. Każdy czasownik wskazuje ISTNIEJĄCE narzędzie z `allTools` — CLI nie ma własnej
 *     implementacji niczego, więc nie ma czego rozjechać z serwerem.
 *  2. Argumenty wiersza poleceń składają się w wejście, które PRZECHODZI schemat zod tego
 *     narzędzia. To jedyna asercja, która naprawdę dowodzi, że komenda zadziała.
 *  3. ⛔ NIEZNANE SŁOWO NADAL URUCHAMIA SERWER. Hosty MCP odpalają `npx -y @mosadd/mcp`,
 *     czasem z własnymi przełącznikami; gdyby CLI przechwytywało wszystko, ta zmiana
 *     wyłączyłaby serwer ludziom, którzy o CLI nie prosili.
 *  4. `mosadd help` wymienia każdy czasownik — pomoc, która milczy o komendzie, jest
 *     dokładnie tak samo bezużyteczna jak brak komendy.
 *  5. ⛔ KOLUMNA, KTÓRĄ CZŁOWIEK NAPRAWDĘ ZOBACZY (dopisane 20.09 po audycie). Punkty 1–3
 *     sprawdzały WEJŚCIE narzędzia i nie mówiły nic o tym, co się drukuje. A rozjazd był
 *     właśnie na wyjściu: `render` czytał `m.sent_at` z `mDM_list` i `mIRC_list_messages`,
 *     które zwracają `timestamp` — więc `mosadd inbox` i `mosadd read` drukowały każdy wiersz
 *     z PUSTĄ kolumną czasu, bez jednego błędu. Teraz wiersz jest renderowany naprawdę,
 *     z danych o kształcie zadeklarowanym przez samo narzędzie.
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { allTools } from "../tools/index.js";
import { isCliCommand, TOOL_VERBS } from "../bin/cli-verbs.js";
import { VERBS } from "../bin/cli.js";
import type { MdmMessage, MdmContact } from "../tools/mdm.js";
import type { MyAgent } from "../tools/mdm-as-agent.js";
import type { MircMessage } from "../tools/mirc-messages.js";
import type { MircChannel } from "../tools/mirc.js";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(here, "../bin/cli.ts");
const BIN = resolve(here, "../bin/mcp.ts");
const zrodloCli = readFileSync(CLI, "utf8");

/** Czasowniki i ich narzędzia — z TABELI, nie z przepisanej listy. */
function czasowniki(): { verb: string; tool: string }[] {
  return TOOL_VERBS.map((verb) => ({ verb, tool: VERBS[verb].tool }));
}

/**
 * Wyrenderuj wynik narzędzia tak, jak zrobi to `mosadd <verb>`.
 *
 * ⛔ FIKSTURY SĄ TYPOWANE KSZTAŁTEM NARZĘDZIA (`MdmMessage` itd.), a nie wymyślone tutaj.
 * To jest cała wartość tego helpera: gdyby narzędzie przemianowało pole, fikstura przestałaby
 * się kompilować RAZEM z kolumną — zamiast obie po cichu rozjechać się w przeciwne strony.
 */
function render(verb: (typeof TOOL_VERBS)[number], wynik: unknown): string {
  const r = VERBS[verb].render;
  expect(r, `czasownik ${verb} nie ma czym rysować wiersza`).toBeTruthy();
  return r!(wynik);
}

describe("M71 — wiersz poleceń mosadd", () => {
  it("1. każdy czasownik wskazuje narzędzie, które NAPRAWDĘ jest zarejestrowane", () => {
    const zarejestrowane = new Set(allTools.map((t) => t.name));
    const lista = czasowniki();
    expect(lista.length, "tabela VERBS pusta — CLI znów nic nie umie").toBeGreaterThanOrEqual(7);
    for (const { verb, tool } of lista) {
      expect(zarejestrowane.has(tool), `mosadd ${verb} → "${tool}" nie istnieje w allTools`).toBe(true);
    }
  });

  it("2. CLI nie implementuje żadnej operacji samo — zero własnych zapytań sieciowych", () => {
    // Jedno `fetch` tutaj = druga kopia prawdy o module i cicha rozbieżność z narzędziem.
    expect(zrodloCli).not.toMatch(/\bfetch\s*\(/);
    expect(zrodloCli).not.toMatch(/createClient\s*\(/);
  });

  it("3. typowe wywołania przechodzą schemat zod swojego narzędzia", () => {
    const narzedzie = (n: string) => allTools.find((t) => t.name === n)!;
    // Dokładnie to, co złoży `build` dla `mosadd send bob@mosadd.com cześć`.
    expect(() => narzedzie("mDM_send").inputSchema.parse({ to: "bob@mosadd.com", text: "cześć" })).not.toThrow();
    expect(() => narzedzie("mIRC_post_message").inputSchema.parse({ channel_id: "11111111-2222-4333-8444-555566667777", text: "melduję" })).not.toThrow();
    expect(() => narzedzie("mRAG_search").inputSchema.parse({ query: "co ustalono w sprawie cennika" })).not.toThrow();
    expect(() => narzedzie("mDM_list_contacts").inputSchema.parse({})).not.toThrow();
    expect(() => narzedzie("mDM_list_my_agents").inputSchema.parse({})).not.toThrow();
    expect(() => narzedzie("mIRC_list").inputSchema.parse({})).not.toThrow();
    // Brak treści MUSI być odmową ze schematu, a nie pustą wiadomością wysłaną w świat.
    expect(() => narzedzie("mDM_send").inputSchema.parse({ to: "bob@mosadd.com", text: "" })).toThrow();
  });

  it("4. ⛔ nieznane słowo NIE jest komendą CLI — dalej uruchamia serwer MCP", () => {
    // ⛔ `constructor`/`toString`/`__proto__` są w tej liście NIE dla żartu: `sub in VERBS`
    //    zwraca dla nich `true` przez łańcuch prototypów, więc `mosadd constructor` wszedłby
    //    do CLI zamiast uruchomić serwer.
    for (const obce of ["--stdio", "serve", "", "-y", "@mosadd/mcp", "constructor", "toString", "__proto__"]) {
      expect(isCliCommand(obce), `"${obce}" przechwycone przez CLI — host MCP by nie wstał`).toBe(false);
    }
    expect(isCliCommand(undefined)).toBe(false);
    // A znane słowa muszą być rozpoznane, inaczej punkt 4 spełniłby też CLI, które nie robi nic.
    for (const swoje of ["send", "post", "channels", "contacts", "agents", "recall", "read", "inbox", "help", "tools", "call"]) {
      expect(isCliCommand(swoje), `"${swoje}" nie jest rozpoznawane`).toBe(true);
    }
  });

  it("5. binarka pyta CLI DOPIERO po uwierzytelnieniu sesji", () => {
    const bin = readFileSync(BIN, "utf8");
    const bootstrap = bin.indexOf("await bootstrapFromSavedSession()");
    const dispatch = bin.indexOf("isCliCommand(sub)");
    expect(bootstrap, "zniknął bootstrap sesji").toBeGreaterThan(0);
    expect(dispatch, "binarka nie woła CLI w ogóle").toBeGreaterThan(0);
    // Odwrotna kolejność = każda komenda na świeżo wygasłym tokenie pada „session expired".
    expect(dispatch).toBeGreaterThan(bootstrap);
    // login/logout/whoami zostają przed bootstrapem — logowanie nie może wymagać sesji.
    expect(bin.indexOf('sub === "login"')).toBeLessThan(bootstrap);
  });

  it("6. `mosadd help` wymienia KAŻDY czasownik", () => {
    const pomoc = zrodloCli.slice(zrodloCli.indexOf("function tekstPomocy"));
    for (const { verb } of czasowniki()) {
      expect(pomoc.includes(`VERBS[n]`) || pomoc.includes(verb), `help milczy o "${verb}"`).toBe(true);
    }
    // Pomoc buduje się z tabeli VERBS, więc nie może się z nią rozjechać — to jest asercja
    // na MECHANIZM, nie na tekst: ręcznie przepisana lista rozjechałaby się przy pierwszym dopisku.
    expect(pomoc).toContain("TOOL_VERBS.flatMap");
    // I wymienia drogę do pozostałych narzędzi, żeby „8 komend" nie brzmiało jak cały produkt.
    expect(pomoc).toContain("mosadd call");
  });

  it("7. ⛔ binarka ładuje `cli.js` DOPIERO w gałęzi komendy, nie przy starcie serwera", () => {
    // Zmierzone 20.09: `await import("./cli.js")` stał PRZED `if (isCliCommand(sub))`, a trzy
    // linijki wyżej komentarz obiecywał, że „przy starcie serwera ten moduł nigdy się nie
    // ładuje". Kto by w to uwierzył i dołożył do cli.ts efekt na poziomie modułu, wykonałby go
    // w środku uzgadniania JSON-RPC po stdio. Zdanie i kod muszą mówić to samo.
    // ⛔ KOMENTARZE PRECZ, i to nie jest szczegół: uzasadnienie tej naprawy CYTUJE feralną
    //    linijkę `await import("./cli.js")`, więc wyszukiwanie po surowym pliku trafiałoby
    //    w cytat i orzekało o kodzie na podstawie opisu kodu.
    const bin = readFileSync(BIN, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    const warunek = bin.indexOf("if (isCliCommand(sub))");
    const importCli = bin.indexOf('import("./cli.js")');
    expect(warunek, "zniknęła gałąź komendy").toBeGreaterThan(0);
    expect(importCli, "binarka w ogóle nie ładuje CLI").toBeGreaterThan(0);
    expect(importCli, "`cli.js` ładuje się przed warunkiem — czyli przy KAŻDYM starcie serwera").toBeGreaterThan(warunek);
    // A rozstrzygnięcie „czy to komenda" przychodzi z modułu, który nic nie ciąga i nic nie robi.
    expect(bin).toMatch(/import \{ isCliCommand \} from "\.\/cli-verbs\.js"/);
  });

  it("8. ⛔ `cli.ts` nie robi NICZEGO przy samym załadowaniu (ani bajtu na stdout)", async () => {
    // Drugi zamek do punktu 7, od strony przyczyny: gwarancja z mcp.ts jest warta tyle, ile
    // warta jest czystość tego modułu. Ładujemy go od zera i patrzymy, czy coś napisał.
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      vi.resetModules();
      await import("../bin/cli.js");
      expect(
        stdout,
        "cli.ts pisze na stdout już przy imporcie — to psuje uzgadnianie JSON-RPC hosta MCP",
      ).not.toHaveBeenCalled();
    } finally {
      stdout.mockRestore();
    }
  });
});

/**
 * ⛔ TO JEST TEN TEST, KTÓREGO BRAKOWAŁO. Punkty 1–3 dowodziły, że komenda DOJDZIE do
 * narzędzia. Żaden nie patrzył na to, co człowiek zobaczy — a usterka siedziała dokładnie tam:
 * dwie komendy drukowały pustą kolumnę czasu, bo `render` czytał pole, którego narzędzie nie
 * zwraca. Fikstury poniżej są typowane kształtem WYEKSPORTOWANYM PRZEZ NARZĘDZIE, więc
 * przemianowanie pola łamie kompilację po obu stronach naraz.
 */
describe("M71 — wiersz, który naprawdę zobaczy człowiek", () => {
  const KIEDY = "2026-09-20T07:05:00.000Z";
  /** `czas()` drukuje czas LOKALNY czytelnika, więc oczekiwanie liczymy tak samo, nie na sztywno. */
  const oczekiwanyCzas = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  it("`mosadd inbox` pokazuje CZAS każdej wiadomości, nie 38 spacji", () => {
    const messages: MdmMessage[] = [
      {
        id: "m1",
        sender_identity_id: "11111111-2222-4333-8444-555566667777",
        text: "melduję wykonanie",
        timestamp: KIEDY,
        thread_id: "dm:a:b",
        encrypted: true,
      },
    ];
    const linia = render("inbox", { messages, next_cursor: null, threads: ["dm:a:b"] });
    expect(linia).toContain("melduję wykonanie");
    expect(linia, "kolumna czasu pusta — dokładnie usterka z 20.09").toContain(oczekiwanyCzas(KIEDY));
    expect(linia, "wiersz zaczyna się od spacji, czyli czasu nie ma").not.toMatch(/^\s/);
  });

  it("`mosadd read` pokazuje CZAS każdej wiadomości kanału", () => {
    const messages: MircMessage[] = [
      { id: "c1", sender_identity_id: "11111111-2222-4333-8444-555566667777", text: "na kanale", timestamp: KIEDY },
    ];
    const linia = render("read", { messages, next_cursor: null });
    expect(linia).toContain("na kanale");
    expect(linia).toContain(oczekiwanyCzas(KIEDY));
  });

  it("kontakt bez nazwy pokazuje swój stan, a nie pustą kolumnę", () => {
    // `display_name` bywa `null` (zaproszenie jeszcze nieprzyjęte). Poprzedni zapasowy odczyt
    // wskazywał pole `handle`, którego `mDM_list_contacts` nie zwraca — czyli nie mógł zadziałać.
    const contacts: MdmContact[] = [
      { identity_id: "aaaaaaaa-2222-4333-8444-555566667777", account_id: null, display_name: null, state: "pending" },
      { identity_id: "bbbbbbbb-2222-4333-8444-555566667777", account_id: "acc", display_name: "Ala", state: "accepted" },
    ];
    const out = render("contacts", { contacts });
    expect(out).toContain("pending");
    expect(out).toContain("Ala");
  });

  it("`mosadd agents` i `mosadd channels` pokazują identyfikator, którym da się zawołać dalej", () => {
    const agents: MyAgent[] = [
      { identity_id: "cccccccc-2222-4333-8444-555566667777", address: "hermes@mosadd.com", display_name: "Hermes" },
      { identity_id: "dddddddd-2222-4333-8444-555566667777", address: null, display_name: null },
    ];
    const a = render("agents", { agents });
    expect(a).toContain("hermes@mosadd.com");
    // Agent bez adresu wciąż musi dać się wskazać — inaczej wiersz jest ozdobą.
    expect(a).toContain("dddddddd-2222-4333-8444-555566667777");

    const channels: MircChannel[] = [
      {
        id: "eeeeeeee-2222-4333-8444-555566667777",
        channel_key: "command",
        name: "command",
        description: null,
        visibility: "private",
        access_mode: "invite",
        password_hash: false,
        capabilities: null,
        metadata: {},
        owner_identity_id: "ffffffff-2222-4333-8444-555566667777",
        created_at: KIEDY,
        updated_at: null,
        member_role: "owner",
        member_state: "active",
        linked_space_id: null,
      },
    ];
    const c = render("channels", { channels });
    // ⛔ `mosadd post <channel_id>` bierze DOKŁADNIE tę wartość — kanał bez id jest ślepy.
    expect(c).toContain("eeeeeeee-2222-4333-8444-555566667777");
    expect(c).toContain("command");
  });

  it("pusta lista mówi wprost, że jest pusta", () => {
    expect(render("inbox", { messages: [] })).toBe("(pusto)");
    expect(render("channels", { channels: [] })).toBe("(pusto)");
    // Odpowiedź bez oczekiwanego pola też nie może wybuchnąć w twarz człowiekowi.
    expect(render("inbox", {})).toBe("(pusto)");
  });
});
