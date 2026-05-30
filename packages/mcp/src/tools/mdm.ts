/**
 * mDM — Direct Messages.
 *
 * USP: multi-thread per contact. Within one contact you can spin up multiple
 * threads for clarity (the way GitHub Issues handles conversations), unlike
 * WhatsApp/Telegram which collapse everything into a single chat.
 *
 * Phase 1 alpha: wired to the m0ssad-3 Supabase Edge Functions as a
 * strangler-fig step (`message-send`, `message-list`). The user supplies
 * their own Supabase URL + anon key + a session JWT via env vars (BYOK).
 *
 * Phase 2 will route through the hosted gateway (mcp.mosadd.com) with the
 * 167-event radar middleware in front, and replace the plaintext
 * encrypted_payload with real X3DH + Double Ratchet via @m0ssad/crypto.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, getSupabase, readSupabaseEnv } from "../providers/supabase.js";

// ---- Constants ----

const PROTOCOL_VERSION = "mosadd.chat.v1";

// ---- Schemas ----

const ContactRef = z
  .string()
  .min(1)
  .describe(
    "Recipient identity id (UUID). Use mDM_list_contacts first to find the right id. Future versions will accept handle/email/phone directly.",
  );

const ThreadSuffix = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._-]+$/)
  .describe(
    "Optional thread label within the conversation with this contact. Defaults to the contact's main thread. mosadd USP: multiple threads per contact.",
  );

const mDM_send_input = z.object({
  to: ContactRef,
  text: z.string().min(1).max(64_000).describe("Message body (UTF-8). Max 64 KB."),
  thread_label: ThreadSuffix.optional().describe(
    "Optional thread label. If omitted, uses the default thread for this contact.",
  ),
  reply_to_id: z.string().optional().describe("Optional id of the message being replied to."),
});

const mDM_list_input = z.object({
  contact_id: ContactRef.describe("Identity id of the contact to read messages with."),
  thread_label: ThreadSuffix.optional(),
  limit: z.number().int().min(1).max(200).default(50).optional(),
  cursor: z.string().optional().describe("Opaque pagination cursor from a previous response."),
});

const mDM_list_contacts_input = z.object({
  limit: z.number().int().min(1).max(500).default(100).optional(),
});

const mDM_respond_request_input = z.object({
  request_id: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});

// ---- Helpers ----

/**
 * Deterministic DM thread id from a pair of identities. Sorts lexicographically
 * so both peers compute the same id regardless of who sends first.
 *
 *   dmThreadId("alice", "bob")  ===  dmThreadId("bob", "alice")  ===  "dm:alice:bob"
 *   dmThreadId("alice", "bob", "work") === "dm:alice:bob:work"
 */
function dmThreadId(selfId: string, otherId: string, label?: string): string {
  const [a, b] = [selfId, otherId].sort();
  return label ? `dm:${a}:${b}:${label}` : `dm:${a}:${b}`;
}

/**
 * Resolve the current user's identity row from their JWT-authed Supabase client.
 * Returns the identity id (NOT the auth user id — they differ).
 */
async function resolveSelfIdentityId(): Promise<string> {
  const sb = getSupabase();
  const { data: u, error: ue } = await sb.auth.getUser();
  if (ue || !u?.user) {
    throw new Error(
      "Unable to resolve current user. Ensure M0SSAD_USER_JWT is set to a valid Supabase session token.",
    );
  }
  const { data: identity, error } = await sb
    .from("identities")
    .select("id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error || !identity) {
    throw new Error("Current user has no mosadd identity row. Sign in to mosadd.com first.");
  }
  return identity.id as string;
}

/**
 * Pack message body into the encrypted_payload string the Edge Function expects.
 *
 * ALPHA: not actually encrypted — wraps plaintext in JSON + base64.
 *        Receivers in the m0ssad-3 app understand this `mosadd.chat.v1` shape.
 * V0.2:  replace with @m0ssad/crypto Double Ratchet wrap.
 */
function packPlaintextPayload(text: string, replyToId?: string): string {
  const envelope = {
    v: PROTOCOL_VERSION,
    type: "text",
    text,
    reply_to: replyToId ?? null,
    sent_at: new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64");
}

function unpackPayload(payload: string): { text: string; sent_at?: string; reply_to?: string | null } {
  try {
    const json = Buffer.from(payload, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (typeof obj?.text === "string") return obj;
  } catch {
    /* fall through */
  }
  return { text: "<ciphertext>" };
}

// ---- Handlers ----

async function mDM_send(
  input: z.infer<typeof mDM_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string }> {
  // Fails fast if env vars missing — agent gets a clear actionable error.
  readSupabaseEnv();

  const selfId = await resolveSelfIdentityId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);
  const encrypted_payload = packPlaintextPayload(input.text, input.reply_to_id);

  ctx.log("debug", "mDM_send invoking message-send", {
    thread_id: threadId,
    bytes: encrypted_payload.length,
  });

  type MessageSendResponse = { message?: { id: string; created_at: string } };
  const data = await invokeFunction<MessageSendResponse>("message-send", {
    space_id: "dm",
    thread_id: threadId,
    encrypted_payload,
    message_type: "text",
    protocol_version: PROTOCOL_VERSION,
    recipient_account_id: input.to,
    reply_to_id: input.reply_to_id ?? null,
  });

  if (!data?.message?.id) {
    throw new Error("message-send returned no message id");
  }

  return {
    message_id: data.message.id,
    delivered_at: data.message.created_at ?? new Date().toISOString(),
    thread_id: threadId,
  };
}

async function mDM_list(
  input: z.infer<typeof mDM_list_input>,
  ctx: MosaddToolContext,
): Promise<{
  messages: Array<{
    id: string;
    sender_identity_id: string;
    text: string;
    timestamp: string;
    thread_id: string;
  }>;
  next_cursor: string | null;
  threads: string[];
}> {
  readSupabaseEnv();
  const selfId = await resolveSelfIdentityId();
  const threadId = dmThreadId(selfId, input.contact_id, input.thread_label);

  ctx.log("debug", "mDM_list invoking message-list", { thread_id: threadId });

  type MessageListResponse = {
    messages?: Array<{
      id: string;
      sender_identity_id: string;
      thread_id: string;
      encrypted_payload: string;
      created_at: string;
    }>;
    next_cursor?: string | null;
  };

  const data = await invokeFunction<MessageListResponse>("message-list", {
    space_id: "dm",
    thread_id: threadId,
    limit: input.limit ?? 50,
    cursor: input.cursor,
  });

  const messages = (data?.messages ?? []).map((m) => ({
    id: m.id,
    sender_identity_id: m.sender_identity_id,
    text: unpackPayload(m.encrypted_payload).text,
    timestamp: m.created_at,
    thread_id: m.thread_id,
  }));

  return {
    messages,
    next_cursor: data?.next_cursor ?? null,
    threads: [threadId],
  };
}

async function mDM_list_contacts(
  input: z.infer<typeof mDM_list_contacts_input>,
  ctx: MosaddToolContext,
): Promise<{
  contacts: Array<{ identity_id: string; account_id: string | null; display_name: string | null; state: string }>;
}> {
  readSupabaseEnv();
  const selfId = await resolveSelfIdentityId();
  const sb = getSupabase();

  ctx.log("debug", "mDM_list_contacts querying contacts table", { selfId });

  const { data, error } = await sb
    .from("contacts")
    .select("contact_identity_id, state, identities:contact_identity_id(account_id, display_name)")
    .eq("owner_identity_id", selfId)
    .limit(input.limit ?? 100);

  if (error) {
    throw new Error(`Failed to list contacts: ${error.message}`);
  }

  type Row = {
    contact_identity_id: string;
    state: string;
    identities?: { account_id?: string | null; display_name?: string | null } | null;
  };
  const contacts = (data as unknown as Row[]).map((r) => ({
    identity_id: r.contact_identity_id,
    account_id: r.identities?.account_id ?? null,
    display_name: r.identities?.display_name ?? null,
    state: r.state,
  }));

  return { contacts };
}

async function mDM_respond_request(
  input: z.infer<typeof mDM_respond_request_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true }> {
  readSupabaseEnv();
  ctx.log("debug", "mDM_respond_request invoking message-request-respond", input);
  await invokeFunction<{ ok: boolean }>("message-request-respond", {
    request_id: input.request_id,
    action: input.action,
  });
  return { ok: true };
}

// ---- Registration ----

export const mdmTools: MosaddTool[] = [
  {
    name: "mDM_list_contacts",
    requires: "any",
    description:
      "List the user's mosadd contacts. Returns identity_id (use this for mDM_send / mDM_list), account handle, display name, and contact state (pending, accepted, blocked).",
    inputSchema: mDM_list_contacts_input,
    handler: mDM_list_contacts as MosaddTool["handler"],
  },
  {
    name: "mDM_send",
    requires: "any",
    description:
      "Send a direct message via mosadd mDM. Pass `to` as the recipient's mosadd identity_id (look it up with mDM_list_contacts). Optional thread_label puts the message in a named thread within the conversation — mosadd USP: multiple threads per contact, unlike WhatsApp/Telegram. Alpha: payload is plaintext JSON base64-wrapped. Phase 2 swaps in Double Ratchet end-to-end encryption.",
    inputSchema: mDM_send_input,
    handler: mDM_send as MosaddTool["handler"],
  },
  {
    name: "mDM_list",
    requires: "any",
    description:
      "List recent direct messages with a specific contact. Pass contact_id as the identity_id from mDM_list_contacts. Optionally filter to a single thread_label.",
    inputSchema: mDM_list_input,
    handler: mDM_list as MosaddTool["handler"],
  },
  {
    name: "mDM_respond_request",
    requires: "any",
    description:
      "Accept or reject an incoming DM request from a contact who is not yet in the user's whitelist.",
    inputSchema: mDM_respond_request_input,
    handler: mDM_respond_request as MosaddTool["handler"],
  },
];
