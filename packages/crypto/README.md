# @mosadd/crypto

End-to-end cryptography primitives for mosADD.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

## What's inside

- **X3DH** — Extended Triple Diffie-Hellman key agreement
- **Double Ratchet** — Signal's forward-secret messaging ratchet
- **AES-256-GCM** — symmetric encryption
- **HKDF** — key derivation
- **X25519** — Curve25519 ECDH
- **BIP39 mnemonic** — recovery phrases (for power-user identity recovery, see [identity-recovery.md](../../docs/architecture/identity-recovery.md))
- **Secure vault** — encrypted local key storage
- **Prekey bundles** — async session bootstrap
- **Group keys** — Sender Keys for group chats

Built on [@noble/curves](https://github.com/paulmillr/noble-curves), [@noble/ciphers](https://github.com/paulmillr/noble-ciphers), [@noble/hashes](https://github.com/paulmillr/noble-hashes) — audited, zero-dependency primitives.

## Install

```bash
npm install @mosadd/crypto@alpha
# or
pnpm add @mosadd/crypto@alpha
```

## Usage

X3DH handshake → Double Ratchet (with the DH ratchet step — forward secrecy
and post-compromise security). This snippet runs as-is under Node 18+:

```ts
import {
  generateX25519KeyPair,
  performX3dh,
  performX3dhResponder,
  initRatchetInitiator,
  initRatchetResponder,
  ratchetEncrypt,
  ratchetDecrypt,
} from "@mosadd/crypto";

// ---- Key material -------------------------------------------------------
// Bob publishes an identity key and a signed prekey
// (createPreKeyBundle() produces the publishable base64 form).
const bobIdentity = await generateX25519KeyPair();
const bobSignedPreKey = await generateX25519KeyPair();

// Alice: her identity key + a fresh ephemeral key for this handshake.
const aliceIdentity = await generateX25519KeyPair();
const aliceEphemeral = await generateX25519KeyPair();

// ---- X3DH: both sides derive the same root key --------------------------
const aliceX3dh = await performX3dh(
  aliceIdentity.privateKey,
  aliceEphemeral.privateKey,
  {
    identityPublicKey: bobIdentity.publicKey,
    signedPreKeyPublicKey: bobSignedPreKey.publicKey,
  },
);
const bobX3dh = await performX3dhResponder(
  {
    identityPrivateKey: bobIdentity.privateKey,
    signedPreKeyPrivateKey: bobSignedPreKey.privateKey,
  },
  {
    initiatorIdentityPublicKey: aliceIdentity.publicKey,
    initiatorEphemeralPublicKey: aliceEphemeral.publicKey,
  },
);

// ---- Double Ratchet (DH ratchet — forward secrecy + post-compromise security)
const alice = await initRatchetInitiator(aliceX3dh.rootKey, bobSignedPreKey.publicKey);
const bob = await initRatchetResponder(bobX3dh.rootKey, bobSignedPreKey);

const { header, ct } = await ratchetEncrypt(alice, new TextEncoder().encode("hello bob"));
const plaintext = await ratchetDecrypt(bob, header, ct);
console.log(new TextDecoder().decode(plaintext)); // "hello bob"
```

Notes for production use:

- In a real deployment the recipient's `signedPreKey` public key MUST come
  from a bundle whose Ed25519 signature you verified first — see
  `createPreKeyBundle()` / `createSignedPreKey()` for the publishable form,
  and `generateIdentity()` / `signEd25519()` / `verifyEd25519()` for signing.
- `SecureSession` (symmetric-only ratchet) is the simpler alternative when
  both sides already share a root key; `initRatchetInitiator`/`ratchetEncrypt`
  is the mDM v2 path with the DH ratchet step.
- The full flows, including out-of-order delivery and the skipped-key cache,
  are exercised in [`src/__tests__/`](./src/__tests__/).

See [docs/](../../docs/architecture/) for detailed protocol descriptions.

## Security

This implementation has **not been independently audited**. We follow Signal's published specs and use audited primitives from `@noble/*`, but the integration code itself is community-developed. Use at your own risk for high-stakes use cases until a formal audit lands.

Report vulnerabilities privately to `security@mosadd.com`. See [SECURITY.md](../../SECURITY.md).

## License

[Apache-2.0](../../LICENSE). Patent grant included.

Originally licensed MIT under the mosADD backend (the original MIT text is preserved in [`LICENSE.original-MIT`](./LICENSE.original-MIT)). Relicensed Apache-2.0 in v3.0.0 for the public OSS release with consent of the original authors.
