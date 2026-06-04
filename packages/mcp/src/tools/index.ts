/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * Phase 1 MVP (shipped): mDM, mIRC, mROOM, mAIL.
 * Phase 1 full: + mTALK, mCALL, mIRL, plus bridges (mMATRIX, mDISCORD, mTELEGRAM, mSLACK, mSIGNAL).
 */

import type { MosaddTool } from "../types.js";
import { mdmTools } from "./mdm.js";
import { mdmVoiceTools } from "./mdm-voice.js";
import { mircTools } from "./mirc.js";
import { mircMembersTools } from "./mirc-members.js";
import { mircMessagesTools } from "./mirc-messages.js";
import { mircEdgeTools } from "./mirc-edge.js";
import { mroomTools } from "./mroom.js";
import { mroomMessagesTools } from "./mroom-messages.js";
import { mailTools } from "./mail.js";
import { mtalkTools } from "./mtalk.js";
import { mcallTools } from "./mcall.js";
import { knowledgeTools } from "./knowledge.js";
import { makeCapabilitiesTool } from "./capabilities.js";

/** The m* channel tools (everything except the meta discovery tool). */
const channelTools: MosaddTool[] = [
  ...mdmTools,
  ...mdmVoiceTools,
  ...mircTools,
  ...mircMembersTools,
  ...mircMessagesTools,
  ...mircEdgeTools,
  ...mroomTools,
  ...mroomMessagesTools,
  ...mailTools,
  ...mtalkTools,
  ...mcallTools,
  ...knowledgeTools,
  // mirlTools,
  // mmatrixTools, mdiscordTools, mtelegramTools, mslackTools, msignalTools,
  //
  // Each m* module registers its tools here as it ships.
  // RFC required to add a new m* module (see docs/rfcs/0001-module-naming.md).
];

export const allTools: MosaddTool[] = [
  ...channelTools,
  // comms_capabilities: one-call discovery of every tool's `requires` flag,
  // so carrier-aware hosts (cymru-os) can gate the tool list by transport.
  makeCapabilitiesTool(channelTools),
];
