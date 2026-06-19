/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * Live modules (6): mDM, mIRC, mROOM, mTALK, mp0st, mRAG — 70 tools + comms_capabilities.
 * Plus action links: comms_action_create (agent → user one-link browser action,
 * incl. screen_share) + comms_action_frame_get (see the recipient's shared screen).
 * mURL is a consumer/brand surface (murl.mosadd.com), NOT a dev product — its tools
 * live in tools/murl.ts but are NOT registered here (founder decision 2026-06-10).
 * mCALL is carrier-pending (no telephony carrier live yet): its tools live in
 * tools/mcall.ts but are NOT registered here, so an agent only ever discovers
 * tools that actually work. Re-register the one line below when a carrier ships.
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
import { mailProvenanceTools } from "./mail-provenance.js";
import { mtalkTools } from "./mtalk.js";
import { attachmentTools } from "./attachments.js";
import { pttIngestTools } from "./ptt-ingest.js";
// import { mcallTools } from "./mcall.js"; // mCALL: carrier-pending — not registered (see header note)
import { knowledgeTools } from "./knowledge.js";
import { actionTools } from "./actions.js";
import { embedTools } from "./embed.js";
// import { murlTools } from "./murl.js"; // mURL: brand/consumer surface, not a dev product — not registered
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
  ...mailProvenanceTools,
  ...mtalkTools,
  ...attachmentTools,
  ...pttIngestTools,
  ...knowledgeTools,
  ...actionTools,  // Action links (Tier 1): agent → user one-link browser action via action-create EF
  ...embedTools,   // comms_embed_create: agent embeds a live channel into the app it builds (embed-keys EF + embed.mosadd.com widget)
  // ...murlTools,  // mURL: brand/consumer surface (murl.mosadd.com), not a dev product
  // ...mcallTools,  // mCALL: carrier-pending (no telephony carrier live) — re-register when a carrier is configured
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
