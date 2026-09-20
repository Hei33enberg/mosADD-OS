/**
 * SŁOWNIK CZASOWNIKÓW `mosadd` — i NIC POZA NIM.
 *
 * ── PO CO OSOBNY PLIK ───────────────────────────────────────────────────────────────────────
 * `bin/mcp.ts` musi wiedzieć, czy pierwsze słowo jest komendą CLI, ZANIM zdecyduje, czy w ogóle
 * ładować wiersz poleceń. Do 20.09 robił to tak:
 *
 *     const { isCliCommand, runCliCommand } = await import("./cli.js");   // ⛔ BEZWARUNKOWO
 *     if (isCliCommand(sub)) { … }
 *
 * z komentarzem trzy linijki wyżej, który obiecywał: „przy starcie serwera ten moduł nigdy się
 * nie ładuje". Obietnica była nieprawdziwa — `cli.js` ładował się przy KAŻDYM starcie serwera
 * MCP, bo import stał przed warunkiem. Dziś nie robi to szkody (serwer i tak ciągnie ten sam
 * graf modułów), ale gwarancja, w którą ktoś uwierzy, musi istnieć naprawdę: kto dołoży do
 * `cli.ts` efekt na poziomie modułu — odczyt konfiguracji, baner, `process.stdout.write` —
 * wykona go wtedy WEWNĄTRZ uzgadniania JSON-RPC po stdio, czyli dokładnie tam, gdzie
 * zaśmiecenie stdout psuje hosta.
 *
 * Ten plik nie importuje niczego i nie robi niczego. Dlatego `mcp.ts` może go wciągnąć wprost,
 * a `cli.js` — z całym `allTools` i providerami — wyłącznie wtedy, gdy naprawdę jest komenda.
 *
 * ── DLACZEGO TO NIE JEST DRUGA KOPIA PRAWDY ─────────────────────────────────────────────────
 * Nazwy stoją tu, a tabela `VERBS` w `cli.ts` jest zadeklarowana jako `Record<ToolVerb, Verb>`.
 * Czasownik bez wiersza w tabeli i wiersz bez czasownika to BŁĄD KOMPILACJI, nie rozjazd do
 * odkrycia w terminalu.
 */

/** Czasowniki, które wołają narzędzie z `allTools`. Kolejność = kolejność w `mosadd help`. */
export const TOOL_VERBS = [
  "contacts",
  "send",
  "inbox",
  "agents",
  "channels",
  "post",
  "read",
  "recall",
] as const;

/** Komendy własne CLI — nie wołają żadnego narzędzia. */
export const META_VERBS = ["help", "tools", "call"] as const;

/** Obsługiwane przez `login.ts`, przed uwierzytelnieniem sesji. Wymienione, żeby `help` był pełny. */
export const AUTH_VERBS = ["login", "logout", "whoami"] as const;

export type ToolVerb = (typeof TOOL_VERBS)[number];

/**
 * Czy to słowo należy do wiersza poleceń.
 *
 * ⛔ PYTAMY LISTY, NIE OBIEKTU. `sub in VERBS` zwraca `true` dla `constructor`, `toString`
 * i `__proto__` przez łańcuch prototypów — a wtedy `npx @mosadd/mcp constructor` wszedłby do
 * CLI zamiast uruchomić serwer. Lista nie ma prototypu do przeszukania.
 *
 * ⛔ NIEZNANE SŁOWO NIE JEST BŁĘDEM. Hosty MCP odpalają `npx -y @mosadd/mcp`, część z własnymi
 * przełącznikami; gdyby cokolwiek spoza tej listy kończyło się komunikatem, ta zmiana
 * wyłączyłaby serwer ludziom, którzy o żadnym CLI nie prosili.
 */
export function isCliCommand(sub: string | undefined): sub is ToolVerb | (typeof META_VERBS)[number] {
  if (!sub) return false;
  return (
    (TOOL_VERBS as readonly string[]).includes(sub) ||
    (META_VERBS as readonly string[]).includes(sub)
  );
}
