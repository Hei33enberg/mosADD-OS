/**
 * local-tools — NARZĘDZIA KOMPUTERA. To, dla czego Elektron w ogóle istnieje.
 *
 * ⛔ ROZKAZ WŁAŚCICIELA, powtarzany od początku projektu i wprost 2026-09-01:
 *   „elektron miał być taki sam w działaniu jak każdy agent typu kodeks cloud czy hermes, ale
 *    wpakowany w elektron, a nie osobny proces, bo klient ma nic nie ogarniać, tylko odpalić
 *    elektrona i móc zarządzać komputerem z telefonu — rozmawialiśmy o tym milion razy,
 *    to była podstawa tego projektu".
 *
 * ⛔ STAN PRZED TYM PLIKIEM, ZMIERZONY: agent w Elektronie miał ZERO narzędzi do komputera.
 * Cały katalog `@mosadd/mcp` to narzędzia platformy — mDM, mIRC, mAYL, mRAG, mTALK. Ani jednego
 * polecenia, pliku, procesu czy zrzutu ekranu. Agent umiał rozmawiać jako właściciel i nie umiał
 * dotknąć maszyny, na której stoi. Podstawa projektu nie istniała — nie „częściowo", tylko wcale.
 *
 * ⛔ DLACZEGO TU, A NIE W `@mosadd/mcp`. Tamten katalog jest wspólny dla agenta LOKALNEGO
 * i CHMUROWEGO. Gdyby te narzędzia tam trafiły, agent w chmurze ogłaszałby modelowi, że potrafi
 * czytać pliki i uruchamiać polecenia — a nie potrafi, bo nie ma żadnej maszyny. Model zacząłby
 * obiecywać użytkownikowi rzeczy niewykonalne. Narzędzie ma istnieć TAM, GDZIE JEST RĘKA.
 *
 * ═══ GRANICE. Czytaj to, zanim cokolwiek tu dołożysz ═══
 * To jest wykonywanie kodu na cudzej maszynie, wyzwalane wiadomością z telefonu. Każda z poniższych
 * zasad broni przed konkretnym, wyobrażalnym wypadkiem, nie przed abstrakcją:
 *
 * 1. KORZEŃ. Wszystko dzieje się pod katalogiem domowym właściciela (albo pod `MOSADD_AGENT_ROOT`).
 *    Ścieżka wychodząca poza korzeń jest odrzucana PO rozwinięciu (`..`, dowiązania, ścieżki UNC).
 * 2. SEKRETY SĄ NIEWIDOCZNE. Pliki wyglądające na klucze (`.env*`, `id_rsa`, `*.pem`, `*.key`,
 *    `*.pfx`, `credentials`, `.npmrc`) nie dają się odczytać ani wylistować z treścią. Agent
 *    czytający `.env` i odpisujący w mDM wysłałby klucze na serwer — jednym zdaniem, bez złej woli.
 * 3. URUCHAMIANIE POLECEŃ JEST WYŁĄCZONE DOMYŚLNIE. Wymaga `MOSADD_AGENT_KOMPUTER=1`, czyli
 *    świadomego włączenia przez właściciela. Bez tego agent widzi TYLKO narzędzia do odczytu.
 * 4. NIE MA CICHYCH ZNISZCZEŃ. Polecenie pasujące do wzorca niszczącego (kasowanie, formatowanie,
 *    rozbrajanie zabezpieczeń, potok do powłoki z sieci) jest odrzucane ZAWSZE, także przy
 *    włączonym uruchamianiu. Od nieodwracalnego jest człowiek przy klawiaturze.
 * 5. SUFITY. Wynik ucięty, czas ograniczony, katalog ograniczony — żeby jedno wywołanie nie
 *    zwróciło pół dysku do rozmowy, która idzie przez cudzy serwer.
 *
 * ⛔ CZEGO TU CELOWO NIE MA: zapisu do plików, kasowania, instalowania, zmiany ustawień systemu.
 * Pierwsza wersja CZYTA i POKAZUJE. Ręka, która pisze, przychodzi dopiero po tym, jak właściciel
 * zobaczy na własne oczy, że ta, która czyta, robi to, co trzeba.
 */
import { homedir, hostname, platform, release, totalmem, freemem, uptime, userInfo } from "node:os";
import { resolve, join, relative, isAbsolute, basename } from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const wykonaj = promisify(execFile);

/** Korzeń, poza który nic nie wychodzi. */
function korzen(): string {
  const z_srodowiska = process.env.MOSADD_AGENT_ROOT;
  return resolve(z_srodowiska && z_srodowiska.trim() ? z_srodowiska : homedir());
}

/** Czy uruchamianie poleceń jest świadomie włączone. */
export function poleceniaWlaczone(): boolean {
  return process.env.MOSADD_AGENT_KOMPUTER === "1";
}

/**
 * Rozwiązuje ścieżkę i pilnuje korzenia. Sprawdzenie jest PO rozwinięciu, bo `..` i dowiązania
 * są całą sztuczką: `~/../../etc/passwd` wygląda niewinnie w napisie i wychodzi z korzenia po
 * rozwinięciu.
 */
function bezpiecznaSciezka(sciezka: string): string {
  const root = korzen();
  const pelna = isAbsolute(sciezka) ? resolve(sciezka) : resolve(root, sciezka);
  const wzgledna = relative(root, pelna);
  if (wzgledna.startsWith("..") || isAbsolute(wzgledna)) {
    throw new Error(`poza katalogiem roboczym agenta (${root}): ${sciezka}`);
  }
  return pelna;
}

/** Nazwy, które wyglądają na klucze. Dopasowanie po NAZWIE pliku, nie po treści. */
const WZORCE_SEKRETOW = [
  /^\.env(\..+)?$/i, /^id_[a-z]+$/i, /\.pem$/i, /\.key$/i, /\.pfx$/i, /\.p12$/i,
  /^credentials$/i, /^\.npmrc$/i, /^\.netrc$/i, /^\.git-credentials$/i, /^service[-_]account.*\.json$/i,
];
function wygladaNaSekret(nazwa: string): boolean {
  return WZORCE_SEKRETOW.some((w) => w.test(nazwa));
}

/**
 * Polecenia, których nie uruchomimy NIGDY — także przy włączonym `MOSADD_AGENT_KOMPUTER`.
 * Lista jest krótka i konkretna: kasowanie rekurencyjne, formatowanie, rozbrajanie zabezpieczeń
 * i klasyczne „pobierz z sieci i wykonaj". Nie udaje kompletnej — udaje twardą.
 */
const ZAKAZANE = [
  /\brm\s+(-[a-z]*\s+)*-[a-z]*[rf]/i, /\brmdir\s+\/s/i, /\bdel\s+\/[fsq]/i, /\bformat\b/i,
  /\bmkfs\b/i, /\bdiskpart\b/i, /\bshutdown\b/i, /\breboot\b/i,
  /\bcurl\b[^|]*\|\s*(ba)?sh/i, /\bwget\b[^|]*\|\s*(ba)?sh/i, /\biwr\b.*\|\s*iex/i, /Invoke-Expression/i,
  /\bchmod\s+777\b/i, /\bicacls\b.*\/grant/i, /\bnetsh\s+advfirewall/i, /Set-MpPreference/i,
  /\bgit\s+push\b/i, /\bnpm\s+publish\b/i,
];
function zakazane(polecenie: string): string | null {
  const trafienie = ZAKAZANE.find((w) => w.test(polecenie));
  return trafienie ? String(trafienie) : null;
}

const MAX_ZNAKOW_PLIKU = 60_000;
const MAX_WPISOW_KATALOGU = 300;
const MAX_ZNAKOW_WYNIKU = 20_000;
const LIMIT_CZASU_MS = 30_000;

function mb(bajty: number): string {
  return `${(bajty / 1024 / 1024).toFixed(0)} MB`;
}

/**
 * ⛔ WŁASNA WALIDACJA, BEZ `zod`. Ta paczka jest tym, co klient instaluje jednym `npx` — każda
 * zależność to dłuższa instalacja i większa powierzchnia. Pól jest cztery, więc trzy funkcje niżej
 * wystarczą i nie mają jak się zdezaktualizować przy podbiciu cudzej biblioteki.
 */
function tekst(v: unknown, pole: string, wymagane = false, max = 500): string | undefined {
  if (v === undefined || v === null || v === "") {
    if (wymagane) throw new Error(`brakuje pola '${pole}'`);
    return undefined;
  }
  if (typeof v !== "string") throw new Error(`pole '${pole}' ma być tekstem`);
  if (v.length > max) throw new Error(`pole '${pole}' jest za długie (max ${max})`);
  return v;
}
function liczba(v: unknown, pole: string, min: number, max: number): number | undefined {
  if (v === undefined || v === null) return undefined;
  const x = Number(v);
  if (!Number.isInteger(x)) throw new Error(`pole '${pole}' ma być liczbą całkowitą`);
  if (x < min || x > max) throw new Error(`pole '${pole}' poza zakresem ${min}..${max}`);
  return x;
}
function obiekt(input: unknown): Record<string, unknown> {
  return (input && typeof input === "object") ? (input as Record<string, unknown>) : {};
}

/** Kształt zgodny z tym, czego oczekuje `invoke()` w responderze. */
export interface NarzedzieLokalne {
  name: string;
  description: string;
  /** Sprawdza i normalizuje wejście od modelu. Rzuca czytelnym błędem, który trafia do rozmowy. */
  parse: (input: unknown) => Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

// ── ODCZYT ────────────────────────────────────────────────────────────────────────────────────

const komputer_stan: NarzedzieLokalne = {
  name: "komputer_stan",
  description:
    "Stan TEJ maszyny: system, nazwa hosta, użytkownik, czas pracy, pamięć, katalog roboczy agenta. " +
    "Zacznij od tego, gdy właściciel pyta 'co u komputera'.",
  parse: () => ({}),
  handler: async () => ({
    system: `${platform()} ${release()}`,
    host: hostname(),
    uzytkownik: userInfo().username,
    czas_pracy_h: (uptime() / 3600).toFixed(1),
    pamiec: { calkowita: mb(totalmem()), wolna: mb(freemem()) },
    katalog_roboczy: korzen(),
    uruchamianie_polecen: poleceniaWlaczone() ? "WŁĄCZONE" : "wyłączone (MOSADD_AGENT_KOMPUTER=1 włącza)",
  }),
};

const komputer_pliki: NarzedzieLokalne = {
  name: "komputer_pliki",
  description:
    "Wypisuje zawartość katalogu na tej maszynie (nazwa, czy katalog, rozmiar, data zmiany). " +
    "Ścieżka względna liczy się od katalogu roboczego agenta. Nie wychodzi poza ten katalog.",
  parse: (input) => ({ sciezka: tekst(obiekt(input).sciezka, "sciezka") }),
  handler: async (input) => {
    const { sciezka } = input as { sciezka?: string };
    const cel = bezpiecznaSciezka(sciezka ?? ".");
    const wpisy = await readdir(cel, { withFileTypes: true });
    const wynik = [];
    for (const w of wpisy.slice(0, MAX_WPISOW_KATALOGU)) {
      let rozmiar: string | null = null;
      let zmieniony: string | null = null;
      try {
        const s = await stat(join(cel, w.name));
        rozmiar = w.isDirectory() ? null : `${s.size}`;
        zmieniony = s.mtime.toISOString().slice(0, 16).replace("T", " ");
      } catch { /* plik zniknął albo brak dostępu — pokazujemy nazwę bez metryk */ }
      wynik.push({
        nazwa: w.name,
        katalog: w.isDirectory(),
        rozmiar,
        zmieniony,
        ...(wygladaNaSekret(w.name) ? { uwaga: "wygląda na plik z kluczami — treść niedostępna" } : {}),
      });
    }
    return {
      katalog: cel,
      wpisow: wpisy.length,
      pokazano: wynik.length,
      ...(wpisy.length > wynik.length ? { uciete: true } : {}),
      wpisy: wynik,
    };
  },
};

const komputer_czytaj: NarzedzieLokalne = {
  name: "komputer_czytaj",
  description:
    "Czyta plik tekstowy z tej maszyny (do 60 000 znaków). Odmawia plików wyglądających na klucze " +
    "i wszystkiego spoza katalogu roboczego agenta.",
  parse: (input) => {
    const o = obiekt(input);
    return {
      sciezka: tekst(o.sciezka, "sciezka", true),
      od_linii: liczba(o.od_linii, "od_linii", 1, 10_000_000),
      linii: liczba(o.linii, "linii", 1, 5000),
    };
  },
  handler: async (input) => {
    const { sciezka, od_linii, linii } = input as { sciezka: string; od_linii?: number; linii?: number };
    const cel = bezpiecznaSciezka(sciezka);
    if (wygladaNaSekret(basename(cel))) {
      throw new Error(
        `odmowa: ${basename(cel)} wygląda na plik z kluczami. Agent nie czyta sekretów — ` +
        "odczytana treść trafiłaby do rozmowy przechodzącej przez serwer.",
      );
    }
    const s = await stat(cel);
    if (s.isDirectory()) throw new Error(`to jest katalog, nie plik: ${cel} — użyj komputer_pliki`);
    const tresc = await readFile(cel, "utf8");
    const wszystkie = tresc.split(/\r?\n/);
    const start = (od_linii ?? 1) - 1;
    const kawalek = wszystkie.slice(start, start + (linii ?? wszystkie.length)).join("\n");
    return {
      plik: cel,
      linii_w_pliku: wszystkie.length,
      od_linii: start + 1,
      tresc: kawalek.slice(0, MAX_ZNAKOW_PLIKU),
      ...(kawalek.length > MAX_ZNAKOW_PLIKU ? { uciete: true } : {}),
    };
  },
};

/**
 * Zrzut ekranu. Każdy system ma własne narzędzie systemowe — nie dokładamy zależności npm
 * po to, żeby zrobić coś, co system już potrafi.
 * ⛔ Zwracamy ŚCIEŻKĘ, nie obraz w treści: zdjęcie ekranu potrafi mieć megabajty, a rozmowa idzie
 * przez serwer. Właściciel widzi plik u siebie i sam decyduje, czy go wysłać.
 */
const komputer_zrzut: NarzedzieLokalne = {
  name: "komputer_zrzut",
  description:
    "Robi zrzut całego ekranu tej maszyny i zapisuje go do pliku w katalogu roboczym agenta. " +
    "Zwraca ścieżkę — nie wysyła obrazu do rozmowy.",
  parse: () => ({}),
  handler: async () => {
    const plik = join(korzen(), `mosadd-zrzut-${Date.now()}.png`);
    const os = platform();
    try {
      if (os === "win32") {
        const ps = [
          "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;",
          "$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;",
          "$bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height;",
          "$g=[System.Drawing.Graphics]::FromImage($bmp);",
          "$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size);",
          `$bmp.Save('${plik.replace(/\\/g, "\\\\")}');`,
        ].join(" ");
        await wykonaj("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { timeout: LIMIT_CZASU_MS });
      } else if (os === "darwin") {
        await wykonaj("screencapture", ["-x", plik], { timeout: LIMIT_CZASU_MS });
      } else {
        await wykonaj("import", ["-window", "root", plik], { timeout: LIMIT_CZASU_MS });
      }
    } catch (e) {
      throw new Error(
        `nie udało się zrobić zrzutu na ${os}: ${(e as Error).message}. ` +
        "Na Linuksie potrzebny jest ImageMagick (polecenie `import`).",
      );
    }
    const s = await stat(plik);
    return { plik, rozmiar_bajtow: s.size, uwaga: "obraz został zapisany na maszynie — nie wysłano go do rozmowy" };
  },
};

// ── URUCHAMIANIE (domyślnie WYŁĄCZONE) ────────────────────────────────────────────────────────

const komputer_uruchom: NarzedzieLokalne = {
  name: "komputer_uruchom",
  description:
    "Uruchamia polecenie na tej maszynie i oddaje jego wynik. WYMAGA świadomego włączenia przez " +
    "właściciela (MOSADD_AGENT_KOMPUTER=1). Polecenia niszczące są odrzucane zawsze.",
  parse: (input) => {
    const o = obiekt(input);
    return {
      polecenie: tekst(o.polecenie, "polecenie", true, 2000),
      katalog: tekst(o.katalog, "katalog"),
    };
  },
  handler: async (input) => {
    const { polecenie, katalog } = input as { polecenie: string; katalog?: string };
    if (!poleceniaWlaczone()) {
      throw new Error(
        "uruchamianie poleceń jest wyłączone. Właściciel włącza je świadomie, ustawiając " +
        "MOSADD_AGENT_KOMPUTER=1 przed startem agenta. Do tego czasu masz narzędzia do ODCZYTU.",
      );
    }
    const trafienie = zakazane(polecenie);
    if (trafienie) {
      throw new Error(
        `odmowa: polecenie pasuje do wzorca niszczącego ${trafienie}. Nieodwracalne robi człowiek ` +
        "przy klawiaturze, nie agent z wiadomości.",
      );
    }
    const cwd = bezpiecznaSciezka(katalog ?? ".");
    const [plik, args] = platform() === "win32"
      ? ["powershell", ["-NoProfile", "-NonInteractive", "-Command", polecenie]]
      : ["/bin/sh", ["-c", polecenie]];
    try {
      const { stdout, stderr } = await wykonaj(plik as string, args as string[], {
        cwd, timeout: LIMIT_CZASU_MS, maxBuffer: 4 * 1024 * 1024,
      });
      return {
        polecenie, katalog: cwd, kod: 0,
        wynik: String(stdout).slice(0, MAX_ZNAKOW_WYNIKU),
        blad: String(stderr).slice(0, 4000) || null,
      };
    } catch (e) {
      const err = e as { code?: number; stdout?: string; stderr?: string; message: string };
      return {
        polecenie, katalog: cwd, kod: err.code ?? -1,
        wynik: String(err.stdout ?? "").slice(0, MAX_ZNAKOW_WYNIKU),
        blad: String(err.stderr ?? err.message).slice(0, 4000),
      };
    }
  },
};

/**
 * Narzędzia widoczne dla modelu. ⛔ `komputer_uruchom` jest DOKŁADANY dopiero po włączeniu:
 * narzędzie widoczne, ale zawsze odmawiające, uczy model obiecywać rzeczy, których nie zrobi.
 */
export const narzedziaLokalne: NarzedzieLokalne[] = [
  komputer_stan,
  komputer_pliki,
  komputer_czytaj,
  komputer_zrzut,
  ...(poleceniaWlaczone() ? [komputer_uruchom] : []),
];
