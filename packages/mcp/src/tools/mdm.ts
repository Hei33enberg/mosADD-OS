/**
 * mDM — Direct Messages.
 *
 * USP: multi-thread per contact. Within one contact you can spin up multiple
 * threads for clarity (the way GitHub Issues handles conversations), unlike
 * WhatsApp/Telegram which collapse everything into a single chat.
 *
 * Phase 1 alpha: wired to the mosadd Supabase Edge Functions as a
 * strangler-fig step (`message-send`, `message-list`). The user supplies
 * their own Supabase URL + anon key + a session JWT via env vars (BYOK).
 *
 * Phase 2 will route through the hosted gateway (mcp.mosadd.com) with the
 * threat-radar middleware in front, and replace the plaintext
 * encrypted_payload with real X3DH + Double Ratchet via @mosadd/crypto.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { formatVoiceIfAny } from "./voice-format.js";
import { invokeFunction, getSupabase, readSupabaseEnv } from "../providers/supabase.js";
import {
  encryptForPeer,
  decryptFromPeer,
  isE2eeEnvelope,
  ensureOwnBundlePublished,
  bundlePolicyForKind,
  fetchVerifiedBundle,
  sealForSelf,
  sealForPeerRecoverable,
  openSelfSealed,
  openPeerRecoverable,
  type OwnBundleState,
  type PublicPrekeyBundle,
} from "../crypto/mdm-session.js";
import {
  MDM_TEXT_MESSAGE_TYPE,
  MDM_MCP_SEALED_MESSAGE_TYPE,
  type DmSendArgsExt,
  type DmMessageExt,
} from "../providers/supabase-dm.js";

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
 *        Receivers in the mosadd consumer app understand this `mosadd.chat.v1` shape.
 * V0.2:  replace with @mosadd/crypto Double Ratchet wrap.
 */
function packPlaintextPayload(text: string): Uint8Array {
  // Pure text bytes so the consumer app displays clean message text directly
  return new Uint8Array(Buffer.from(text, "utf8"));
}

function unpackPayload(payload: Uint8Array): { text: string; sent_at?: string; reply_to?: string | null } {
  try {
    const raw = Buffer.from(payload).toString("utf8");
    try {
      const obj = JSON.parse(raw);
      if (typeof obj?.text === "string") return obj;
    } catch {
      return { text: raw };
    }
    return { text: raw };
  } catch {
    /* fall through */
  }
  return { text: "<ciphertext>" };
}

// ---- Handlers ----

/** Does this provider know the caller's identity kind (Supabase lane)? */
async function selfKindOf(dm: MosaddToolContext["providers"]["dm"]): Promise<string | null> {
  const f = (dm as { selfKind?: () => Promise<string | null> }).selfKind;
  return typeof f === "function" ? await f.call(dm) : null;
}

/** A peer's identity kind when the provider can tell (Supabase lane); null = unknown. */
async function peerKindOf(dm: MosaddToolContext["providers"]["dm"], peerId: string): Promise<string | null> {
  const f = (dm as { peerKind?: (id: string) => Promise<string | null> }).peerKind;
  if (typeof f !== "function") return null;
  try {
    return await f.call(dm, peerId);
  } catch {
    return null;
  }
}

type MdmSendResultOut = {
  message_id: string;
  delivered_at: string;
  thread_id: string;
  encrypted: boolean;
  /**
   * "plaintext_agent_lane": an agent line is a party, so the DM goes in the clear (rozkaz Krola
   * 20.09, same rule as the app's peerIsAgent). "e2ee": human to human, X3DH + Double Ratchet.
   */
  mode: "plaintext_agent_lane" | "e2ee";
  /**
   * WHY this mode (29.09, rozkaz Krola 28.09 „sciagnij szyfrowanie z naszych rozmow"):
   * "fleet_plaintext" = an agent line is a party OR it is a note to self → always in the clear;
   * "human_to_human" = two people, E2EE unchanged.
   */
  reason: "fleet_plaintext" | "human_to_human";
  /** the sender can read this message back from ANY process / ANY key of the same identity */
  sender_copy: boolean;
  /** the recipient can read it without a ratchet session */
  recipient_copy: boolean;
  /** state of this identity in the key directory (E2EE only; the plaintext lane never touches it) */
  identity: OwnBundleState | "untouched";
};

async function mDM_send(
  input: z.infer<typeof mDM_send_input>,
  ctx: MosaddToolContext,
): Promise<MdmSendResultOut> {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);
  const keys = ctx.providers.keys;

  // ⛔ POPRAWKA 27.09.2026 (niezalezna weryfikacja toru mdm-brama). The first fix seeded the mDM
  // identity from ONE API key and let an agent line (re)publish it. An identity holds MANY keys
  // (general@: 8 active), so the directory flapped between per-key identities and every copy
  // sealed under the previous key stopped opening. The source answer is the King's rule, not a
  // better key: an agent line NEVER uses E2EE (DECYZJE-KROLA 20.09 12:56Z: linie<->linie,
  // linie<->Krol, czlowiek->linia: jawnie). Plaintext is readable by every key of the line and by
  // the recipient's app on every device, and no bundle is needed, so nothing can flap.
  //
  // 29.09.2026 (owner decision 28.09: no encryption on agent-line conversations, in any channel or
  // identity): a note to SELF (to === selfId) goes in the
  // clear too. MCP sessions on the King's key sealed his own thread (11 envelopes 21.09) and the
  // server now refuses envelopes there (message-send `fleet_plaintext_only`). Kinds of BOTH sides
  // are read from `identities.kind` before any sealing; only person↔person stays E2EE.
  const selfKind = await selfKindOf(dm);
  const noteToSelf = input.to === selfId;
  const peerKind = selfKind === "agent" || noteToSelf ? selfKind : await peerKindOf(dm, input.to);
  if (selfKind === "agent" || peerKind === "agent" || noteToSelf) {
    const payload = packPlaintextPayload(input.text);
    ctx.log("debug", "mDM_send agent-line plaintext (owner decisions 20.09 + 28.09)", {
      thread_id: threadId,
      self_kind: selfKind,
      peer_kind: peerKind,
      note_to_self: noteToSelf,
    });
    const plainArgs: DmSendArgsExt = {
      to: input.to,
      threadId,
      payload,
      replyToId: input.reply_to_id,
      messageType: MDM_TEXT_MESSAGE_TYPE,
    };
    const result = await dm.send(plainArgs);
    return {
      message_id: result.id,
      delivered_at: result.deliveredAt,
      thread_id: threadId,
      encrypted: false,
      mode: "plaintext_agent_lane",
      reason: "fleet_plaintext",
      sender_copy: true,
      recipient_copy: true,
      identity: "untouched",
    };
  }

  // E2EE path (human to human, or a lane that cannot tell kinds). The plaintext is packed into
  // the inner envelope, then SEALED via X3DH + Double Ratchet into an opaque envelope the
  // DmProvider moves without understanding. First contact fetches the peer's published prekey
  // bundle through the same provider (decision "1a").
  //
  // On a PERSON's key MCP writes nothing to the key directory (bundlePolicyForKind: the app owns
  // a human's bundle) and no "s1." self copy: the app opens only copies sealed under its own seed,
  // and an unopenable "s1." makes it state a FALSE reason ("device"/"key") for the bubble. The
  // envelope is typed `text` so the app states the true one: sent by MCP, no copy for this device.
  let identity: OwnBundleState = "foreign";
  try {
    identity = await ensureOwnBundlePublished(keys, dm, selfId, bundlePolicyForKind(selfKind, { explicit: false }));
  } catch (err) {
    // Directory unreachable: the ratchet envelope still carries its own handshake, so the send
    // proceeds; only the recipient copy is skipped (it would be sealed under an unverified identity).
    ctx.log("warn", "mDM_send could not reconcile own prekey bundle", { error: String(err) });
  }
  const ourIdentityIsPublished = identity === "consistent" || identity === "published";

  // reply-linkage jedzie w dm.send({replyToId}) — surowy tekst nie ma koperty, w ktora
  // mozna by go wpakowac (zmiana formatu 2026-08-25, patrz packPlaintextPayload).
  const inner = packPlaintextPayload(input.text);
  const sealed = await encryptForPeer(keys, dm, input.to, inner);

  // "s1." only where the reader of that copy is MCP itself: never on a human key (see above).
  const selfPayload = selfKind !== "human" && ourIdentityIsPublished ? await sealForSelf(keys, inner) : null;
  let recipientSelfPayload: string | null = null;
  // The recipient opens "r1." with OUR PUBLISHED identity, so it is written only when the
  // directory holds exactly our key. A note-to-self needs none.
  if (ourIdentityIsPublished && input.to !== selfId) {
    try {
      const peer = await fetchVerifiedBundle(dm, input.to);
      if (peer) recipientSelfPayload = await sealForPeerRecoverable(keys, peer, inner);
    } catch (err) {
      ctx.log("warn", "mDM_send skipped the recipient copy", { error: String(err) });
    }
  }

  ctx.log("debug", "mDM_send E2EE via DmProvider", {
    thread_id: threadId,
    bytes: sealed.byteLength,
    identity,
    sender_copy: !!selfPayload,
    recipient_copy: !!recipientSelfPayload,
  });

  const sendArgs: DmSendArgsExt = {
    to: input.to,
    threadId,
    payload: sealed,
    replyToId: input.reply_to_id,
    messageType: MDM_MCP_SEALED_MESSAGE_TYPE,
    selfPayload,
    recipientSelfPayload,
  };
  const result = await dm.send(sendArgs);

  // Keep a LOCAL copy of our own outgoing plaintext so mDM_list can show it
  // back to the sender (the ratchet can't re-derive it on read). Best-effort:
  // only if the keystore offers the optional sent-items cache.
  if (keys.putSentMessage) {
    await keys.putSentMessage(result.id, inner);
  }

  return {
    message_id: result.id,
    delivered_at: result.deliveredAt,
    thread_id: threadId,
    encrypted: true,
    mode: "e2ee",
    reason: "human_to_human",
    sender_copy: !!selfPayload,
    recipient_copy: !!recipientSelfPayload,
    identity,
  };
}

async function mDM_send_unencrypted(
  input: z.infer<typeof mDM_send_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string; encrypted: false }> {
  // Plaintext send, no E2EE. ⛔ 29.09.2026: NOT deprecated — this is THE path for every
  // conversation with a fleet line and with the King (rozkaz Krola 28.09). Stays forever.
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);
  const payload = packPlaintextPayload(input.text);

  ctx.log("debug", "mDM_send_unencrypted (plaintext) via DmProvider", {
    thread_id: threadId,
    bytes: payload.byteLength,
  });

  const plainArgs: DmSendArgsExt = {
    to: input.to,
    threadId,
    payload,
    replyToId: input.reply_to_id,
    messageType: MDM_TEXT_MESSAGE_TYPE,
  };
  const result = await dm.send(plainArgs);

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
): Promise<{ published: boolean; identity: OwnBundleState; one_time_prekeys: number; note?: string }> {
  // Publish the local prekey bundle so peers can start encrypted sessions with
  // us. Rides the same provider as messages (network row / radio announce).
  //
  // ⛔ 27.09.2026: never over a PERSON's app-anchored bundle. The MCP identity is seeded from the
  // API key, the app's from the login secret; replacing the app's bundle breaks every DM to that
  // person on every device (bundlePolicyForKind, explicit). An empty directory may be filled.
  const dm = ctx.providers.dm;
  const keys = ctx.providers.keys;
  const selfId = await dm.selfId();
  const identity = await ensureOwnBundlePublished(
    keys,
    dm,
    selfId,
    bundlePolicyForKind(await selfKindOf(dm), { explicit: true }),
  );
  const { oneTimePrekeys } = await keys.getOwnMaterial();
  ctx.log("debug", "mDM_publish_keys", { identity, one_time_prekeys: oneTimePrekeys.length });
  if (identity === "foreign") {
    return {
      published: false,
      identity,
      one_time_prekeys: 0,
      note:
        "This identity already has keys published by the mosADD app. They were left untouched: replacing them from an API key would make every conversation with you unreadable in the app.",
    };
  }
  return { published: identity === "published", identity, one_time_prekeys: oneTimePrekeys.length };
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

  const keys = ctx.providers.keys;
  // One verified bundle per sender for the "r1." copies (usually just the contact).
  const bundleBySender = new Map<string, Promise<PublicPrekeyBundle | null>>();
  const senderBundle = (id: string) => {
    let p = bundleBySender.get(id);
    if (!p) {
      p = fetchVerifiedBundle(dm, id).catch(() => null);
      bundleBySender.set(id, p);
    }
    return p;
  };

  const messages = await Promise.all(
    result.messages.map(async (raw) => {
      const m = raw as DmMessageExt;
      const base = {
        id: m.id,
        sender_identity_id: m.senderId,
        timestamp: m.timestamp,
        thread_id: m.threadId,
      };
      // Legacy plaintext envelope (deprecated path) — unpack directly.
      if (!isE2eeEnvelope(m.payload)) {
        return { ...base, text: formatVoiceIfAny(unpackPayload(m.payload).text), encrypted: false };
      }
      // Our own outgoing ratchet messages aren't decryptable from our own ratchet on read.
      // 1) the "s1." self copy (any process holding the same key), 2) this process's sent cache,
      // 3) a note-to-self is sealed to our own bundle, so our own key opens it.
      if (m.senderId === selfId) {
        const own = (await openSelfSealed(keys, m.selfPayload)) ?? (await keys.getSentMessage?.(m.id));
        if (own) {
          return { ...base, text: formatVoiceIfAny(unpackPayload(own).text), encrypted: true };
        }
        if (input.contact_id === selfId) {
          try {
            const inner = await decryptFromPeer(keys, selfId, m.payload);
            return { ...base, text: formatVoiceIfAny(unpackPayload(inner).text), encrypted: true };
          } catch { /* fall through to the marker */ }
        }
        return { ...base, text: "<encrypted · sent by you>", encrypted: true };
      }
      // Recipient side: the sender's "r1." copy, or our own "s1." backfill in the same column
      // (the app writes it after a successful read) — neither needs a live ratchet session.
      if (m.recipientSelfPayload) {
        const bundle = await senderBundle(m.senderId);
        const copy =
          (bundle ? await openPeerRecoverable(keys, bundle, m.recipientSelfPayload) : null) ??
          (await openSelfSealed(keys, m.recipientSelfPayload));
        if (copy) {
          return { ...base, text: formatVoiceIfAny(unpackPayload(copy).text), encrypted: true };
        }
      }
      try {
        const inner = await decryptFromPeer(ctx.providers.keys, m.senderId, m.payload);
        return { ...base, text: formatVoiceIfAny(unpackPayload(inner).text), encrypted: true };
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
  // message-request-respond expects action:"respond" + status accepted/rejected
  // (not action:"accept"/"reject"). Map it.
  await invokeFunction<{ ok: boolean }>("message-request-respond", {
    action: "respond",
    request_id: input.request_id,
    status: input.action === "accept" ? "accepted" : "rejected",
  });
  return { ok: true };
}

const mDM_publish_keys_input = z.object({});

const mDM_edit_input = z.object({
  to: ContactRef.describe(
    "Recipient identity id of the conversation the message is in (needed to locate it and verify the edit won't break E2EE).",
  ),
  message_id: z.string().min(1).describe("Id of the message to edit (from mDM_list)."),
  new_text: z.string().min(1).max(64_000).describe("Replacement message body (UTF-8). Max 64 KB."),
  thread_label: ThreadSuffix.optional(),
});

const mDM_delete_input = z.object({
  message_id: z.string().min(1).describe("Id of the message to delete (from mDM_list)."),
});

async function mDM_edit(
  input: z.infer<typeof mDM_edit_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; edited: true }> {
  readSupabaseEnv();
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, input.to, input.thread_label);

  // Locate the target message before editing. mDM is E2EE by default and the
  // Double Ratchet is FORWARD-ONLY (strict in-order, no skipped keys) — an edit
  // cannot be re-sealed (the recipient's ratchet has already advanced past this
  // message, so a re-encrypt would decrypt as <undecryptable>), and writing a
  // fresh plaintext body would SILENTLY STRIP E2EE. So only legacy plaintext
  // messages are editable; E2EE messages must be deleted + re-sent.
  const recent = await dm.list({ threadId, limit: 100 });
  const target = recent.messages.find((m) => m.id === input.message_id);
  if (!target) {
    throw new Error(
      `mDM_edit could not find message ${input.message_id} in the recent history of this thread. ` +
        `Pass the 'to' (and 'thread_label') of the conversation the message belongs to.`,
    );
  }
  if (isE2eeEnvelope(target.payload)) {
    throw new Error(
      "mDM_edit cannot edit an end-to-end-encrypted message: the Double Ratchet is forward-only, so the edit " +
        "can't be re-sealed and storing a new body would strip E2EE. Delete it with mDM_delete and send a " +
        "replacement with mDM_send instead.",
    );
  }

  // Legacy plaintext message — a plaintext edit matches its (non-E2EE) storage.
  const envelope = {
    v: PROTOCOL_VERSION,
    type: "text",
    text: input.new_text,
    edited: true,
    sent_at: new Date().toISOString(),
  };
  const encrypted_payload = Buffer.from(JSON.stringify(envelope), "utf8").toString("base64");
  ctx.log("debug", "mDM_edit via message-edit (legacy plaintext only)", { message_id: input.message_id });
  await invokeFunction("message-edit", { message_id: input.message_id, encrypted_payload });
  return { message_id: input.message_id, edited: true };
}

async function mDM_delete(
  input: z.infer<typeof mDM_delete_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; deleted: true }> {
  readSupabaseEnv();
  ctx.log("debug", "mDM_delete via message-delete", { message_id: input.message_id });
  await invokeFunction("message-delete", { message_id: input.message_id });
  return { message_id: input.message_id, deleted: true };
}

// ---- Registration ----

export const mdmTools: MosaddTool[] = [
  {
    name: "mDM_list_contacts",
    title: "List contacts",
    annotations: { readOnlyHint: true },
    requires: "any",
    description:
      "List the user's mosadd contacts. Returns identity_id (use this for mDM_send / mDM_list), account handle, display name, and contact state (pending, accepted, blocked).",
    inputSchema: mDM_list_contacts_input,
    handler: mDM_list_contacts as MosaddTool["handler"],
  },
  {
    name: "mDM_publish_keys",
    title: "Publish encryption keys",
    annotations: { readOnlyHint: false },
    requires: "any",
    description:
      "Publish your mDM prekey bundle so other people can start an end-to-end-encrypted conversation with you. Run this once after sign-in (and to replenish one-time prekeys). Rides the same transport as messages, so it works over network or off-grid radio.",
    inputSchema: mDM_publish_keys_input,
    handler: mDM_publish_keys as MosaddTool["handler"],
  },
  {
    name: "mDM_send",
    title: "Send DM",
    annotations: { readOnlyHint: false },
    requires: "any",
    description:
      "Send a direct message via mosadd mDM. Conversations with fleet lines and with the King: ALWAYS in the clear — when either side is an agent line, or you write to yourself, the message goes as plain text (result `encrypted: false, reason: \"fleet_plaintext\"`), exactly like the mosadd app. Only between two PEOPLE is it END-TO-END-ENCRYPTED (X3DH + Double Ratchet; the recipient must have published keys). Pass `to` as the recipient's mosadd identity_id (look it up with mDM_list_contacts). Optional thread_label puts the message in a named thread — mosadd USP: multiple threads per contact, unlike WhatsApp/Telegram.",
    inputSchema: mDM_send_input,
    handler: mDM_send as MosaddTool["handler"],
  },
  {
    name: "mDM_send_unencrypted",
    title: "Send plain-text DM",
    annotations: { readOnlyHint: false },
    requires: "any",
    description:
      "Send a direct message as plain text, never encrypted. Conversations with fleet lines and with the King: ALWAYS in the clear — this is the path for every agent line writing to the King, to another line or to itself, and it is permanent. Pass `to` as the recipient's mosadd identity_id (look it up with mDM_list_contacts); optional thread_label puts it in a named thread. mDM_send picks the same plain-text path by itself whenever a fleet line is a party.",
    inputSchema: mDM_send_input,
    handler: mDM_send_unencrypted as MosaddTool["handler"],
  },
  {
    name: "mDM_list",
    title: "Read direct messages",
    annotations: { readOnlyHint: true },
    requires: "any",
    description:
      "List recent direct messages with a specific contact. Pass contact_id as the identity_id from mDM_list_contacts. Decrypts end-to-end-encrypted messages from the contact automatically; legacy plaintext messages are shown as-is. Optionally filter to a single thread_label.",
    inputSchema: mDM_list_input,
    handler: mDM_list as MosaddTool["handler"],
  },
  {
    name: "mDM_respond_request",
    title: "Accept or decline contact request",
    annotations: { readOnlyHint: false },
    requires: "any",
    description:
      "Accept or reject an incoming DM request from a contact who is not yet in the user's whitelist.",
    inputSchema: mDM_respond_request_input,
    handler: mDM_respond_request as MosaddTool["handler"],
  },
  {
    name: "mDM_edit",
    title: "Edit a DM",
    annotations: { destructiveHint: true },
    requires: "any",
    description:
      "Edit a direct message you sent — replace its body by message_id (pass the conversation's `to` so it can be located). NOTE: end-to-end-encrypted messages CANNOT be edited (the ratchet is forward-only) — mDM_edit refuses them and you should mDM_delete + mDM_send a replacement instead. Only legacy non-E2EE messages are editable.",
    inputSchema: mDM_edit_input,
    handler: mDM_edit as MosaddTool["handler"],
  },
  {
    name: "mDM_delete",
    title: "Delete a DM",
    annotations: { destructiveHint: true },
    requires: "any",
    description:
      "Delete a direct message you sent by message_id (from mDM_list). Soft-deletes server-side so it stops showing in mDM_list for both sides.",
    inputSchema: mDM_delete_input,
    handler: mDM_delete as MosaddTool["handler"],
  },
];
