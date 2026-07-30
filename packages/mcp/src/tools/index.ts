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
 * 73 callable tools registered — the exact live count is exported as TOOL_COUNT
 * (= allTools.length) below; ALWAYS reference that, never re-hard-code a number that drifts.
 * Breakdown (2026-07-30, measured from allTools): mDM 14 · mIRC 24 · mAYL 12 · mURL 7 ·
 * mTALK 6 · mRAG 4 · comms 3 (action_create/frame_get/embed_create) · Irondome/threat 2 +
 * comms_capabilities discovery 1 = 73. (The 2026-07-17 breakdown ended "= 69" — wrong twice
 * over: its own terms summed to 71, and the 07-29 re-registrations of mAYL_send_as_agent +
 * mTALK_ingest_ptt moved the real total to 73. Arithmetic in comments drifts; TOOL_COUNT doesn't.)
 * (mDM/mIRC each include their 2 attachment tools from attachments.ts.)
 * Modules (4): mDM, mIRC, mURL, mAYL. Capabilities: mTALK (voice/PTT), mRAG, comms_, Irondome (threat_*).
 * mp0st_* stay as DEPRECATED back-compat aliases for mAYL_* (removed in a later alpha).
 * mAYL_send_as_agent + mTALK_ingest_ptt were RE-REGISTERED 2026-07-29: both had been disabled
 * on 07-14 notes that had since become false, and both were re-verified on authenticated calls.
 * comms_embed_create RE-REGISTERED 2026-07-17 (embed.mosadd.com/v1.js live — P3 of mURL→mIRC).
 * mROOM was KILLED (LINEAR-3414, channel re-cut → ephemeral private mIRC): its tools
 * live in tools/mroom.ts + mroom-messages.ts but are NOT registered here.
 * Plus action links: comms_action_create (agent → user one-link browser action,
 * incl. screen_share) + comms_action_frame_get (see the recipient's shared screen).
 * mURL is a FULL registered dev module (revived, founder 2026-06-27) — IRC-for-URLs,
 * agent-native; backends live (mosadd-edge + murl-channels EF). tools/murl.ts.
 * mURL now has full lifecycle: read/post/presence/list_channels (hub-key) PLUS owner-side
 * create/claim + update(branding/status) + delete (mURL_create/update/delete → murl-manage
 * EF, owner-scoped via user JWT — same auth as mURL_list_channels action='mine').
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
import { mailProvenanceTools } from "./mail-provenance.js"; // mAYL_send_as_agent — RE-REGISTERED 2026-07-29, see the note at the registry below
import { mtalkTools } from "./mtalk.js";
import { attachmentTools } from "./attachments.js";
import { pttIngestTools } from "./ptt-ingest.js"; // mTALK_ingest_ptt — RE-REGISTERED 2026-07-29, see the note at the registry below
// import { mcallTools } from "./mcall.js"; // mCALL: carrier-pending — not registered (see header note)
import { knowledgeTools } from "./knowledge.js";
import { actionTools } from "./actions.js";
import { embedTools } from "./embed.js"; // comms_embed_create RE-REGISTERED 2026-07-17: embed.mosadd.com/v1.js is LIVE (served by the mosadd Vercel project) — the widget + embed-keys/mirc-embed-token backend were already complete.
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
  // ⭐ mAYL_send_as_agent: RE-REGISTERED 2026-07-29 — proven end to end, without sending mail.
  // Unregistered since 07-14 on the note "hub-claim EF 404s every call". That note was stale in
  // the same way ptt-ingest's was: unauthenticated it returns 401 (the auth gate), not 404.
  //
  // Settled by running the whole chain rather than the convenient half:
  //   1. hub-keys with a plain user JWT issued a real `mosadd_sk_live_…` — so a user session
  //      mints a hub key and no founder credential was ever needed. I had told the founder it
  //      required his key; that was wrong and this is the retraction.
  //   2. hub-claim-mint with that key → 200, valid claim token, aud `mp0st-send`, 600s expiry.
  //   3. mp0st-send with the claim token and a DELIBERATELY EMPTY payload → 400 "Missing to or
  //      subject". A 400 on payload validation proves the token was ACCEPTED; 401/403 would have
  //      proven it was not. Auth verified end to end with zero mail sent — a diagnostic must not
  //      put a real message in someone's inbox.
  // The diagnostic key was then REVOKED (revoked_at set, not deleted, so the audit trail lives).
  ...mailProvenanceTools,
  ...mtalkTools,
  ...attachmentTools,
  // ⭐ mTALK_ingest_ptt: RE-REGISTERED 2026-07-29 — the backend finally does what the tool promises.
  // Unregistered since 07-14 on the note "ptt-ingest EF 400s every call". Re-measured 07-29: that
  // reason was stale (it returned 401, the auth gate), and an AUTHENTICATED probe then exposed the
  // real fault — 500, `Could not find the table 'public.rag_jobs'`. It authenticated, validated,
  // wrote the transcript row, and died one step later against a table dropped when the rag_events
  // v2 queue landed. Agent push-to-talk had NEVER once reached memory.
  //
  // Fixed by handing the audio to `rag-transcribe` (NOT to the v2 queue — that queue carries TEXT
  // for embedding and cannot transcribe; audio has to become words first). Verified on prod:
  // 200 {"queued":true}, edge log 200 in 2.7s where it used to 500, and the transcript row's
  // updated_at moved 4s after insert, so the backgrounded chain genuinely ran.
  //
  // Registered only AFTER that authenticated 200 — a liveness probe was never enough, because the
  // whole point of this registry is that an agent sees only tools that actually work.
  ...pttIngestTools,
  //
  // ✅ RESOLVED 2026-07-29 — both halves of this note are closed; kept as the record of how.
  // The disable note recorded a diagnosis from 2026-07-14: hub-claim "404s every call".
  // Live-probed today, unauthenticated:
  //     hub-claim-mint → 401 · ptt-ingest → 401 · mp0st-send → 401 (the control, a tool that
  //     IS registered and works)
  // 401 is the auth gate answering. A dead or missing function returns 404; a function that
  // rejects our payload shape returns 400. Neither happens any more, and both are ACTIVE on
  // the project. So whatever was broken in July was fixed at some point and nobody came back
  // to these lines — we advertised two capabilities as unavailable while their backends
  // answered. One of them (ptt) is now proven and registered; this is the other.
  //
  // NOT re-registering hub-claim on this evidence, deliberately. An unauthenticated 401 proves the
  // function is alive; it proves NOTHING about the authenticated path, which is where both
  // originally failed. Re-registering on a liveness probe would swap "wrongly disabled" for
  // "advertised and broken in a user's hands", which is the worse of the two.
  //
  // TO CLOSE: call each with a real hub key / session token. If they succeed, delete these
  // two comment blocks and uncomment the imports — the count moves 71 → 73 and the anti-drift
  // gate will then force every doc surface to follow. (This session cannot mint a session
  // token, so it stops here rather than guess.)
  ...knowledgeTools,
  ...actionTools,  // Action links (Tier 1): agent → user one-link browser action via action-create EF
  ...embedTools,    // comms_embed_create: RE-REGISTERED 2026-07-17 — embed.mosadd.com/v1.js live; mints an embed key + paste-in snippet (mURL→mIRC rework P3)
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

/**
 * The exact, live number of callable tools this server registers. Reference THIS
 * (import { TOOL_COUNT }) in any code/doc surface that shows a tool count, instead
 * of hard-coding a number that silently drifts (the "70+/65/68" inconsistency that
 * bit us). Mirrors @mosadd/threat-engine's THREAT_EVENT_COUNT pattern.
 */
export const TOOL_COUNT: number = allTools.length;
