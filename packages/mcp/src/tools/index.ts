/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * Phase 1 MVP (shipped): mDM, mIRC, mROOM, mAIL.
 * Phase 1 full: + mTALK, mCALL, mIRL, plus bridges (mMATRIX, mDISCORD, mTELEGRAM, mSLACK, mSIGNAL).
 */

import type { MosaddTool } from "../types.js";
import { mdmTools } from "./mdm.js";
import { mircTools } from "./mirc.js";
import { mroomTools } from "./mroom.js";
import { mailTools } from "./mail.js";

export const allTools: MosaddTool[] = [
  ...mdmTools,
  ...mircTools,
  ...mroomTools,
  ...mailTools,
  // mtalkTools, mcallTools, mirlTools,
  // mmatrixTools, mdiscordTools, mtelegramTools, mslackTools, msignalTools,
  //
  // Each m* module registers its tools here as it ships.
  // RFC required to add a new m* module (see docs/rfcs/0001-module-naming.md).
];
