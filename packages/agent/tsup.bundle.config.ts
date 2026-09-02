/**
 * tsup.bundle.config — JEDEN PLIK AGENTA DO WPAKOWANIA W ELEKTRON.
 *
 * ⛔ PO CO OSOBNA KONFIGURACJA. Zwykły `npm run build` zostawia `@mosadd/mcp` jako import
 * ZEWNĘTRZNY — i to jest poprawne dla paczki na npm, bo tam menedżer pakietów dociąga resztę.
 * Ale Elektron uruchamiał agenta przez `npx -y @mosadd/agent@alpha`, czyli przy KAŻDYM starcie
 * szedł do internetu po paczkę. Skutki, które właściciel widział na własnej maszynie:
 *   · agent nie startuje bez sieci,
 *   · start trwa tyle, ile pobranie paczki,
 *   · a co ważniejsze: klient dostaje TĘ wersję, którą zdążyliśmy opublikować, a nie tę,
 *     którą ma w aplikacji. Aplikacja i agent rozjeżdżają się w czasie.
 * Właściciel, 2026-09-01: „elektron miał być taki sam jak każdy agent, ale WPAKOWANY w elektron,
 * a nie osobny proces, bo klient ma nic nie ogarniać". `npx` był dokładnie tym ogarnianiem.
 *
 * Ta konfiguracja wtapia zależności warsztatu w jeden plik, który Elektron uruchamia SWOIM node'em.
 * Zero sieci przy starcie, zero rozjazdu wersji, zero npm po stronie klienta.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/agent.ts"],
  format: ["esm"],
  outDir: "dist-bundle",
  clean: true,
  shims: true,
  // ⛔ Te paczki WTAPIAMY. To nasze własne moduły z tego samego repozytorium — nikt ich nie
  // dociągnie z npm po stronie klienta, bo część jest `workspace:*` i na npm ich nie ma.
  noExternal: ["@mosadd/mcp", "@mosadd/crypto", "@mosadd/protocol", "@mosadd/providers", "@mosadd/threat-engine"],
  // Reszta (supabase-js, sdk MCP, zod) zostaje wtopiona domyślnie przez bundler; wbudowane
  // moduły node'a zostają zewnętrzne, bo dostarcza je środowisko uruchomieniowe.
  platform: "node",
  target: "node20",
  dts: false,
  sourcemap: false,
});
