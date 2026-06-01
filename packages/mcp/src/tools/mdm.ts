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
 * encrypted_payload with real X3DH + Double Ratchet via @mosadd/crypto.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, getSupabase, readSupabaseEnv } from "../providers/supabase.js";
import {
  encryptForPeer,
  decryptFromPeer,
  publishOwnPrekeys,
  isE2eeEnvelope,
} from "../crypto/mdm-session.js";

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
      "Unable to resolve current user. Ensure MOSADD_USER_JWT is set to a valid Supabase session token.",
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
 * V0.2:  replace with @mosadd/crypto Double Ratchet wrap.
 */
function packPlaintextPayload(text: string, replyToId?: string): Uint8Array {
  const envelope = {
    v: PROTOCOL_VERSION,
    type: "text",
    text,
    reply_to: replyToId ?? null,
    sent_at: new Date().toISOString(),
  };
  // OPAQUE bytes handed to the DmProvider — the provider does not interpret
  // them. Today: utf8 JSON. V0.2: @mosadd/crypto Double Ratchet ciphertext.
  return new Uint8Array(Buffer.from(JSON.stringify(envelope), "utf8"));
}

function unpackPayload(payload: Uint8Array): { text: string; sent_at?: string; reply_to?: string | null } {
  try {
    const json = Buffer.from(payload).toString("utf8");
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
): Promise<{ message_id: string; delivered_at: string; thread_id: string; encrypted: true }> {
  // E2EE path (default). The plaintext is packed into the inner mosadd.chat.v1
  // envelope, then SEALED via X3DH + Double Ratchet into an opaque envelope the
  // DmProvider moves without understanding. First contact fetches the peer's
  // published prekey bundle through the same provider (decision "1a").
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);

  const inner = packPlaintextPayload(input.text, input.reply_to_id);
  const sealed = await encryptForPeer(ctx.providers.keys, dm, input.to, inner);

  ctx.log("debug", "mDM_send E2EE via DmProvider", { thread_id: threadId, bytes: sealed.byteLength });

  const result = await dm.send({
    to: input.to,
    threadId,
    payload: sealed,
    replyToId: input.reply_to_id,
  });

  // Keep a LOCAL copy of our own outgoing plaintext so mDM_list can show it
  // back to the sender (the ratchet can't re-derive it on read). Best-effort:
  // only if the keystore offers the optional sent-items cache.
  if (ctx.providers.keys.putSentMessage) {
    await ctx.providers.keys.putSentMessage(result.id, inner);
  }

  return {
    message_id: result.id,
    delivered_at: result.deliveredAt,
    thread_id: threadId,
    encrypted: true,
  };
}

async function mDM_send_unencrypted(
  input: z.infer<typeof mDM_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string; encrypted: false }> {
  // DEPRECATED migration path: plaintext mosadd.chat.v1 envelope, no E2EE.
  // Kept so peers who have not yet published prekeys can still be reached
  // during the migration window. Will be removed once E2EE is universal.
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);
  const payload = packPlaintextPayload(input.text, input.reply_to_id);

  ctx.log("warn", "mDM_send_unencrypted (deprecated, plaintext) via DmProvider", {
    thread_id: threadId,
    bytes: payload.byteLength,
  });

  const result = await dm.send({
    to: input.to,
    threadId,
    payload,
    replyToId: input.reply_to_id,
  });

  return {
    message_id: result.id,
    delivered_at: result.deliveredAt,
    thread_id: threadId,
    encrypted: false,
  };
}

async function mDM_publish_keys(
  _input: Record<string, never>,
  ctx: MosaddToolContext,
): Promise<{ published: true; one_time_prekeys: number }> {
  // Publish the local prekey bundle so peers can start encrypted sessions with
  // us. Rides the same provider as messages (network row / radio announce).
  const { oneTimePrekeyCount } = await publishOwnPrekeys(ctx.providers.keys, ctx.providers.dm);
  ctx.log("debug", "mDM_publish_keys", { one_time_prekeys: oneTimePrekeyCount });
  return { published: true, one_time_prekeys: oneTimePrekeyCount };
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
    encrypted: boolean;
  }>;
  next_cursor: string | null;
  threads: string[];
}> {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.contact_id, input.thread_label);

  ctx.log("debug", "mDM_list via DmProvider", { thread_id: threadId });

  const result = await dm.list({ threadId, limit: input.limit ?? 50, cursor: input.cursor });

  const messages = await Promise.all(
    result.messages.map(async (m) => {
      const base = {
        id: m.id,
        sender_identity_id: m.senderId,
        timestamp: m.timestamp,
        thread_id: m.threadId,
      };
      // Legacy plaintext envelope (deprecated path) — unpack directly.
      if (!isE2eeEnvelope(m.payload)) {
        return { ...base, text: unpackPayload(m.payload).text, encrypted: false };
      }
      // Our own outgoing ratchet messages aren't decryptable from our own
      // ratchet on read. Recover the plaintext from the local sent-items cache
      // (this process). If absent (e.g. a different device/process), fall back
      // to a marker instead of failing.
      if (m.senderId === selfId) {
        const cached = await ctx.providers.keys.getSentMessage?.(m.id);
        if (cached) {
          return { ...base, text: unpackPayload(cached).text, encrypted: true };
        }
        return { ...base, text: "<encrypted · sent by you>", encrypted: true };
      }
      try {
        const inner = await decryptFromPeer(ctx.providers.keys, m.senderId, m.payload);
        return { ...base, text: unpackPayload(inner).text, encrypted: true };
      } catch (err) {
        ctx.log("warn", "mDM_list failed to decrypt a message", { id: m.id, error: String(err) });
        return { ...base, text: "<undecryptable>", encrypted: true };
      }
    }),
  );

  return {
    messages,
    next_cursor: result.nextCursor,
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

const mDM_publish_keys_input = z.object({});

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
    name: "mDM_publish_keys",
    requires: "any",
    description:
      "Publish your mDM prekey bundle so other people can start an end-to-end-encrypted conversation with you. Run this once after sign-in (and to replenish one-time prekeys). Rides the same transport as messages, so it works over network or off-grid radio.",
    inputSchema: mDM_publish_keys_input,
    handler: mDM_publish_keys as MosaddTool["handler"],
  },
  {
    name: "mDM_send",
    requires: "any",
    description:
      "Send an END-TO-END-ENCRYPTED direct message via mosadd mDM. Pass `to` as the recipient's mosadd identity_id (look it up with mDM_list_contacts). Establishes an X3DH + Double Ratchet session on first contact (the recipient must have run mDM_publish_keys). Optional thread_label puts the message in a named thread — mosadd USP: multiple threads per contact, unlike WhatsApp/Telegram. If the recipient has no published keys yet, use mDM_send_unencrypted.",
    inputSchema: mDM_send_input,
    handler: mDM_send as MosaddTool["handler"],
  },
  {
    name: "mDM_send_unencrypted",
    requires: "any",
    description:
      "DEPRECATED migration-window fallback: send a direct message WITHOUT end-to-end encryption (plaintext envelope). Only use when the recipient has not yet published prekeys (mDM_send fails with that hint). Prefer mDM_send. Will be removed once E2EE is universal.",
    inputSchema: mDM_send_input,
    handler: mDM_send_unencrypted as MosaddTool["handler"],
  },
  {
    name: "mDM_list",
    requires: "any",
    description:
      "List recent direct messages with a specific contact. Pass contact_id as the identity_id from mDM_list_contacts. Decrypts end-to-end-encrypted messages from the contact automatically; legacy plaintext messages are shown as-is. Optionally filter to a single thread_label.",
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
