/**
 * Action links — agent → user one-link actions (Tier 1).
 *
 * Mint a single-use, expiring link (`https://mosadd.com/do/<token>`) that asks a
 * human to DO something in their browser — confirm, pick a file, fill a form, or
 * open a vetted URL — with explicit consent. Send the returned `link` to the
 * person via any channel (mDM/mIRC/mp0st). They open it, see what's asked, consent,
 * and the browser performs the action IN ITS SANDBOX, then the result is recorded
 * against the action. No install, no OS access, nothing runs without a user gesture.
 *
 * Backend: mosadd `action-create` Edge Function. The action is owned by the
 * calling user (user-JWT scoped — `mosadd login` / MOSADD_USER_JWT), so only you
 * can later read its result.
 *
 * Result read-back (an `action_status` tool) is a follow-up — it needs a small
 * creator-scoped read Edge Function (`action-status`). For now, the recipient's
 * outcome is recorded on the action row; surface it once that EF ships.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv, getSupabase } from "../providers/supabase.js";

const formField = z.object({
  name: z.string().min(1).max(60).describe("Field key — returned verbatim in the result."),
  label: z.string().max(120).optional().describe("Human label shown to the recipient. Defaults to `name`."),
  type: z.enum(["text", "email", "number", "textarea", "tel", "url"]).optional().describe("Input type. Default 'text'."),
  required: z.boolean().optional().describe("Whether the recipient must fill this field."),
});

const action_create_input = z.object({
  action_type: z.enum(["confirm", "file_request", "form", "open_url", "screen_share"]).describe(
    "What you want the recipient to do: 'confirm' (yes/no), 'file_request' (pick a file from their computer), 'form' (fill fields), 'open_url' (open a vetted https URL), 'screen_share' (recipient shares their screen so you can SEE it via comms_action_frame_get — view only).",
  ),
  message: z.string().min(1).max(2000).describe("What you're asking — shown on the consent screen above the action UI."),
  creator_label: z.string().max(80).optional().describe("How you're identified to the recipient (e.g. your agent name). Default 'Agent'."),
  // confirm
  yes_label: z.string().max(40).optional().describe("[confirm] Affirmative button label. Default 'Tak'."),
  no_label: z.string().max(40).optional().describe("[confirm] Negative button label. Default 'Nie'."),
  // file_request
  accept: z.string().max(200).optional().describe("[file_request] Accepted file types (HTML accept attr, e.g. 'image/*,.pdf')."),
  max_bytes: z.number().int().positive().max(5_242_880).optional().describe("[file_request] Max file size in bytes (≤ 5 MB). NOTE: the returned file is NOT yet end-to-end encrypted — do not request sensitive files until Tier 1.1 ships."),
  // form
  fields: z.array(formField).min(1).max(20).optional().describe("[form] Fields to collect from the recipient."),
  // open_url
  url: z.string().url().optional().describe("[open_url] The https URL to open. The full URL is shown to the recipient before they open it."),
  // screen_share
  max_width: z.number().int().positive().max(1920).optional().describe("[screen_share] Max captured frame width in px (default 1280). Frames are downscaled JPEGs."),
  // lifecycle
  ttl_ms: z.number().int().positive().optional().describe("Link lifetime in milliseconds. Default 24h, capped at 7d."),
  max_uses: z.number().int().min(1).max(50).optional().describe("How many times the link can be redeemed. Default 1 (single-use)."),
});

function buildParams(input: z.infer<typeof action_create_input>): Record<string, unknown> {
  switch (input.action_type) {
    case "confirm":
      return { message: input.message, yesLabel: input.yes_label, noLabel: input.no_label };
    case "file_request":
      return { message: input.message, accept: input.accept, maxBytes: input.max_bytes };
    case "form":
      if (!input.fields?.length) throw new Error("action_type 'form' requires a non-empty `fields` array.");
      return { message: input.message, fields: input.fields };
    case "open_url":
      if (!input.url) throw new Error("action_type 'open_url' requires `url`.");
      return { message: input.message, url: input.url };
    case "screen_share":
      return { message: input.message, maxWidth: input.max_width };
    default:
      return { message: input.message };
  }
}

interface ActionCreateResult {
  action_id: string;
  token: string;
  link: string;
  action_type: string;
  expires_at: string;
}

async function action_create(
  input: z.infer<typeof action_create_input>,
  ctx: MosaddToolContext,
): Promise<ActionCreateResult> {
  readSupabaseEnv();
  ctx.log("debug", "action_create invoking action-create", { action_type: input.action_type });

  const body: Record<string, unknown> = {
    action_type: input.action_type,
    params: buildParams(input),
  };
  if (input.creator_label !== undefined) body.creator_label = input.creator_label;
  if (input.ttl_ms !== undefined) body.ttl_ms = input.ttl_ms;
  if (input.max_uses !== undefined) body.max_uses = input.max_uses;

  const res = await invokeFunction<Partial<ActionCreateResult> & { error?: string }>("action-create", body);
  if (res.error) throw new Error(res.error);
  if (!res.link || !res.token) throw new Error("action-create returned a malformed response (missing link/token).");

  return {
    action_id: res.action_id ?? "",
    token: res.token,
    link: res.link,
    action_type: res.action_type ?? input.action_type,
    expires_at: res.expires_at ?? "",
  };
}

// ── comms_action_frame_get — read the latest screen frame (Tier 1.5) ──────────
const action_frame_get_input = z.object({
  action_id: z.string().min(1).describe("The action_id returned by comms_action_create for a 'screen_share' action you created."),
});

async function action_frame_get(
  input: z.infer<typeof action_frame_get_input>,
  ctx: MosaddToolContext,
): Promise<{ mcpContent: Array<Record<string, unknown>> }> {
  readSupabaseEnv();
  ctx.log("debug", "action_frame_get reading frame", { action_id: input.action_id });
  // Read directly via RLS ("creators read own frames") — the agent's JWT gates it
  // to screen_share actions it created. No edge function needed.
  const sb = getSupabase();
  const { data, error } = await sb
    .from("action_screen_frames")
    .select("image_jpeg, width, seq, updated_at")
    .eq("action_id", input.action_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return { mcpContent: [{ type: "text", text: "No frame yet — the recipient hasn't started sharing their screen (or you don't own this action)." }] };
  }
  const row = data as { image_jpeg: string; width: number | null; seq: number; updated_at: string };
  const ageSec = Math.round((Date.now() - new Date(row.updated_at).getTime()) / 1000);
  return {
    mcpContent: [
      { type: "text", text: `Latest screen frame — seq ${row.seq}, ${row.width ?? "?"}px wide, ${ageSec}s old.` },
      { type: "image", data: row.image_jpeg, mimeType: "image/jpeg" },
    ],
  };
}

export const actionTools: MosaddTool[] = [
  {
    // RFC 0001: channel-agnostic capability (link is sent over ANY channel), so it
    // lives in the `comms_` namespace rather than a channel `m<MODULE>_` prefix.
    // A dedicated `mACT` module (create/get/status) is a possible RFC follow-up.
    name: "comms_action_create",
    requires: "network",
    description:
      "Mint a single-use, expiring action link (https://mosadd.com/do/<token>) that asks a human to DO something in their browser, with explicit consent. action_type: 'confirm' (yes/no) | 'file_request' (recipient picks a file from their computer) | 'form' (recipient fills fields you define) | 'open_url' (recipient opens a vetted https URL). Returns { action_id, token, link, expires_at }. Send the `link` to the person via mDM/mIRC/mp0st; they open it, consent, and the browser performs the action in its sandbox (no install, no OS access). The action is owned by you (the calling user). HONEST LIMITS: this is browser-sandbox only — it cannot click other apps, run programs, or read files the user didn't pick; and file_request payloads are not yet end-to-end encrypted (don't request sensitive files until Tier 1.1).",
    inputSchema: action_create_input,
    handler: action_create as MosaddTool["handler"],
  },
  {
    name: "comms_action_frame_get",
    requires: "network",
    description:
      "See the LATEST screen frame from a 'screen_share' action you created (pass the action_id from comms_action_create). Returns the current screenshot AS AN IMAGE you can look at, plus how old it is. The recipient must have opened the link and clicked 'share screen' first. Poll this every few seconds to watch live. VIEW ONLY — you cannot click or control their screen. Returns a 'no frame yet' note until they start sharing.",
    inputSchema: action_frame_get_input,
    handler: action_frame_get as MosaddTool["handler"],
  },
];
