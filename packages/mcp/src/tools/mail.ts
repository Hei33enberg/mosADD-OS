/**
 * mAIL — Email.
 *
 * Every mosadd user gets `<userId>@mosadd.com` for free — incoming mail lands
 * in their app, outgoing mail flows through the mosadd mp0st pipeline.
 *
 * Phase 1 alpha: wired to the mosadd backend's `mp0st-send` + `mp0st-view` Edge Functions.
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

const mAIL_delete_input = z.object({
  message_id: MessageId,
});

const mAIL_list_input = z.object({
  direction: z
    .enum(["inbound", "outbound"])
    .optional()
    .describe("Filter to received (inbound) or sent (outbound) mail. Omit for both."),
  limit: z.number().int().min(1).max(200).optional().describe("Max emails to return. Default 50."),
  before: z
    .string()
    .optional()
    .describe("Pagination cursor: pass the previous response's next_cursor to get the next (older) page."),
});

interface MailListItem {
  message_id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  subject: string;
  priority: string;
  status: string;
  sent_at: string;
  snippet: string;
}

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

async function mAIL_list(
  input: z.infer<typeof mAIL_list_input>,
  ctx: MosaddToolContext,
): Promise<{ emails: MailListItem[]; next_cursor: string | null }> {
  readSupabaseEnv();
  ctx.log("debug", "mAIL_list invoking mp0st-list", { direction: input.direction });
  return await invokeFunction<{ emails: MailListItem[]; next_cursor: string | null }>("mp0st-list", {
    direction: input.direction ?? null,
    limit: input.limit ?? 50,
    before: input.before ?? null,
  });
}

async function mAIL_delete(
  input: z.infer<typeof mAIL_delete_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true; message_id: string; deleted: true }> {
  readSupabaseEnv();
  ctx.log("debug", "mAIL_delete invoking mp0st-delete", { message_id: input.message_id });
  return await invokeFunction<{ ok: true; message_id: string; deleted: true }>("mp0st-delete", {
    message_id: input.message_id,
  });
}

// ---- Registration ----

export const mailTools: MosaddTool[] = [
  {
    name: "mAIL_list",
    requires: "network",
    description:
      "List the user's mailbox (their <userId>@mosadd.com inbox/outbox) newest-first, with sender, subject, status and a short snippet. Filter by direction ('inbound' = received, 'outbound' = sent). Use the returned next_cursor with `before` to page through older mail. Call mAIL_view to read a full message body.",
    inputSchema: mAIL_list_input,
    handler: mAIL_list as MosaddTool["handler"],
  },
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
  {
    name: "mAIL_delete",
    requires: "network",
    description:
      "Delete one of the user's emails by message_id (from mAIL_list). Soft-delete — it stops showing in mAIL_list. Owner-scoped: only your own mail.",
    inputSchema: mAIL_delete_input,
    handler: mAIL_delete as MosaddTool["handler"],
  },
];
