---
name: mosadd-mdm
description: Send, list, and respond to direct messages on mosadd. Use when the user wants to message a mosadd contact, check their inbox, or accept/reject a contact request. Multi-thread per contact is the USP — each contact can have multiple named threads (unlike WhatsApp/Telegram).
---

# mosadd Direct Messages (mDM)

This skill operates the **mDM** OS module of [mosadd](https://mosadd.com) — direct text messaging between mosadd contacts.

## When to invoke

Trigger on these user intents:
- "Send <X> to <contact>" — use `mDM_send`
- "What did <contact> say?" / "Show my messages with <contact>" — use `mDM_list`
- "Who are my contacts?" — use `mDM_list_contacts`
- "Accept the request from <X>" — use `mDM_respond_request`

## How to operate

1. **Resolve the recipient.** `mDM_send.to` expects a mosadd `identity_id` (UUID), not a handle or email. If the user says "send to alice", first call `mDM_list_contacts` and find the matching display_name or account_id, then use that identity_id.

2. **Threads.** mosadd's USP is **multiple threads per contact**. If the user says "tell Alice in the work thread", pass `thread_label: "work"`. If they don't specify, omit thread_label — defaults to the contact's main thread.

3. **Encryption.** mDM 1:1 messages are **end-to-end encrypted by default** (X3DH + Double Ratchet, `mosadd.e2ee.v2` envelope). The mosadd server/operator **cannot read message content**. Prekeys auto-publish, so `mDM_send` encrypts transparently — you don't need to run `mDM_publish_keys` first in the normal path (it's there for re-keying). The same wire format is used by the mosadd app, so messages sent from the toolkit interoperate end-to-end with app users. Note: E2EE protects *content*, not metadata — the relay still sees who messaged whom (mosadd does NOT do "sealed sender"). The deprecated `mDM_send_unencrypted` sends server-readable plaintext; only use it if a peer explicitly cannot do E2EE.

## Configuration

The MCP server needs the user's Supabase credentials in env:

```
MOSADD_SUPABASE_URL=https://<their-project>.supabase.co
MOSADD_SUPABASE_ANON_KEY=<anon key>
MOSADD_USER_JWT=<their session token>
```

If any are missing, `mDM_send` fails fast with an actionable error. Direct the user to https://mosadd.com for BYOK setup walkthrough.

## Example

> **User:** "Tell Alice I'll be late, in the work thread."
>
> **You:**
> 1. `mDM_list_contacts({})` → finds `{ identity_id: "uuid-1", display_name: "Alice", state: "accepted" }`
> 2. `mDM_send({ to: "uuid-1", text: "I'll be late.", thread_label: "work" })` → `{ message_id, delivered_at, thread_id: "dm:<me>:<alice>:work" }`
> 3. Confirm to the user: "Sent to Alice in the `work` thread."

## Don't

- Don't ask the user for the recipient's UUID if `mDM_list_contacts` can resolve it.
- Don't fabricate thread_labels — only use what the user explicitly said.
- Don't claim "sealed sender" — mDM hides message *content* end-to-end, but the relay still sees sender and recipient identity.
- Don't tell the user mDM is plaintext — `mDM_send` is end-to-end encrypted by default.
