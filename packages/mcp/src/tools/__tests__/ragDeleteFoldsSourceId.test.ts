/**
 * mRAG_delete MUSI foldować source_id dokładnie tak, jak robi to mRAG_ingest.
 *
 * ⛔ ZMIERZONA AWARIA (2026-08-28). `mRAG_ingest` przepuszczał nie-UUID przez `uuidV5`, a
 * `mRAG_delete` wysyłał SUROWY napis prosto do kolumny UUID. Efekt na żywo:
 *
 *     mRAG_ingest  { source_id: "DIAG-GENERAL-2026-08-28-a1b2c3" }  →  { indexed: 1 }   ✅
 *     mRAG_delete  { source_id: "DIAG-GENERAL-2026-08-28-a1b2c3" }  →  500
 *                  "invalid input syntax for type uuid"                                  ❌
 *
 * Czyli: dokument zaindeksowany pod NATURALNYM kluczem (numer sprawy, ścieżka pliku, threadId
 * Gmaila) dawało się dodać, ale **nigdy nie dawało się go usunąć tym samym identyfikatorem**.
 * Dwie połowy tej samej rury nie zgadzały się ze sobą.
 *
 * I to nie było niedopatrzenie w cieniu — obietnica stała w DWÓCH miejscach, a implementacja
 * w jednym: komentarz przy foldowaniu mówi „so grouping and mRAG_delete keep working on natural
 * keys", a opis narzędzia obiecuje userowi „can later be removed with mRAG_delete".
 *
 * Boli najbardziej przy korpusie, bo tam naturalne klucze są jedynym sposobem na dedup przy
 * ponownym wczytaniu — a właśnie tak mielone są akta.
 *
 * Ten test pilnuje INWARIANTU, nie implementacji: cokolwiek robi ingest ze swoim `source_id`,
 * delete ma zrobić to samo. Gdyby ktoś kiedyś zmienił namespace albo wersję UUID, obie strony
 * muszą pojechać razem — i to złapie każdy rozjazd.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, "..", "knowledge.ts"), "utf8");

/** Ciało funkcji o danej nazwie — od jej deklaracji do następnej deklaracji `async function`. */
function bodyOf(name: string): string {
  const start = SRC.indexOf(`async function ${name}(`);
  expect(start, `nie znaleziono funkcji ${name} w knowledge.ts`).toBeGreaterThan(-1);
  const next = SRC.indexOf("\nasync function ", start + 1);
  return SRC.slice(start, next === -1 ? SRC.length : next);
}

describe("mRAG_delete — zgodność foldowania z mRAG_ingest", () => {
  it("delete folduje source_id przez uuidV5, tak samo jak ingest", () => {
    const del = bodyOf("mRAG_delete");
    expect(del, "mRAG_delete musi wołać uuidV5 — inaczej naturalny klucz da 500 na kolumnie uuid")
      .toContain("uuidV5(");
    expect(del, "mRAG_delete musi używać TEGO SAMEGO namespace co ingest")
      .toContain("SOURCE_ID_NAMESPACE");
    expect(del, "mRAG_delete musi rozpoznawać gotowy UUID i go NIE przerabiać")
      .toContain("UUID_RE");
  });

  it("delete NIE wysyła surowego input.source_id do rag-sources", () => {
    const del = bodyOf("mRAG_delete");
    expect(
      /source_id:\s*input\.source_id\s*\?\?\s*null/.test(del),
      "regresja: surowy input.source_id znowu leci do rag-sources — to jest dokładnie ten błąd 500",
    ).toBe(false);
  });

  it("obie strony dzielą jedną definicję namespace i jedną funkcję uuidV5", () => {
    // Po jednej definicji każdej — dwie kopie to dwie prawdy, a na tym już się przejechaliśmy
    // przy trasach modeli (FALLBACK_ROUTES vs ai_routes).
    expect(SRC.match(/const SOURCE_ID_NAMESPACE\s*=/g)?.length ?? 0).toBe(1);
    expect(SRC.match(/function uuidV5\(/g)?.length ?? 0).toBe(1);
  });
});
