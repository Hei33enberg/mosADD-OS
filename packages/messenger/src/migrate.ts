import { CURRENT_FORMAT_VERSION } from "./schema";

/**
 * One step per breaking change: MIGRATIONS[n] lifts a document from formatVersion n to n + 1.
 * Steps are pure functions of the parsed JSON. Format 1 is the first version, so the table is empty.
 */
export const MIGRATIONS: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {};

export type MigrateResult =
  | { ok: true; doc: unknown; from: number; to: number }
  | { ok: false; code: "FORMAT_TOO_NEW" | "FORMAT_VERSION_INVALID" | "NO_MIGRATION"; message: string };

/** Lifts an older description to the current format. Documents that are not objects pass through untouched. */
export function migrateMessenger(input: unknown): MigrateResult {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: true, doc: input, from: CURRENT_FORMAT_VERSION, to: CURRENT_FORMAT_VERSION };
  }
  const raw = (input as Record<string, unknown>).formatVersion;
  if (raw === undefined) {
    return { ok: true, doc: input, from: CURRENT_FORMAT_VERSION, to: CURRENT_FORMAT_VERSION };
  }
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) {
    return { ok: false, code: "FORMAT_VERSION_INVALID", message: `formatVersion must be a whole number from 1, got ${JSON.stringify(raw)}` };
  }
  if (raw > CURRENT_FORMAT_VERSION) {
    return {
      ok: false,
      code: "FORMAT_TOO_NEW",
      message: `formatVersion ${raw} is newer than this package understands (${CURRENT_FORMAT_VERSION}); update @mosadd/messenger`,
    };
  }
  let doc = { ...(input as Record<string, unknown>) };
  for (let v = raw; v < CURRENT_FORMAT_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return { ok: false, code: "NO_MIGRATION", message: `no migration from formatVersion ${v} to ${v + 1}` };
    doc = { ...step(doc), formatVersion: v + 1 };
  }
  return { ok: true, doc, from: raw, to: CURRENT_FORMAT_VERSION };
}
