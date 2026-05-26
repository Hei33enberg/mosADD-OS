/**
 * mDM — Direct Messages.
 *
 * USP: multi-thread per contact. Within one contact you can spin up multiple
 * threads for clarity (the way GitHub Issues handles conversations), unlike
 * WhatsApp/Telegram which collapse everything into a single chat.
 *
 * Phase 1 MVP: send, list, respond_request — wired to m0ssad-3 Supabase
 * Edge Functions as a strangler-fig step. Phase 2 will route through the
 * hosted gateway (mcp.mosadd.com) with the radar middleware in front.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

// ---- Schemas ----

const ContactRef = z
  .string()
  .min(1)
  .describe(
    "Recipient identifier. Accepts a mosadd contact id, an email address, or an E.164 phone number.",
  );

const ThreadId = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9._-]+$/i)
  .describe(
    "Optional thread id within the conversation with this contact. Defaults to the contact's main thread. mosadd USP: multiple threads per contact.",
  );

const mDM_send_input = z.object({
  to: ContactRef,
  text: z.string().min(1).max(64_000).describe("Message body (UTF-8). Max 64 KB."),
  thread_id: ThreadId.optional(),
  encrypted: z
    .boolean()
    .optional()
    .describe("If true, encrypt end-to-end with @m0ssad/crypto (Double Ratchet)."),
});

const mDM_list_input = z.object({
  contact_id: ContactRef.describe("Whose thread to read."),
  thread_id: ThreadId.optional(),
  limit: z.number().int().min(1).max(200).default(50).optional(),
  cursor: z.string().optional().describe("Opaque pagination cursor from a previous response."),
});

const mDM_respond_request_input = z.object({
  request_id: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});

// ---- Handlers ----

async function mDM_send(
  input: z.infer<typeof mDM_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string }> {
  ctx.log("debug", "mDM_send invoked", { to: input.to, len: input.text.length });

  // Phase 1 MVP: stub. Phase 1 full: POST to m0ssad-3 supabase/functions/message-send.
  // Phase 2: route through mcp.mosadd.com hosted gateway with radar middleware in front.
  return {
    message_id: `stub_${cryptoRandomId()}`,
    delivered_at: new Date().toISOString(),
    thread_id: input.thread_id ?? "default",
  };
}

async function mDM_list(
  input: z.infer<typeof mDM_list_input>,
  ctx: MosaddToolContext,
): Promise<{
  messages: Array<{
    id: string;
    sender: string;
    text: string;
    timestamp: string;
    thread_id: string;
  }>;
  next_cursor: string | null;
  threads: string[];
}> {
  ctx.log("debug", "mDM_list invoked", { contact_id: input.contact_id });
  return {
    messages: [],
    next_cursor: null,
    threads: ["default"],
  };
}

async function mDM_respond_request(
  input: z.infer<typeof mDM_respond_request_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true }> {
  ctx.log("debug", "mDM_respond_request invoked", input);
  return { ok: true };
}

// ---- Registration ----

export const mdmTools: MosaddTool[] = [
  {
    name: "mDM_send",
    description:
      "Send a direct message via mosadd mDM. Recipient may be a mosadd contact id, an email, or an E.164 phone. Optional thread_id puts the message in a named thread within the conversation (USP: multi-thread per contact, unlike WhatsApp/Telegram). Set encrypted=true to enable end-to-end encryption via the Double Ratchet.",
    inputSchema: mDM_send_input,
    handler: mDM_send as MosaddTool["handler"],
  },
  {
    name: "mDM_list",
    description:
      "List recent direct messages with a specific contact. Optionally filter to a single thread.",
    inputSchema: mDM_list_input,
    handler: mDM_list as MosaddTool["handler"],
  },
  {
    name: "mDM_respond_request",
    description:
      "Accept or reject an incoming DM request from a contact who is not yet in the user's whitelist.",
    inputSchema: mDM_respond_request_input,
    handler: mDM_respond_request as MosaddTool["handler"],
  },
];

// ---- Helpers ----

function cryptoRandomId(): string {
  const bytes = new Uint8Array(12);
  // @ts-expect-error globalThis.crypto is available in Node 20+
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
