# mosadd — encryption posture (what is and isn't end-to-end encrypted)

> Status: **alpha, honest snapshot (2026-06).** This document states the *actual*
> encryption behaviour of each surface as shipped — not the target. Where a surface
> is not yet end-to-end encrypted, we say so plainly. Marketing copy on mosadd.com /
> this toolkit must not claim stronger guarantees than this page.

There are two surfaces over one backend (Supabase + Edge Functions):

- **mosadd.com app** — the consumer app.
- **mosADD toolkit** (`@mosadd/mcp`, this repo) — the developer/agent surface.

They share the same message store **and the same mDM cryptography**: both use X3DH +
Double Ratchet over the `mosadd.e2ee.v2` envelope, so an app user and an MCP/dev user
**do interoperate** end-to-end on 1:1 DMs. An mDM sent from the toolkit can be read by
the app peer, and vice versa.

## Honest posture in one line

- **mDM (1:1 DM)** — **end-to-end encrypted by DEFAULT** (X3DH + Double Ratchet, `mosadd.e2ee.v2`). The server/operator **cannot read message content**.
- **mIRC (group) + mURL (open rooms) + mAYL (mail)** — **transport-encrypted in flight and at rest, but server-readable by design** (not E2EE). We label this honestly; do not market any of them as end-to-end encrypted.

## Per-surface, per-channel posture

| Surface / channel | Encryption as shipped | Server can read? | Notes |
|---|---|---|---|
| **App mDM** (1:1 DM) | E2EE by default — X3DH + Double Ratchet (`@mosadd/crypto`, `mosadd.e2ee.v2`) | No | Operator cannot read content. No phone/email required. Sender identity is NOT hidden from the relay. |
| **App channels (mIRC)** | Group-key encryption *when the vault is unlocked* (`useChannelCrypto`, `channel_keys`) | No when `e2eeReady`; **yes on plaintext fallback** | Falls back to base64 plaintext if the group key isn't ready — see "Conditional E2EE" below. |
| **App RAG / search index** | **Plaintext, server-side** | **Yes** | Required for vector search. Opt-in, off by default — see "RAG". |
| **Dev `mDM_send`** | E2EE by default — X3DH + Double Ratchet (`mosadd_prekey_bundles`, `mosadd.e2ee.v2`) | No | Same wire format as the app → interoperates app↔agent. Prekeys auto-publish; falls back only if a peer has no prekeys. |
| **Dev `mDM_send_unencrypted`** | **Plaintext** (deprecated) | **Yes** | Migration fallback; will be removed. |
| **Dev `mIRC_post_message`** | **Plaintext base64** (alpha) | **Yes** | Not the app's group-key format → app clients can't read it. |
| **Dev `mRAG_search`** | Reads the plaintext RAG index | **Yes** | Inherits the RAG caveat. |

## The three honest caveats

### 1. Conditional E2EE in the app (plaintext fallback)
App channel sends encrypt with a per-channel **group key** only when
`e2eeReady` is true (vault unlocked, group key derived). If it isn't, the client
currently falls back to base64 **plaintext**. A message that *looks* sent is not
necessarily encrypted. Target: never send on the plaintext path — block or queue
until the key is ready, and surface key state in the UI.

### 2. mIRC / mURL / mAYL are server-readable by design (not E2EE)
`mDM_send` **is end-to-end encrypted by default** (X3DH + Double Ratchet), and it uses
the *same* `mosadd.e2ee.v2` wire format as the app — so app↔agent 1:1 DMs interoperate.
What is **not** end-to-end encrypted: `mIRC_post_message` (group channels), `mURL` (open
rooms) and `mAYL` (mail) are transport-encrypted in flight and at rest but **server-readable
by design**. The legacy `mDM_send_unencrypted` is a deprecated plaintext fallback. **this
toolkit must not market mIRC channels, mURL rooms or mAYL mail as "E2EE".** Tool descriptions
state the posture inline.

### 3. RAG / search is fundamentally not zero-knowledge
Vector search needs content indexed in plaintext on the server. Anything searchable
via app RAG or `mRAG_search` is, by construction, readable by the server. We therefore
make indexing **opt-in and off by default**, and we do **not** describe RAG-indexed
data as covered by the zero-knowledge guarantee. "Zero-knowledge" applies to the
encrypted message paths above — not to the search index.

## Cross-surface interop for mDM (today)
- **mDM (1:1):** the app and the toolkit now share **one scheme** — X3DH + Double Ratchet
  with `mosadd_prekey_bundles` and the **`mosadd.e2ee.v2`** envelope. An app user and an
  MCP/dev user **can** decrypt each other's 1:1 DMs. This is live, not a target.
- **mIRC (group):** app channels use a per-channel **group key** derived from the vault
  master key (`channel_keys`); the dev `mIRC_post_message` path is server-readable. These
  are not E2EE and are not the focus of cross-surface E2EE claims.

## What copy is allowed to say
- ✅ "mDM 1:1 messages are end-to-end encrypted by default (X3DH + Double Ratchet) — the operator cannot read message content."
- ✅ "The app and the toolkit share the same mDM wire format (`mosadd.e2ee.v2`) and interoperate end-to-end on 1:1 DMs."
- ✅ "No phone number or email required for mDM."
- ✅ "mIRC channels are encrypted with a per-channel group key on supported clients."
- ⚠️ Only with the caveat: "Search/RAG indexes content server-side and is opt-in."
- ❌ Any "sealed sender" claim — mosadd does NOT hide who-messaged-whom; the relay sees sender/recipient identity.
- ❌ "mIRC channels / mURL rooms / mAYL mail are end-to-end encrypted" — they are transport + at-rest, server-readable by design.
- ❌ Blanket "everything is zero-knowledge / we can never read anything."
