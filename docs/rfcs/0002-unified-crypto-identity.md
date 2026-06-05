# RFC 0002 — Unified cryptography & prekey directory (app ⇄ toolkit interop)

- **Status:** Draft
- **Author:** @Hei33enberg
- **Created:** 2026-06-03
- **Last updated:** 2026-06-03
- **Linear ticket:** LINEAR-XXXX (crypto-unify epic)
- **Supersedes:** (none)
- **Superseded by:** (none)

## Summary

mosadd ships **two incompatible end-to-end encryption systems** over one backend, so
a user on the **mosadd.com app** and an agent on the **mosadd.dev toolkit** (`@mosadd/mcp`)
cannot decrypt each other's messages. This RFC proposes converging on **one prekey
directory** and **one pair of session schemes** — X3DH + Double Ratchet for 1:1 (mDM)
and a per-channel **group key** for channels/rooms — published and consumed identically
by both surfaces. See `docs/security/e2ee-posture.md` for the current (honest) state.

## Motivation

Today (confirmed by audit, 2026-06):

| Surface | Session scheme | Prekey / key material |
|---|---|---|
| **App channels / rooms** | Group key (`@mosadd/crypto`, `useChannelCrypto`) | `channel_keys`; X25519 derived from the vault master key; identity prekeys in `identities.signed_prekey_pub` + `one_time_prekeys` |
| **Toolkit mDM** (`mDM_send`) | X3DH + Double Ratchet | `mosadd_prekey_bundles` (opaque bundle); `mosadd.e2ee.v1` envelope |

Consequences:
1. **No cross-surface mDM.** The app publishes prekeys to `identities.signed_prekey_pub`
   + `one_time_prekeys`; the toolkit reads/writes `mosadd_prekey_bundles`. Different
   tables, different formats → `mDM_send` to an app user fails or silently falls back
   to `mDM_send_unencrypted` (plaintext).
2. **No cross-surface channels.** App channel messages are group-key ciphertext; the
   toolkit's `mIRC_post_message` / `mROOM_send_message` post base64 **plaintext**.
   Neither side can read the other.
3. **Two code paths to audit, two ways to get E2EE wrong.**

Expected outcome: an app user and an MCP/agent identity can DM each other end-to-end,
and can read the same channel, with a single key directory and envelope format.

## Detailed design

### 1. One prekey directory (`mosadd_prekey_bundles` as the single source of truth)

Deprecate the split `identities.signed_prekey_pub` + `one_time_prekeys` columns in
favour of the toolkit's `mosadd_prekey_bundles` table as the canonical X3DH directory.
Both surfaces publish and fetch from it.

```ts
// @mosadd/crypto — shared, used by app AND toolkit
interface PrekeyBundle {
  identity_id: string;
  identity_key_pub: string;     // Ed25519 / X25519 identity key (base64)
  signed_prekey_pub: string;    // base64
  signed_prekey_sig: string;    // signature over signed_prekey_pub by identity key
  one_time_prekey_pub?: string; // consumed on use; null when exhausted
  registration_id: number;
  created_at: string;
}

publishPrekeys(identityId): Promise<void>   // app: replaces useChannelCrypto prekey publish
fetchPrekeyBundle(identityId): Promise<PrekeyBundle>  // toolkit mDM_publish_keys reads this
```

Migration (file-only; owner applies): backfill `mosadd_prekey_bundles` from existing
`identities.signed_prekey_pub` + `one_time_prekeys` for current users, then have the
app write to `mosadd_prekey_bundles` going forward. Keep the old columns read-only for
one release as a fallback, then drop.

### 2. One 1:1 session scheme — X3DH + Double Ratchet everywhere

The toolkit's implementation in `@mosadd/crypto` (already covered by
`packages/mcp/src/__tests__/mdm-e2ee.test.ts`, golden-path both directions) becomes the
single mDM session implementation. The app's `useChannelCrypto` DM path is reworked to
call the same `@mosadd/crypto` X3DH/ratchet primitives instead of the group-key path for
1:1 conversations. Envelope = `mosadd.e2ee.v1` on both sides.

### 3. One group scheme — per-channel group key, shared format

Keep the app's per-channel group key (`channel_keys`) as the channel/room scheme, but
expose it through `@mosadd/crypto` so the toolkit's `mIRC_post_message` /
`mROOM_send_message` encrypt with the **same** group key and envelope instead of posting
plaintext base64. Group-key distribution itself rides the unified prekey directory
(sender-keys style: the group key is delivered to each member encrypted to their X3DH
session). Target envelope: `mosadd.group.v1`.

### 4. Rollout / compatibility

- Phase 1: ship the unified prekey directory + backfill; both surfaces publish there.
- Phase 2: app DM path → X3DH/ratchet; verify app↔toolkit mDM in a 2-account harness.
- Phase 3: toolkit channel/room tools encrypt with the group key; drop the plaintext
  `packPlaintextPayload` path; update `mIRC_post_message` / `mROOM_send_message` tool
  descriptions (remove the "plaintext/alpha" caveat once true).
- Phase 4: drop the legacy `identities.signed_prekey_pub` / `one_time_prekeys` columns
  and `mDM_send_unencrypted`.

## Drawbacks

- Touches live E2EE on the consumer app — highest-risk change in the codebase. Requires
  a careful migration so existing users don't lose access to historical messages
  (historical ciphertext stays decryptable under whichever scheme wrote it; only new
  messages use the unified path).
- Group-key-over-X3DH distribution adds complexity vs. the current vault-derived key.

## Rationale and alternatives

- **Adopt the toolkit's X3DH/ratchet as the standard** (chosen): it's the modern,
  Signal-equivalent design, already implemented + tested in `@mosadd/crypto`, and the
  thing we already market ("same primitives as Signal"). Standardizing the app onto it
  reduces it to one audited implementation.
- *Alternative: make the toolkit adopt the app's group-key scheme for DMs.* Rejected —
  vault-master-derived keys don't give forward secrecy / post-compromise security the way
  the ratchet does, and the toolkit has no vault.
- *Alternative: leave them separate, just document no interop.* Rejected — app↔agent
  messaging is a core promise of having both surfaces; permanent non-interop is a product
  hole, not just a docs footnote.

## Prior art

Signal (X3DH + Double Ratchet + sealed sender), MLS (RFC 9420) for group messaging.
We stay close to Signal for 1:1 and a sender-keys group model for channels rather than
full MLS to limit scope.

## Unresolved questions

- Confirm the app's current **1:1 DM** crypto path exactly (group key vs. an existing
  X3DH path) — the audit confirmed channels use the group key; DM specifics need a read
  of the app DM send path before Phase 2.
- Historical-message strategy: re-encrypt on migration vs. dual-read by envelope version
  (lean dual-read).
- Group-key rotation on membership change (add/remove) — define the rekey trigger.

## Future possibilities

A single `@mosadd/crypto` audited by a third party (the audit we currently say we have
NOT done), one envelope spec published on mosadd.dev, and true app↔agent E2EE messaging
as a headline differentiator vs. closed toolkits.
