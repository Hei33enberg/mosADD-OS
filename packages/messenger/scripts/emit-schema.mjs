// Writes schema/messenger-1.json from the built Zod schema. Run after `pnpm build`.
// The test suite fails when the committed file and the Zod schema drift apart.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { messengerJsonSchema } from "../dist/index.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "schema", "messenger-1.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(messengerJsonSchema(), null, 2) + "\n");
console.log(`wrote ${out}`);
