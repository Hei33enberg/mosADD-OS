/**
 * Tool registry. Each m* module contributes a set of tools.
 *
 * User-facing modules (4): mDM, mIRC, mURL, mAYL — the re-arch (LINEAR-3938)
 * mAYL replaces the old mp0st name (mp0st_* still registered as back-compat
 * aliases via mail-aliases.ts; will be removed in a later alpha).
 *
 * Capabilities (not modules — cross-cutting agent tooling): mRAG, comms_.
 * mTALK = voice tier inside mIRC, still its own tools for now; folding into
 * mIRC_voice_* in a follow-up release. threat_* (threat_catalog + threat_classify)
 * are REGISTERED (2026-07-15, founder directive + LINEAR-3498): pure/offline
 * defensive classification over the threat taxonomy — the surveillance-era
 * *marketing* was killed, the classification engine is real and wanted.
 *
 * ~70+ callable tools registered (public copy says "70+ tools", matching mosadd.com).
 * Modules (4): mDM, mIRC, mURL, mAYL. Capabilities: mTALK (voice/PTT), mRAG, comms_.
 * mp0st_* stay as DEPRECATED back-compat aliases for mAYL_* (removed in a later alpha).
 * Exact integer pending a live EF ping (CTO-1) — don't hard-code a drifting count.
 * UNREGISTERED 2026-07-14 (broken scaffolds whose EFs 404/400 every call — re-register when
 * live): mAYL_send_as_agent (mail-provenance), mTALK_ingest_ptt (ptt-ingest), comms_embed_create.
 * mROOM was KILLED (LINEAR-3414, channel re-cut → ephemeral private mIRC): its tools
 * live in tools/mroom.ts + mroom-messages.ts but are NOT registered here.
 * Plus action links: comms_action_create (agent → user one-link browser action,
 * incl. screen_share) + comms_action_frame_get (see the recipient's shared screen).
 * mURL is a FULL registered dev module (revived, founder 2026-06-27) — IRC-for-URLs,
 * agent-native; backends live (mosadd-edge + murl-channels EF). tools/murl.ts.
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
// import { mailAliasTools } from "./mail-aliases.js"; // mp0st_* aliases RETIRED 2026-07-15 (founder: unify on mAYL, drop the mp0st codename from every user-visible surface). Source kept for reference.
// import { mailProvenanceTools } from "./mail-provenance.js"; // mAYL_send_as_agent SCAFFOLD — UNREGISTERED 2026-07-14 (hub-claim EF 404s; re-register when live — CTO-1 live-ping)
import { mtalkTools } from "./mtalk.js";
import { attachmentTools } from "./attachments.js";
// import { pttIngestTools } from "./ptt-ingest.js"; // mTALK_ingest_ptt SCAFFOLD — UNREGISTERED 2026-07-14 (ptt-ingest EF 400s; re-register when fixed — CTO-1 live-ping)
// import { mcallTools } from "./mcall.js"; // mCALL: carrier-pending — not registered (see header note)
import { knowledgeTools } from "./knowledge.js";
import { actionTools } from "./actions.js";
// import { embedTools } from "./embed.js"; // comms_embed_create SCAFFOLD — UNREGISTERED 2026-07-14 (widget backend not live e2e; re-register when embed.mosadd.com ships — CTO-1 live-ping)
import { threatTools } from "./threat.js"; // threat_*: RE-REGISTERED 2026-07-15 (founder directive + LINEAR-3498). Pure/offline classification of the real Pegasus-class threat taxonomy — the engine DECIDES, the caller acts; no surveillance, no backend.
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
  ...mailTools,         // mAYL_*: canonical email module (was the mp0st codename; renamed re-arch 2026-06-27)
  // ...mailAliasTools, // mp0st_* aliases RETIRED 2026-07-15 — mAYL is the one name; the mp0st codename is now backend-internal only
  // ...mailProvenanceTools, // mAYL_send_as_agent: UNREGISTERED 2026-07-14 — hub-claim EF 404s every call; re-register when rewired onto hub-key-exchange (CTO-1 live-ping)
  ...mtalkTools,
  ...attachmentTools,
  // ...pttIngestTools,    // mTALK_ingest_ptt: UNREGISTERED 2026-07-14 — ptt-ingest EF 400s every call; re-register when payload + PTT→RAG path fixed (CTO-1 live-ping)
  ...knowledgeTools,
  ...actionTools,  // Action links (Tier 1): agent → user one-link browser action via action-create EF
  // ...embedTools,    // comms_embed_create: UNREGISTERED 2026-07-14 — widget backend not live e2e; re-register when embed.mosadd.com ships (CTO-1 live-ping)
  ...threatTools,  // threat_catalog + threat_classify: RE-REGISTERED 2026-07-15 (founder directive + LINEAR-3498) — pure/offline, makes the Pegasus-class classification claim a live, callable capability
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
