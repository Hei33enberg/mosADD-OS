// Writes skins/<id>/skin.json and skins/<id>/messenger.json for the ready-made skins.
// "august" comes from the design system (run make-brand.mjs first); the others are the themes of the templates.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Skin, applySkin, skinFromMessenger, validateMessenger } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const write = (p, v) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), JSON.stringify(v, null, 2) + "\n"); };

const jobs = [
  { id: "august", base: "templates/community.json", skin: Skin.parse(read("skins/august/skin.json")), version: "1.0.0" },
  ...[["port-night", "crew-ptt"], ["gate-night", "security-events"], ["fleet-road", "logistics-fleet"], ["club-bright", "school-club"]].map(([id, t]) => {
    const m = validateMessenger(read(`templates/${t}.json`)).messenger;
    return { id, base: `templates/${t}.json`, skin: skinFromMessenger(m), version: "1.0.0" };
  }),
];
for (const j of jobs) {
  write(`skins/${j.id}/skin.json`, j.skin);
  const doc = applySkin(read(j.base), j.skin, { id: j.id, version: j.version });
  delete doc._comment;
  doc.id = `skin-${j.id}`;
  const r = validateMessenger(doc);
  if (!r.ok) throw new Error(`${j.id}: ${JSON.stringify(r.issues)}`);
  write(`skins/${j.id}/messenger.json`, doc);
  console.log(j.id, "ok", r.issues.map((i) => i.code).join(",") || "no warnings");
}
