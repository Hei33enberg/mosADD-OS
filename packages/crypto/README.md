# @mosadd/crypto

End-to-end cryptography primitives for mosadd.

> **A module of [mosadd](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

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

```ts
import {
  generateIdentityKeys,
  generatePrekeyBundle,
  x3dh,
  DoubleRatchet,
} from "@mosadd/crypto";

// Bootstrap an identity
const alice = await generateIdentityKeys();
const bob = await generateIdentityKeys();

// Bob publishes a prekey bundle
const bobBundle = await generatePrekeyBundle(bob);

// Alice initiates an X3DH session with Bob
const aliceSession = await x3dh.initiator(alice, bobBundle);

// Bob completes the X3DH session
const bobSession = await x3dh.recipient(bob, aliceSession.publicData);

// Both now have a shared secret. Use it to bootstrap a Double Ratchet.
const aliceRatchet = await DoubleRatchet.initiator(aliceSession.sharedSecret, bobBundle.signedPrekey);
const bobRatchet = await DoubleRatchet.recipient(bobSession.sharedSecret);

// Send a message
const ciphertext = await aliceRatchet.encrypt("hello bob");
const plaintext = await bobRatchet.decrypt(ciphertext);
```

See [docs/](../../docs/architecture/) for detailed protocol descriptions.

## Security

This implementation has **not been independently audited**. We follow Signal's published specs and use audited primitives from `@noble/*`, but the integration code itself is community-developed. Use at your own risk for high-stakes use cases until a formal audit lands.

Report vulnerabilities privately to `security@mosadd.com`. See [SECURITY.md](../../SECURITY.md).

## License

[Apache-2.0](./LICENSE). Patent grant included.

Originally licensed MIT under the mosadd backend. Relicensed Apache-2.0 in v3.0.0 for the public OSS release with consent of the original authors.
