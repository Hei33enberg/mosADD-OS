/**
 * mAIL — Email.
 *
 * Every mosadd user gets `<userId>@mosadd.com` for free — incoming mail lands
 * in their app, outgoing mail flows through the m0ssad-3 mp0st pipeline.
 *
 * Phase 1 alpha: wired to m0ssad-3 `mp0st-send` + `mp0st-view` Edge Functions.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const EmailAddress = z
  .string()
  .email()
  .max(254)
  .describe("RFC 5321 email address.");

const MessageId = z.string().min(1).describe("Message id (UUID) from mAIL_send or inbox.");

const mAIL_send_input = z.object({
  to: z.union([EmailAddress, z.array(EmailAddress).min(1).max(50)]).describe(
    "Recipient(s). Single address or array of up to 50.",
  ),
  subject: z.string().min(1).max(998).describe("Email subject line. Max 998 chars (RFC 5322)."),
  body_text: z.string().max(1_048_576).optional().describe("Plain text body. Max 1 MB."),
  body_html: z.string().max(1_048_576).optional().describe("HTML body. Max 1 MB."),
  cc: z.array(EmailAddress).max(50).optional(),
  bcc: z.array(EmailAddress).max(50).optional(),
  reply_to: EmailAddress.optional(),
});

const mAIL_view_input = z.object({
  message_id: MessageId,
});

// ---- Handlers ----

async function mAIL_send(
  input: z.infer<typeof mAIL_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; queued_at: string }> {
  readSupabaseEnv();
  if (!input.body_text && !input.body_html) {
    throw new Error("mAIL_send requires at least one of body_text or body_html.");
  }
  ctx.log("debug", "mAIL_send invoking mp0st-send", { to: input.to });
  return await invokeFunction<{ message_id: string; queued_at: string }>("mp0st-send", input);
}

async function mAIL_view(
  input: z.infer<typeof mAIL_view_input>,
  ctx: MosaddToolContext,
): Promise<{
  message_id: string;
  from: string;
  to: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
}> {
  readSupabaseEnv();
  ctx.log("debug", "mAIL_view invoking mp0st-view", { message_id: input.message_id });
  return await invokeFunction("mp0st-view", { message_id: input.message_id });
}

// ---- Registration ----

export const mailTools: MosaddTool[] = [
  {
    name: "mAIL_send",
    requires: "network",
    description:
      "Send an email from the user's mosadd address (<userId>@mosadd.com). Pass body_text or body_html (or both). Supports cc, bcc, reply_to.",
    inputSchema: mAIL_send_input,
    handler: mAIL_send as MosaddTool["handler"],
  },
  {
    name: "mAIL_view",
    requires: "network",
    description: "Read the full body and metadata of an email by message_id.",
    inputSchema: mAIL_view_input,
    handler: mAIL_view as MosaddTool["handler"],
  },
];
