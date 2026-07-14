/**
 * mp0st — Email.
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

const MessageId = z.string().min(1).describe("Message id (UUID) from mAYL_send or inbox.");

const mp0st_send_input = z.object({
  to: z.union([EmailAddress, z.array(EmailAddress).min(1).max(50)]).describe(
    "Recipient(s). Single address or array of up to 50.",
  ),
  subject: z.string().min(1).max(998).describe("Email subject line. Max 998 chars (RFC 5322)."),
  body_text: z.string().max(1_048_576).optional().describe("Plain text body. Max 1 MB."),
  body_html: z.string().max(1_048_576).optional().describe("HTML body. Max 1 MB."),
  cc: z.array(EmailAddress).max(50).optional(),
  bcc: z.array(EmailAddress).max(50).optional(),
  reply_to: EmailAddress.optional(),
  tracking: z
    .boolean()
    .optional()
    .describe("Open-pixel + link-click tracking. Default true. Set false to send with NO tracking (privacy / GDPR-friendly)."),
  force_reader: z
    .boolean()
    .optional()
    .describe("Default false. If true, the email body is a stub only and the recipient must open it in mosadd's secure reader — maximizes tracking (print/copy/time-on-read become observable). Best for confidential / legal mail."),
  disclose_tracking: z
    .boolean()
    .optional()
    .describe("Default false. If true (and tracking on), append a tracking-disclosure footer to the email — recommended for GDPR/ePrivacy compliance."),
  watermark: z
    .union([z.boolean(), z.string().max(120)])
    .optional()
    .describe("Inject a faint recipient watermark into the secure reader (shows in screenshots/prints). Pass true to watermark with the recipient address, or a custom string."),
  auto_destruct: z
    .enum(["1h", "24h", "7d"])
    .optional()
    .describe("Self-destruct timer: the secure-reader link expires after this window."),
});

const mp0st_view_input = z.object({
  message_id: MessageId,
});

const mp0st_delete_input = z.object({
  message_id: MessageId,
});

const mp0st_list_input = z.object({
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

const mp0st_stats_input = z.object({
  message_id: MessageId,
});

const mp0st_events_input = z.object({
  message_id: MessageId,
});

const mp0st_metrics_input = z.object({});

const mp0st_revoke_input = z.object({
  message_id: MessageId,
  restore: z
    .boolean()
    .optional()
    .describe("Set true to UN-revoke (restore access). Default false = revoke."),
});

const mp0st_audit_export_input = z.object({
  message_id: MessageId,
});

const mp0st_consent_input = z.object({
  action: z
    .enum(["list", "check", "optin"])
    .describe("'list' = recipients who opted out of your tracking; 'check' = is one recipient opted out; 'optin' = re-enable tracking for a recipient."),
  recipient: EmailAddress.optional().describe("Required for 'check' and 'optin'."),
});

const mp0st_notify_input = z.object({
  since: z
    .string()
    .optional()
    .describe("ISO-8601 cursor — return only events newer than this. Pass the previous response's `cursor` to poll for new activity."),
  limit: z.number().int().min(1).max(200).optional().describe("Max events. Default 50."),
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

async function mp0st_send(
  input: z.infer<typeof mp0st_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; status: string; is_internal: boolean }> {
  readSupabaseEnv();
  if (!input.body_text && !input.body_html) {
    throw new Error("mp0st_send requires at least one of body_text or body_html.");
  }
  ctx.log("debug", "mp0st_send invoking mp0st-send", { to: input.to });
  // mp0st-send returns { ok, email_id, status, is_internal } — remap email_id to the
  // tool's message_id contract (email_id IS the message id). Surface backend errors.
  const res = await invokeFunction<{ ok?: boolean; email_id?: string; status?: string; is_internal?: boolean; error?: string }>("mp0st-send", input);
  if (res.error) throw new Error(res.error);
  return { message_id: res.email_id ?? "", status: res.status ?? "sent", is_internal: res.is_internal ?? false };
}

async function mp0st_view(
  input: z.infer<typeof mp0st_view_input>,
  ctx: MosaddToolContext,
): Promise<{
  message_id: string;
  from: string;
  to: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  sent_at: string;
}> {
  readSupabaseEnv();
  // mp0st-get (NOT mp0st-view): mp0st-view is the open-tracking pixel endpoint
  // keyed on ?t=<trackingId> and always 400s "Missing tracking ID" on a JSON POST.
  // mp0st-get reads the owner-scoped email by id and returns the full body.
  ctx.log("debug", "mp0st_view invoking mp0st-get", { message_id: input.message_id });
  return await invokeFunction("mp0st-get", { message_id: input.message_id });
}

async function mp0st_list(
  input: z.infer<typeof mp0st_list_input>,
  ctx: MosaddToolContext,
): Promise<{ emails: MailListItem[]; next_cursor: string | null }> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_list invoking mp0st-list", { direction: input.direction });
  return await invokeFunction<{ emails: MailListItem[]; next_cursor: string | null }>("mp0st-list", {
    direction: input.direction ?? null,
    limit: input.limit ?? 50,
    before: input.before ?? null,
  });
}

async function mp0st_delete(
  input: z.infer<typeof mp0st_delete_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true; message_id: string; deleted: true }> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_delete invoking mp0st-delete", { message_id: input.message_id });
  return await invokeFunction<{ ok: true; message_id: string; deleted: true }>("mp0st-delete", {
    message_id: input.message_id,
  });
}

interface MailEngagement {
  message_id: string;
  subject: string;
  to: string;
  direction: string;
  status: string;
  sent_at: string;
  open_count: number;
  unique_opens: number;
  click_count: number;
  forwarded: boolean;
  first_opened_at: string | null;
  last_opened_at: string | null;
  events_by_type: Record<string, number>;
  total_events: number;
}

async function mp0st_stats(
  input: z.infer<typeof mp0st_stats_input>,
  ctx: MosaddToolContext,
): Promise<{ summary: MailEngagement }> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_stats invoking mp0st-stats", { message_id: input.message_id });
  return await invokeFunction<{ summary: MailEngagement }>("mp0st-stats", {
    message_id: input.message_id,
  });
}

async function mp0st_events(
  input: z.infer<typeof mp0st_events_input>,
  ctx: MosaddToolContext,
): Promise<{
  summary: MailEngagement;
  events: Array<{ event_type: string; at: string; device: string | null; ip_hash: string | null; link_url: string | null }>;
}> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_events invoking mp0st-stats", { message_id: input.message_id });
  return await invokeFunction("mp0st-stats", { message_id: input.message_id, events: true });
}

async function mp0st_metrics(
  _input: z.infer<typeof mp0st_metrics_input>,
  ctx: MosaddToolContext,
): Promise<{
  mailbox: {
    total_sent: number;
    opened_emails: number;
    open_rate_pct: number;
    total_opens: number;
    total_clicks: number;
    forwarded_emails: number;
  };
}> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_metrics invoking mp0st-stats");
  return await invokeFunction("mp0st-stats", {});
}

async function mp0st_revoke(
  input: z.infer<typeof mp0st_revoke_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true; message_id: string; revoked: boolean; expires_at: string | null }> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_revoke invoking mp0st-revoke", { message_id: input.message_id, restore: !!input.restore });
  return await invokeFunction("mp0st-revoke", {
    message_id: input.message_id,
    restore: input.restore ?? false,
  });
}

async function mp0st_audit_export(
  input: z.infer<typeof mp0st_audit_export_input>,
  ctx: MosaddToolContext,
): Promise<{ audit: Record<string, unknown>; signature: string; algo: string; note: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_audit_export invoking mp0st-audit", { message_id: input.message_id });
  return await invokeFunction("mp0st-audit", { message_id: input.message_id });
}

async function mp0st_consent(
  input: z.infer<typeof mp0st_consent_input>,
  ctx: MosaddToolContext,
): Promise<Record<string, unknown>> {
  readSupabaseEnv();
  if ((input.action === "check" || input.action === "optin") && !input.recipient) {
    throw new Error(`mp0st_consent action '${input.action}' requires a 'recipient' email address.`);
  }
  ctx.log("debug", "mp0st_consent invoking mp0st-consent", { action: input.action });
  return await invokeFunction("mp0st-consent", { action: input.action, recipient: input.recipient ?? null });
}

async function mp0st_notify(
  input: z.infer<typeof mp0st_notify_input>,
  ctx: MosaddToolContext,
): Promise<{
  events: Array<{ message_id: string; subject: string | null; to: string | null; event_type: string; device: string | null; link_url: string | null; at: string }>;
  cursor: string | null;
  count: number;
}> {
  readSupabaseEnv();
  ctx.log("debug", "mp0st_notify invoking mp0st-notify", { since: input.since });
  return await invokeFunction("mp0st-notify", { action: "feed", since: input.since ?? null, limit: input.limit ?? 50 });
}

// ---- Registration ----

export const mailTools: MosaddTool[] = [
  {
    name: "mAYL_list",
    requires: "network",
    description:
      "List the user's mailbox (their <userId>@mosadd.com inbox/outbox) newest-first, with sender, subject, status and a short snippet. Filter by direction ('inbound' = received, 'outbound' = sent). Use the returned next_cursor with `before` to page through older mail. Call mAYL_view to read a full message body.",
    inputSchema: mp0st_list_input,
    handler: mp0st_list as MosaddTool["handler"],
  },
  {
    name: "mAYL_send",
    requires: "network",
    description:
      "Send an email from the user's mosadd address (<userId>@mosadd.com). Pass body_text or body_html (or both). Supports cc, bcc, reply_to. Monitoring/legal options: tracking (open+click, default on; set false for no tracking), force_reader (stub email → recipient opens in mosadd's secure reader, unlocking print/copy/time-on-read tracking + revoke), watermark (recipient watermark visible in screenshots/prints), disclose_tracking (GDPR footer), auto_destruct ('1h'|'24h'|'7d').",
    inputSchema: mp0st_send_input,
    handler: mp0st_send as MosaddTool["handler"],
  },
  {
    name: "mAYL_view",
    requires: "network",
    description: "Read the full body and metadata of an email by message_id.",
    inputSchema: mp0st_view_input,
    handler: mp0st_view as MosaddTool["handler"],
  },
  {
    name: "mAYL_delete",
    requires: "network",
    description:
      "Delete one of the user's emails by message_id (from mAYL_list). Soft-delete — it stops showing in mAYL_list. Owner-scoped: only your own mail.",
    inputSchema: mp0st_delete_input,
    handler: mp0st_delete as MosaddTool["handler"],
  },
  {
    name: "mAYL_stats",
    requires: "network",
    description:
      "Engagement summary for one sent email (by message_id): open_count, unique_opens, click_count, whether it was likely forwarded, first/last opened time, and a breakdown of tracked event types. Opens/clicks are real (tracking pixel + link-wrap); forward detection is best-effort (IP-subnet diversity). Owner-scoped.",
    inputSchema: mp0st_stats_input,
    handler: mp0st_stats as MosaddTool["handler"],
  },
  {
    name: "mAYL_events",
    requires: "network",
    description:
      "Raw engagement timeline for one email (by message_id): every tracked event (pixel_open, link_click, forwarded, page_view, copy/print/focus signals) with timestamp, device type and link URL. Use mAYL_stats for the rollup; use this for the per-event detail. Owner-scoped.",
    inputSchema: mp0st_events_input,
    handler: mp0st_events as MosaddTool["handler"],
  },
  {
    name: "mAYL_metrics",
    requires: "network",
    description:
      "Mailbox-wide engagement aggregate across the user's sent mail: total_sent, opened_emails, open_rate_pct, total_opens, total_clicks, forwarded_emails. Owner-scoped.",
    inputSchema: mp0st_metrics_input,
    handler: mp0st_metrics as MosaddTool["handler"],
  },
  {
    name: "mAYL_revoke",
    requires: "network",
    description:
      "Revoke (recall) a sent email's secure-reader access by message_id — the recipient can no longer open the full message via the mosadd reader link (Virtru-style recall, immediate). Pass restore:true to re-enable. HONEST LIMIT: cannot un-send or claw back content the recipient already read, copied, or screenshotted — only disables future reader access. Owner-scoped.",
    inputSchema: mp0st_revoke_input,
    handler: mp0st_revoke as MosaddTool["handler"],
  },
  {
    name: "mAYL_audit_export",
    requires: "network",
    description:
      "Export a tamper-evident engagement audit report for one sent email (RMail-style): full event trail (opens, clicks, reader print/copy/forward signals) + totals, plus an HMAC-SHA256 signature over the canonical JSON so the report can be proven unaltered. For legal/compliance use. HONEST LIMIT: proves what mosadd observed; it is not a qualified delivery receipt (ERDS). Owner-scoped.",
    inputSchema: mp0st_audit_export_input,
    handler: mp0st_audit_export as MosaddTool["handler"],
  },
  {
    name: "mAYL_consent",
    requires: "network",
    description:
      "Manage recipient tracking opt-outs (GDPR/ePrivacy). action 'list' = recipients who opted out of your tracking; 'check' {recipient} = whether one opted out; 'optin' {recipient} = re-enable. Recipients self-opt-out via the footer link in your tracked emails; mAYL_send then automatically sends them with NO pixel/link-wrap. Owner-scoped.",
    inputSchema: mp0st_consent_input,
    handler: mp0st_consent as MosaddTool["handler"],
  },
  {
    name: "mAYL_notify",
    requires: "network",
    description:
      "Recent engagement feed across ALL your sent mail — the 'who just opened/clicked my mail' notifications stream (opens, clicks, forwards, reader print/copy signals), newest first, each with the email subject + recipient. Poll: pass the returned `cursor` back as `since` to get only new activity. Owner-scoped.",
    inputSchema: mp0st_notify_input,
    handler: mp0st_notify as MosaddTool["handler"],
  },
];
