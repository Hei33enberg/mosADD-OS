/**
 * The old cloud (`rooffhgbxafyjcwmwpsy.supabase.co`) is dead; the live backend is `https://api.mosadd.com`.
 * A published package that defaults to the dead host breaks `MOSADD_API_KEY` login (hub-key-exchange never answers),
 * so no source file may carry the old host as a URL. Comments that merely name the project id are fine.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEAD = /https?:\/\/rooffhgbxafyjcwmwpsy\.supabase\.co/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n === "__tests__" || n === "node_modules") return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|js)$/.test(n) ? [p] : [];
  });
}

describe("no dead backend host in the package source", () => {
  it("no source file carries the old supabase host as a URL", () => {
    const hits = walk(SRC).filter((f) => DEAD.test(readFileSync(f, "utf8")));
    expect(hits, `dead host found in: ${hits.join(", ")}`).toEqual([]);
  });

  it("the default hub-key-exchange endpoint is api.mosadd.com", () => {
    const src = readFileSync(join(SRC, "bin", "mcp.ts"), "utf8");
    expect(src).toMatch(/DEFAULT_EXCHANGE\s*=\s*"https:\/\/api\.mosadd\.com\/functions\/v1\/hub-key-exchange"/);
  });

  it("the gate fires: the dead host would be caught", () => {
    expect(DEAD.test('const X = "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/hub-key-exchange";')).toBe(true);
    expect(DEAD.test("// project rooffhgbxafyjcwmwpsy, 16.09")).toBe(false);
  });
});
