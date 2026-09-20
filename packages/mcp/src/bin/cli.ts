/**
 * `mosadd <verb>` — THE mosADD COMMAND LINE.
 *
 * ── DLACZEGO TO POWSTAŁO (M71, audyt 19.09) ─────────────────────────────────────────────────
 * Do 20.09 polecenie `mosadd` umiało dokładnie trzy rzeczy: `login`, `logout`, `whoami`.
 * KAŻDE inne słowo — `mosadd send`, `mosadd channels`, literówka, cokolwiek — spadało do
 * jednej gałęzi „uruchom serwer MCP po stdio" i wisiało, czekając na protokół na stdin.
 * Człowiek z zainstalowanym `@mosadd/mcp` nie miał więc ŻADNEGO sposobu, żeby wysłać jedną
 * wiadomość bez odpalania agenta: osiemdziesiąt pięć narzędzi istniało wyłącznie dla maszyn.
 *
 * ── ZASADA: ZERO DRUGIEJ PRAWDY ─────────────────────────────────────────────────────────────
 * Ten plik NIE implementuje ani jednej operacji. Każda komenda wskazuje NAZWĘ narzędzia z
 * `allTools` i woła jego `handler` z tym samym `ctx`, co serwer MCP. Skutek: CLI nie może
 * rozjechać się z narzędziami, bo nie ma czego rozjechać — dodanie pola do `mDM_send` działa
 * w CLI w tej samej sekundzie. Gdyby zamiast tego stało tu własne `fetch`, mielibyśmy drugą
 * kopię prawdy o każdym module i dokładnie tę klasę usterek, którą to repo zbiera od roku.
 *
 * ⛔ WEJŚCIE TO NIE WSZYSTKO — WYJŚCIE TEŻ JEST PRAWDĄ O NARZĘDZIU. I właśnie tam ta zasada
 * została złamana w dniu, w którym ją napisano (audyt 20.09): `render` czytał `m.sent_at`
 * z wyniku `mDM_list` i `mIRC_list_messages`, a żadne z nich takiego pola nie zwraca — czas
 * nazywa się `timestamp`, a `sent_at` żyje wyłącznie w zaszyfrowanej kopercie. Skutek:
 * `mosadd inbox` i `mosadd read` drukowały KAŻDY wiersz z pustą kolumną czasu, w nieskończoność
 * i bez jednego błędu. tsc tego nie widział, bo stary `asArray()` gasił typ do
 * `Record<string, unknown>[]`, w którym każde pole „istnieje" i jest `unknown`.
 *
 * NAPRAWA JEST W TYPIE, NIE W POPRAWIONEJ LITERCE: `asArray<T>` bierze teraz kształt wiersza
 * WYEKSPORTOWANY z modułu narzędzia (`MdmMessage`, `MircMessage`, `MdmContact`, `MyAgent`,
 * `MircChannel`), więc sięgnięcie po pole, którego narzędzie nie zwraca, nie kompiluje się.
 * Kolumny wracają do bycia odczytem z jednej deklaracji, a nie przepisaniem z pamięci.
 *
 * ── CO ZOSTAJE NIETKNIĘTE ───────────────────────────────────────────────────────────────────
 * ⛔ NIEZNANE SŁOWO DALEJ URUCHAMIA SERWER. Hosty MCP (Claude Code, Cursor, Windsurf…) mają w
 * konfiguracji `npx -y @mosadd/mcp` i część z nich dokłada własne przełączniki. Gdyby nieznany
 * argument stał się błędem, ta zmiana wyłączyłaby serwer u ludzi, którzy o żadnym CLI nie
 * prosili. Przechwytujemy WYŁĄCZNIE słowa z `VERBS` — reszta idzie tą samą drogą co zawsze.
 *
 * ⛔ WYNIK NA stdout, DIAGNOSTYKA NA stderr. Dokładnie jak w serwerze: stdout bywa kanałem
 * protokołu i zaśmiecenie go psuje hosty. Tu wychodzi na stdout tylko to, co człowiek (albo
 * `jq`) ma przeczytać.
 */

import { allTools, TOOL_COUNT } from "../tools/index.js";
import { defaultProviders } from "../server.js";
import type { MosaddTool, MosaddToolContext } from "../types.js";
// ⛔ TYLKO TYPY. Kształt każdego wiersza pochodzi z modułu narzędzia, które go produkuje —
//    jedna deklaracja, po której tsc sprawdza kolumny poniżej. `import type` znika przy
//    kompilacji, więc nie dokłada ani jednego bajtu do tego, co ładuje się przy starcie.
import type { MdmMessage, MdmContact } from "../tools/mdm.js";
import type { MyAgent } from "../tools/mdm-as-agent.js";
import type { MircMessage } from "../tools/mirc-messages.js";
import type { MircChannel } from "../tools/mirc.js";
// Nazwy czasowników mieszkają w osobnym, bezzależnościowym module, żeby `bin/mcp.ts` mógł
// rozstrzygnąć „czy to komenda?" BEZ ładowania tego pliku przy starcie serwera MCP.
// `Record<ToolVerb, Verb>` niżej sprawia, że lista i tabela nie mogą się rozjechać.
import { AUTH_VERBS, TOOL_VERBS, type ToolVerb } from "./cli-verbs.js";

/** Jedna komenda: czasownik → narzędzie + zamiana argumentów wiersza poleceń na jego wejście. */
interface Verb {
  /** Nazwa narzędzia w `allTools`. Nigdy własna implementacja. */
  tool: string;
  /** Jak wygląda w `mosadd help`. */
  usage: string;
  summary: string;
  /** Pozycyjne argumenty + flagi → wejście narzędzia. Rzuca z ludzkim komunikatem. */
  build: (pos: string[], flags: Record<string, string>) => Record<string, unknown>;
  /** Jak pokazać wynik człowiekowi. Brak = surowy JSON. */
  render?: (result: unknown) => string;
}

function wymagane(pos: string[], n: number, usage: string): void {
  if (pos.length < n) throw new Error(`za mało argumentów — użycie: mosadd ${usage}`);
}

/** Reszta pozycyjnych sklejona w jedno zdanie, żeby nie trzeba było cytować spacji. */
function reszta(pos: string[], od: number, usage: string): string {
  const t = pos.slice(od).join(" ").trim();
  if (!t) throw new Error(`pusta treść — użycie: mosadd ${usage}`);
  return t;
}

function liczba(flags: Record<string, string>, nazwa: string): number | undefined {
  const v = flags[nazwa];
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`--${nazwa} oczekuje liczby, dostało "${v}"`);
  return n;
}

/**
 * Tabela wierszy. Czasowniki są KRÓTKIE i opisują CZYNNOŚĆ — `mosadd send`, nie
 * `mosadd mDM_send`. Pełne nazwy narzędzi zostają dostępne przez `mosadd call`, więc
 * osiemdziesiąt pięć narzędzi jest osiągalnych, a siedem najczęstszych ma własne drzwi.
 */
export const VERBS: Record<ToolVerb, Verb> = {
  contacts: {
    tool: "mDM_list_contacts",
    usage: "contacts [--limit N]",
    summary: "Kto jest w książce adresowej (z identity_id do `mosadd send`).",
    build: (_pos, flags) => ({ limit: liczba(flags, "limit") }),
    // Kontakt bez nazwy wyświetla stan zaproszenia (`pending`/`accepted`), a nie pustkę —
    // `display_name` bywa `null`, a poprzedni zapasowy odczyt (`handle`) wskazywał pole,
    // którego `mDM_list_contacts` nie zwraca, więc nie mógł nigdy zadziałać.
    render: (r) => wiersze(asArray<MdmContact>(r, "contacts"), (c) => [c.identity_id, c.display_name ?? c.state]),
  },
  send: {
    tool: "mDM_send",
    usage: "send <identity_id|handle> <treść…> [--thread etykieta]",
    summary: "Wyślij zaszyfrowaną wiadomość prywatną (mDM).",
    build: (pos, flags) => {
      wymagane(pos, 2, "send <identity_id|handle> <treść…>");
      return { to: pos[0], text: reszta(pos, 1, "send <identity_id|handle> <treść…>"), thread_label: flags.thread };
    },
  },
  inbox: {
    tool: "mDM_list",
    usage: "inbox <identity_id> [--limit N] [--thread etykieta]",
    summary: "Przeczytaj rozmowę z jednym kontaktem.",
    build: (pos, flags) => {
      wymagane(pos, 1, "inbox <identity_id>");
      return { contact_id: pos[0], limit: liczba(flags, "limit"), thread_label: flags.thread };
    },
    render: (r) => wiersze(asArray<MdmMessage>(r, "messages"), (m) => [czas(m.timestamp), m.text]),
  },
  agents: {
    tool: "mDM_list_my_agents",
    usage: "agents",
    summary: "Agenci, którymi ta sesja może się podpisać.",
    build: () => ({}),
    render: (r) => wiersze(asArray<MyAgent>(r, "agents"), (a) => [a.address ?? a.identity_id, a.display_name ?? ""]),
  },
  channels: {
    tool: "mIRC_list",
    usage: "channels [--limit N]",
    // Lewa kolumna wyniku to pole `id` kanału — i to ono jest argumentem `mosadd post`.
    summary: "Kanały, które ta sesja widzi (lewa kolumna = argument `mosadd post`).",
    build: (_pos, flags) => ({ limit: liczba(flags, "limit") }),
    render: (r) => wiersze(asArray<MircChannel>(r, "channels"), (c) => [c.id, c.name ?? ""]),
  },
  post: {
    tool: "mIRC_post_message",
    usage: "post <channel_id> <treść…> [--agent adres@mosadd.com]",
    summary: "Napisz na kanale — opcjonalnie jako własny agent.",
    build: (pos, flags) => {
      wymagane(pos, 2, "post <channel_id> <treść…>");
      return { channel_id: pos[0], text: reszta(pos, 1, "post <channel_id> <treść…>"), agent: flags.agent };
    },
  },
  read: {
    tool: "mIRC_list_messages",
    usage: "read <channel_id> [--limit N]",
    summary: "Przeczytaj ostatnie wiadomości z kanału.",
    build: (pos, flags) => {
      wymagane(pos, 1, "read <channel_id>");
      return { channel_id: pos[0], limit: liczba(flags, "limit") };
    },
    render: (r) => wiersze(asArray<MircMessage>(r, "messages"), (m) => [czas(m.timestamp), m.text]),
  },
  recall: {
    tool: "mRAG_search",
    usage: "recall <pytanie…> [--top N]",
    summary: "Zapytaj własną pamięć mRAG.",
    build: (pos, flags) => ({ query: reszta(pos, 0, "recall <pytanie…>"), top_k: liczba(flags, "top") }),
  },
};

/** `--klucz wartość` oraz `--flaga`; pozostałe słowa są pozycyjne (także te z myślnikiem w środku). */
function parseArgs(args: string[]): { pos: string[]; flags: Record<string, string> } {
  const pos: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a.startsWith("--")) {
      const nast = args[i + 1];
      flags[a.slice(2)] = nast !== undefined && !nast.startsWith("--") ? args[(i += 1)] : "true";
    } else {
      pos.push(a);
    }
  }
  return { pos, flags };
}

/**
 * Wyciąga tablicę `pole` z odpowiedzi narzędzia.
 *
 * ⛔ PARAMETR `T` NIE JEST OZDOBĄ — to jedyne miejsce, w którym tsc może złapać kolumnę
 * czytającą nieistniejące pole. `handler` oddaje `unknown` (bo jest wspólny dla 85 narzędzi),
 * więc rzutowanie tutaj jest nieuniknione; rzecz w tym, ŻEBY RZUTOWAĆ NA TYP WYEKSPORTOWANY
 * PRZEZ NARZĘDZIE, a nie na `Record<string, unknown>`, w którym każde wymyślone pole
 * „istnieje" i jest `unknown`. Ta druga wersja przepuściła `m.sent_at` i dała dwie komendy
 * drukujące pustą kolumnę czasu w każdym wierszu (audyt 20.09).
 */
function asArray<T = Record<string, unknown>>(result: unknown, pole: string): T[] {
  const r = result as Record<string, unknown> | null;
  const v = r && typeof r === "object" ? r[pole] : null;
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * ISO-8601 → `RRRR-MM-DD GG:MM` (czas lokalny czytelnika). Pełne `2026-09-20T01:40:12.345Z`
 * zabiera w wierszu tyle miejsca co UUID, a sekundy i strefa nie mówią człowiekowi nic, czego
 * nie mówi minuta. Wejście, którego nie da się sparsować, wraca BEZ ZMIAN — lepiej pokazać
 * dziwny napis niż zamienić go w „Invalid Date".
 */
function czas(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Dwie kolumny, jedna linia na pozycję, bez ramek. Terminal to nie tabela HTML, a długie
 * zdanie łamane przez powłokę w losowym miejscu czyta się gorzej niż obcięte.
 *
 * Szerokość lewej kolumny liczona z DANYCH (do 38 znaków — tyle ma UUID z zapasem). Sztywne
 * 38 dosuwało szesnastoznakowy czas dwudziestoma dwoma spacjami, przez co treść zaczynała się
 * za połową ekranu telefonu i zwijała się w kolejny wiersz.
 */
function wiersze<T>(items: T[], cols: (i: T) => (string | undefined)[]): string {
  if (items.length === 0) return "(pusto)";
  const pary = items.map((i) => {
    const [a, b] = cols(i);
    return [String(a ?? "").slice(0, 38), String(b ?? "").replace(/\s+/g, " ").slice(0, 80)] as const;
  });
  const szer = Math.max(...pary.map(([a]) => a.length));
  return pary.map(([a, b]) => `${a.padEnd(szer)}  ${b}`).join("\n");
}

function tekstPomocy(): string {
  const linie = [
    "mosadd — wiersz poleceń mosADD.",
    "",
    "  mosadd                       uruchom serwer MCP po stdio (dla Claude Code, Cursora, …)",
    "",
    "KONTO",
    ...AUTH_VERBS.map((v) => `  mosadd ${v.padEnd(24)}${v === "login" ? "zaloguj i zapisz sesję" : v === "logout" ? "wyczyść zapisaną sesję" : "czyja sesja jest zapisana"}`),
    "",
    "ROZMOWA",
    // Dwie linie na komendę, nie jedna z padEnd: użycia mają od 8 do 60 znaków, więc kolumna
    // stała albo rozpychała terminal, albo sklejała opis z użyciem (zmierzone na `mosadd help`).
    // Idziemy po `TOOL_VERBS`, a nie po `Object.entries(VERBS)`: kolejność wierszy pomocy jest
    // wtedy TĄ SAMĄ, zadeklarowaną listą, a nie kolejnością wpisów w literale obiektu.
    ...TOOL_VERBS.flatMap((n) => [`  mosadd ${VERBS[n].usage}`, `      ${VERBS[n].summary}  [${VERBS[n].tool}]`]),
    "",
    "WSZYSTKO POZOSTAŁE",
    `  mosadd tools [fragment]      wypisz zarejestrowane narzędzia (${TOOL_COUNT})`,
    "  mosadd call <narzędzie> [--pole wartość …] [--json '{…}']",
    "                               zawołaj DOWOLNE narzędzie po nazwie",
    "",
    "  --json                       wypisz surową odpowiedź narzędzia zamiast listy",
    "",
    "Każda komenda działa na sesji z `mosadd login` albo na MOSADD_API_KEY ze środowiska.",
  ];
  return linie.join("\n");
}

function znajdzNarzedzie(nazwa: string): MosaddTool {
  const t = allTools.find((x) => x.name === nazwa);
  if (!t) {
    const podobne = allTools
      .map((x) => x.name)
      .filter((n) => n.toLowerCase().includes(nazwa.toLowerCase()))
      .slice(0, 5);
    throw new Error(
      `nie ma narzędzia "${nazwa}"` + (podobne.length ? `. Może chodziło o: ${podobne.join(", ")}` : ". Zobacz `mosadd tools`."),
    );
  }
  return t;
}

function kontekst(): MosaddToolContext {
  return {
    options: {
      apiKey: process.env.MOSADD_API_KEY,
      hubUrl: process.env.MOSADD_HUB_URL ?? "https://mcp.mosadd.com",
      mode: (process.env.MOSADD_MODE as MosaddToolContext["options"]["mode"]) ?? (process.env.MOSADD_API_KEY ? "cloud" : "local"),
    },
    providers: defaultProviders(),
    // CLI: diagnostyka na stderr, tak jak w serwerze. `--verbose` podnosi próg.
    log: (level, msg, extra) => {
      if (process.env.MOSADD_LOG_LEVEL === "debug" || level === "error" || level === "warn") {
        process.stderr.write(JSON.stringify({ level, msg, extra }) + "\n");
      }
    },
  };
}

/** Usuwa pola `undefined` — inaczej zod z `.optional()` dostaje klucz i traktuje go jako podany. */
function bezPustych(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}

export async function runCliCommand(sub: string, args: string[]): Promise<void> {
  const { pos, flags } = parseArgs(args);
  const surowo = flags.json !== undefined;

  if (sub === "help") {
    process.stdout.write(tekstPomocy() + "\n");
    return;
  }

  if (sub === "tools") {
    const fragment = (pos[0] ?? "").toLowerCase();
    const lista = allTools.filter((t) => !fragment || t.name.toLowerCase().includes(fragment));
    if (lista.length === 0) {
      process.stdout.write(`(żadne z ${TOOL_COUNT} narzędzi nie pasuje do "${pos[0]}")\n`);
      return;
    }
    process.stdout.write(
      lista.map((t) => `${t.name.padEnd(28)}  ${(t.title ?? "").slice(0, 70)}`).join("\n") +
        `\n\n${lista.length} z ${TOOL_COUNT}\n`,
    );
    return;
  }

  let nazwaNarzedzia: string;
  let wejscie: Record<string, unknown>;
  let render: Verb["render"];

  if (sub === "call") {
    wymagane(pos, 1, "call <narzędzie> [--pole wartość …]");
    nazwaNarzedzia = pos[0];
    // `--json '{…}'` to jedyna droga do pól, które nie są napisami (liczby, tablice, obiekty).
    // Bez tego `mosadd call` umiałby wołać tylko narzędzia o wejściu wyłącznie tekstowym.
    const zJsona = flags.json && flags.json !== "true" ? (JSON.parse(flags.json) as Record<string, unknown>) : {};
    const { json: _pominiete, ...reszteFlag } = flags;
    wejscie = { ...reszteFlag, ...zJsona };
  } else {
    // `sub` przychodzi z wiersza poleceń, więc jest zwykłym napisem — sprawdzamy go listą,
    // a nie indeksowaniem obiektu (to ta sama pułapka prototypów co w `isCliCommand`).
    const verb = (TOOL_VERBS as readonly string[]).includes(sub) ? VERBS[sub as ToolVerb] : undefined;
    if (!verb) throw new Error(`nieznana komenda "${sub}" — zobacz \`mosadd help\``);
    nazwaNarzedzia = verb.tool;
    wejscie = bezPustych(verb.build(pos, flags));
    render = verb.render;
  }

  const narzedzie = znajdzNarzedzie(nazwaNarzedzia);
  // Walidacja JEGO schematem, nie naszym: komunikat o brakującym polu pochodzi z jednego
  // miejsca, w którym to pole jest zadeklarowane.
  const sparsowane = narzedzie.inputSchema.parse(wejscie);
  const wynik = await narzedzie.handler(sparsowane as never, kontekst());

  if (surowo || !render) {
    process.stdout.write(JSON.stringify(wynik, null, 2) + "\n");
    return;
  }
  process.stdout.write(render(wynik) + "\n");
}
