// Bundles the studio into dist/ (index.html + studio.css + studio.js): a static site, no server needed.
// esbuild comes from the messenger package's dev dependencies (tsup bundles it); nothing is installed here.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requireFromMessenger = createRequire(join(root, "..", "..", "packages", "messenger", "package.json"));
// pnpm keeps esbuild next to tsup, not at the top level: resolve it from tsup's own location.
const esbuild = createRequire(requireFromMessenger.resolve("tsup"))("esbuild");

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
await esbuild.build({
  entryPoints: [join(root, "src", "main.ts")],
  outfile: join(dist, "studio.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: true,
  legalComments: "none",
  logLevel: "warning",
});
cpSync(join(root, "index.html"), join(dist, "index.html"));
cpSync(join(root, "studio.css"), join(dist, "studio.css"));
console.log("built apps/studio/dist (index.html, studio.css, studio.js)");

if (process.argv.includes("--serve")) {
  const port = Number(process.env.PORT || 4177);
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };
  createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url || "/").split("?")[0])).replace(/^[\\/]+/, "") || "index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
  }).listen(port, "127.0.0.1", () => console.log(`studio on http://127.0.0.1:${port}`));
}
