// Smoke test: the studio builds into a static folder and the page and bundle agree on their element ids.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [join(root, "scripts", "build.mjs")], { stdio: "inherit" });

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failed++; };

for (const f of ["index.html", "studio.css", "studio.js"]) check(existsSync(join(root, "dist", f)) && statSync(join(root, "dist", f)).size > 0, `dist/${f} exists`);

const html = readFileSync(join(root, "index.html"), "utf8");
const src = readFileSync(join(root, "src", "main.ts"), "utf8");
// Every $("id") the script reads must exist in the page, or the studio dies on load.
const ids = [...src.matchAll(/\$(?:<[^>]+>)?\("([\w-]+)"\)/g)].map((m) => m[1]);
for (const id of new Set(ids)) check(html.includes(`id="${id}"`), `index.html has #${id}`);

const bundle = readFileSync(join(root, "dist", "studio.js"), "utf8");
check(bundle.includes("HOLD TO TALK"), "bundle contains the preview");
check(!/https?:\/\/(?!127\.0\.0\.1)[^"'\s)]*\.(js|css)/.test(html), "page loads nothing from the network");
process.exit(failed ? 1 : 0);
