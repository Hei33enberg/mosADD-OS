/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * Phase 1 MVP: mDM only.
 * Phase 1 full: mDM, mTALK, mAIL, mCALL, mIRC, mIRL, mROOM, plus bridges.
 */

import type { MosaddTool } from "../types.js";
import { mdmTools } from "./mdm.js";

export const allTools: MosaddTool[] = [
  ...mdmTools,
  // mtalkTools, mailTools, mcallTools, mircTools, mirlTools, mroomTools,
  // mmatrixTools, mdiscordTools, mtelegramTools, ...
  //
  // Each m* module will register its tools here as it ships.
  // RFC required to add a new m* module (see docs/rfcs/).
];
