// =============================================================================
// mail-aliases.ts — back-compat mp0st_* aliases for mAYL_* tools
// =============================================================================
// The mosADD re-arch (2026-06-27) renamed the email module from `mp0st` to
// `mAYL` (LINEAR-3938 / 3985). The canonical tool names are mAYL_* — see
// `tools/mail.ts`. THIS module exposes back-compat aliases so any agent already
// wired to mp0st_send / mp0st_view / etc. KEEPS WORKING in this release.
//
// Rule: never drop an alias in the release that adds its replacement — live
// agents would 404. mp0st_* aliases stay through alpha.25 and the next minor;
// flag for removal goes into the a later release's notes.
// =============================================================================

import type { MosaddTool } from "../types.js";
import { mailTools } from "./mail.js";

/** Same handlers/schemas as `mailTools`, but registered under the legacy mp0st_* names. */
export const mailAliasTools: MosaddTool[] = mailTools.map((tool) => ({
  ...tool,
  name: tool.name.replace(/^mAYL_/, "mp0st_"),
  description:
    `[DEPRECATED — use ${tool.name} instead. mp0st_* aliases stay through alpha.25 ` +
    `for back-compat; will be removed in a later alpha.] ` +
    tool.description,
}));
