# mosadd — encryption posture (what is and isn't end-to-end encrypted)

> Status: **alpha, honest snapshot (2026-06).** This document states the *actual*
> encryption behaviour of each surface as shipped — not the target. Where a surface
> is not yet end-to-end encrypted, we say so plainly. Marketing copy on mosadd.com /
> mosadd.dev must not claim stronger guarantees than this page.

There are two surfaces over one backend (Supabase + Edge Functions):

- **mosadd.com app** — the consumer app.
- **mosadd.dev toolkit** (`@mosadd/mcp`, this repo) — the developer/agent surface.

They share the same message store but currently use **different cryptography**, so
they do **not** interoperate end-to-end yet. This is the single most important caveat
on this page.

## Per-surface, per-channel posture

| Surface / channel | Encryption as shipped | Server can read? | Notes |
|---|---|---|---|
| **App mDM** (1:1 DM) | E2EE — X3DH + Double Ratchet (`@mosadd/crypto`) | No (when keys present) | Sealed-sender metadata. |
| **App channels (mIRC) / rooms (mROOM)** | Group-key encryption *when the vault is unlocked* (`useChannelCrypto`, `channel_keys`) | No when `e2eeReady`; **yes on plaintext fallback** | Falls back to base64 plaintext if the group key isn't ready — see "Conditional E2EE" below. |
| **App RAG / search index** | **Plaintext, server-side** | **Yes** | Required for vector search. Opt-in, off by default — see "RAG". |
| **Dev `mDM_send`** | E2EE — X3DH + Double Ratchet (`mosadd_prekey_bundles`) | No (when peer published prekeys) | Only works if the recipient ran `mDM_publish_keys`. |
| **Dev `mDM_send_unencrypted`** | **Plaintext** (deprecated) | **Yes** | Migration fallback; will be removed. |
| **Dev `mIRC_post_message`** | **Plaintext base64** (alpha) | **Yes** | Not the app's group-key format → app clients can't read it. |
| **Dev `mROOM_send_message`** | **Plaintext base64** (alpha) | **Yes** | `v0.2` target: Double Ratchet / group key. |
| **Dev `mKB_search`** | Reads the plaintext RAG index | **Yes** | Inherits the RAG caveat. |

## The three honest caveats

### 1. Conditional E2EE in the app (plaintext fallback)
App channel/room sends encrypt with a per-channel **group key** only when
`e2eeReady` is true (vault unlocked, group key derived). If it isn't, the client
currently falls back to base64 **plaintext**. A message that *looks* sent is not
necessarily encrypted. Target: never send on the plaintext path — block or queue
until the key is ready, and surface key state in the UI.

### 2. Dev toolkit messages are mostly plaintext
`mIRC_post_message`, `mROOM_send_message`, and `mDM_send_unencrypted` send
server-readable plaintext. Only `mDM_send` is end-to-end encrypted, and only when
the peer has published prekeys. **mosadd.dev must not market channel/room messaging
as "E2EE" until the toolkit adopts the app's group-key scheme.** Tool descriptions
now state the plaintext status inline.

### 3. RAG / search is fundamentally not zero-knowledge
Vector search needs content indexed in plaintext on the server. Anything searchable
via app RAG or `mKB_search` is, by construction, readable by the server. We therefore
make indexing **opt-in and off by default**, and we do **not** describe RAG-indexed
data as covered by the zero-knowledge guarantee. "Zero-knowledge" applies to the
encrypted message paths above — not to the search index.

## No cross-surface interop (today)
- App channels use a **group key** derived from the vault master key (`channel_keys`,
  `identities.signed_prekey_pub` + `one_time_prekeys`).
- Dev mDM uses **X3DH + Double Ratchet** with `mosadd_prekey_bundles` and the
  `mosadd.e2ee.v1` envelope.

These are different schemes with different key tables, so an app user and an MCP/dev
user cannot decrypt each other's messages. Unifying on one scheme is tracked as a
design RFC (see `docs/security/`), and is required before we can claim app↔agent
end-to-end messaging.

## What copy is allowed to say (until the above is fixed)
- ✅ "App 1:1 DMs are end-to-end encrypted (X3DH + Double Ratchet)."
- ✅ "Channels and rooms are encrypted with a per-channel group key on supported clients."
- ✅ "No phone number or email required; sealed-sender metadata."
- ⚠️ Only with the caveat: "Search/RAG indexes content server-side and is opt-in."
- ❌ Blanket "everything is zero-knowledge / we can never read anything."
- ❌ "The developer toolkit is end-to-end encrypted" (only `mDM_send` is, today).
