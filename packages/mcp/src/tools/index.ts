/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * User-facing modules (4): mDM, mIRC, mURL, mAYL — the re-arch (LINEAR-3938)
 * mAYL replaces the old mp0st name (mp0st_* still registered as back-compat
 * aliases via mail-aliases.ts; will be removed in alpha.27).
 *
 * Capabilities (not modules — cross-cutting agent tooling): mRAG, comms_.
 * mTALK = voice tier inside mIRC, still its own tools for now; folding into
 * mIRC_voice_* in a follow-up release. threat_* UNREGISTERED — surveillance-
 * era direction is dead (decision_killed_directions).
 *
 * 76 callable tools at registration:
 *   mDM 14 + mIRC 22 + mURL 4 + mAYL 11 (= 51 module tools) +
 *   mTALK 5 + mRAG 4 + comms_ 3 (= 12 capability tools) +
 *   mp0st_* 11 back-compat aliases + comms_capabilities (1) = 76.
 * mROOM was KILLED (LINEAR-3414, channel re-cut → ephemeral private mIRC): its tools
 * live in tools/mroom.ts + mroom-messages.ts but are NOT registered here.
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
// import { mroomTools } from "./mroom.js"; // mROOM: killed (LINEAR-3414) — not registered
// import { mroomMessagesTools } from "./mroom-messages.js"; // mROOM: killed (LINEAR-3414) — not registered
import { mailTools } from "./mail.js";
import { mailAliasTools } from "./mail-aliases.js";  // mp0st_* back-compat aliases for mAYL_*
import { mailProvenanceTools } from "./mail-provenance.js";  // mAYL_send_as_agent — LINEAR-3991
// import { mailProvenanceTools } from "./mail-provenance.js"; // scaffold (mp0st_send_as_agent) — not registered, see below
import { mtalkTools } from "./mtalk.js";
import { attachmentTools } from "./attachments.js";
import { pttIngestTools } from "./ptt-ingest.js"; // P4.1 / LINEAR-3998 — body aligned to deployed ptt-ingest EF
// import { mcallTools } from "./mcall.js"; // mCALL: carrier-pending — not registered (see header note)
import { knowledgeTools } from "./knowledge.js";
import { actionTools } from "./actions.js";
// import { embedTools } from "./embed.js"; // comms_embed_create: SCAFFOLD — its
//   embed-keys EF is NOT deployed to prod (404s every call) and the embed.mosadd.com
//   widget surface is parked. Unregister until both ship. See consistency ticket.
// import { threatTools } from "./threat.js"; // threat_*: UNREGISTERED 2026-06-27 (re-arch). Surveillance-era direction killed; source kept for archival.
import { murlTools } from "./murl.js"; // mURL: REGISTERED — revived as a full dev module (founder 2026-06-27, re-arch). IRC-for-URLs, agent-native; backends live (mosadd-edge + murl-channels EF).
import { makeCapabilitiesTool } from "./capabilities.js";

/** The m* channel tools (everything except the meta discovery tool). */
const channelTools: MosaddTool[] = [
  ...mdmTools,
  ...mdmVoiceTools,
  ...mircTools,
  ...mircMembersTools,
  ...mircMessagesTools,
  ...mircEdgeTools,
  // ...mroomTools,  // mROOM: killed (LINEAR-3414) — channel re-cut into ephemeral private mIRC
  // ...mroomMessagesTools,  // mROOM: killed (LINEAR-3414)
  ...mailTools,         // mAYL_*: canonical email module (was mp0st_*; renamed re-arch 2026-06-27)
  ...mailAliasTools,    // mp0st_*: back-compat aliases — DEPRECATED, removed in alpha.27
  ...mailProvenanceTools, // mAYL_send_as_agent: agent-attributed mail send via hub-claim-mint (LINEAR-3991)
  //   endpoint (404s every call) + sends provenance body fields the EF never reads. Unregister until
  //   rewired onto hub-key-exchange (agent_id/task_id + mosadd_hub JWT claim). See consistency ticket.
  ...mtalkTools,
  ...attachmentTools,
  ...pttIngestTools,    // mTALK_ingest_ptt: P4.1 / LINEAR-3998 — body aligned to deployed ptt-ingest EF
  //   ptt-ingest EF (needs {direction, audio_base64, mime_type, message_id|thread_id} → 400s every
  //   call) and the PTT→RAG path needs rework. Unregister until both are fixed. See consistency ticket.
  ...knowledgeTools,
  ...actionTools,  // Action links (Tier 1): agent → user one-link browser action via action-create EF
  // ...embedTools,   // comms_embed_create: SCAFFOLD — embed-keys EF undeployed (404) + embed widget parked. Unregistered.
  // ...threatTools,  // UNREGISTERED 2026-06-27 — killed direction; source kept for archival
  ...murlTools,  // mURL: revived as a full module (founder 2026-06-27) — read/post/presence/list_channels over live domain channels
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
