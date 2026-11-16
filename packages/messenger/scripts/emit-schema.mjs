// Writes schema/messenger-1.json, skin-1.json and skin-manifest-1.json from the built Zod schemas. Run after `pnpm build`.
// The test suite fails when a committed file and its Zod schema drift apart.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { messengerJsonSchema, skinJsonSchema, skinManifestJsonSchema } from "../dist/index.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "schema");
mkdirSync(dir, { recursive: true });
for (const [name, schema] of [
  ["messenger-1.json", messengerJsonSchema()],
  ["skin-1.json", skinJsonSchema()],
  ["skin-manifest-1.json", skinManifestJsonSchema()],
]) {
  writeFileSync(join(dir, name), JSON.stringify(schema, null, 2) + "\n");
  console.log(`wrote ${join(dir, name)}`);
}
