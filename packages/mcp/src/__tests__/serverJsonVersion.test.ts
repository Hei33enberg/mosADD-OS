/**
 * server.json MUSI ZGADZAĆ SIĘ Z package.json — inaczej oficjalny rejestr MCP rozdaje starą wersję.
 *
 * ⛔ POWÓD JEST ZMIERZONY, NIE TEORETYCZNY (2026-08-28). `packages/mcp/server.json` stał na
 * `3.0.0-alpha.33`, podczas gdy pakiet był już na `3.0.0-alpha.44` — **jedenaście wersji wstecz**.
 * `server.json` to karta, którą czyta oficjalny rejestr MCP, więc każdy, kto znalazłby mosADD tam,
 * a nie u nas, instalowałby alpha.33: wersję sprzed poprawki modelu-widma, sprzed stabilnej
 * tożsamości sesji i sprzed dwóch wycofanych wydań (alpha.39 zdeprecowana, alpha.42 cofnięta).
 * Pierwsze wrażenie z produktu brałoby się z kodu, o którym my sami wiemy, że jest zepsuty.
 *
 * Rozjechało się dlatego, że NIC tego nie pilnowało: publikacja bumpuje `package.json`, a karta
 * rejestru jest osobnym plikiem, którego nikt nie tyka. Klasyczne „dwie kopie prawdy" — ta sama
 * klasa, która trzy razy przywracała model-widmo na czoło łańcucha. Opis w dokumentacji niczego
 * nie broni; test broni przy każdym przebiegu.
 *
 * Sprawdzamy OBA miejsca w server.json: `version` na wierzchu i `packages[].version`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Zakotwiczone w import.meta.url, nigdy w cwd — pułapka build-cwd kosztowała nas już raz.
const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = join(HERE, "..", "..");

const pkg = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8")) as { version: string };
const card = JSON.parse(readFileSync(join(PKG_DIR, "server.json"), "utf8")) as {
  version: string;
  packages?: Array<{ identifier?: string; version?: string }>;
};

describe("server.json (karta rejestru MCP)", () => {
  it("ma tę samą wersję co package.json", () => {
    expect(card.version, `server.json.version rozjechało się z package.json (${pkg.version}). ` +
      "Karta rejestru rozdawałaby innym ludziom INNĄ wersję niż publikujemy.").toBe(pkg.version);
  });

  it("ma tę samą wersję w bloku packages[]", () => {
    const npmEntry = (card.packages ?? []).find((p) => p.identifier === "@mosadd/mcp");
    expect(npmEntry, "brak wpisu @mosadd/mcp w server.json → packages[]").toBeTruthy();
    expect(npmEntry?.version, `server.json → packages[].version rozjechało się z package.json ` +
      `(${pkg.version}). To jest wersja, którą rejestr KAŻE ZAINSTALOWAĆ.`).toBe(pkg.version);
  });
});
