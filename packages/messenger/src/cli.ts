#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { messengerJsonSchema } from "./schema";
import { validateMessenger } from "./validate";

const USAGE = `mosadd-messenger — the messenger.json format (RFC 0006)

  mosadd-messenger check <file.json> [--json]   validate; exit 1 on any error
  mosadd-messenger schema                       print the JSON Schema
`;

function main(argv: string[]): number {
  const [cmd, file, ...rest] = argv;
  if (cmd === "schema") {
    process.stdout.write(JSON.stringify(messengerJsonSchema(), null, 2) + "\n");
    return 0;
  }
  if (cmd !== "check" || !file) {
    process.stderr.write(USAGE);
    return 2;
  }
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    process.stderr.write(`cannot read ${file} as JSON: ${(e as Error).message}\n`);
    return 2;
  }
  const result = validateMessenger(doc);
  if (rest.includes("--json")) {
    process.stdout.write(JSON.stringify({ ok: result.ok, issues: result.issues }, null, 2) + "\n");
    return result.ok ? 0 : 1;
  }
  for (const i of result.issues) {
    process.stdout.write(`${i.level === "error" ? "ERROR  " : "warning"} ${i.path || "/"}  [${i.code}] ${i.message}\n`);
    if (i.hint) process.stdout.write(`        ${i.hint}\n`);
  }
  const errors = result.issues.filter((i) => i.level === "error").length;
  const warnings = result.issues.length - errors;
  process.stdout.write(`${result.ok ? "OK" : "FAILED"} — ${errors} error(s), ${warnings} warning(s)\n`);
  return result.ok ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
