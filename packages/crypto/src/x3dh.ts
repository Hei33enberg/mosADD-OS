import { deriveHkdfKey } from "./hkdf";
import { deriveSharedSecret } from "./x25519";

export interface X3dhBundle {
  identityPublicKey: Uint8Array;
  signedPreKeyPublicKey: Uint8Array;
  oneTimePreKeyPublicKey?: Uint8Array;
}

export interface X3dhResult {
  rootKey: Uint8Array;
  sharedSecrets: Uint8Array[];
}

/**
 * Initiator's public keys, sent alongside the first message so the responder
 * can reproduce the same shared secrets. `usedOneTimePreKeyId` tells the
 * responder which of its published one-time prekeys was consumed (so it can
 * look up the matching private key); omitted when no OPK was used.
 */
export interface X3dhInitiatorHeader {
  initiatorIdentityPublicKey: Uint8Array;
  initiatorEphemeralPublicKey: Uint8Array;
  usedOneTimePreKeyId?: number;
}

/** Responder's private keys needed to reproduce the X3DH shared secrets. */
export interface X3dhResponderKeys {
  identityPrivateKey: Uint8Array;
  signedPreKeyPrivateKey: Uint8Array;
  /** Required iff the initiator consumed a one-time prekey (header carries its id). */
  oneTimePreKeyPrivateKey?: Uint8Array;
}

const X3DH_ROOT_INFO = "m0ssad-x3dh-root";

function joinSecrets(secrets: Uint8Array[]): Uint8Array {
  const joined = new Uint8Array(secrets.reduce((sum, s) => sum + s.length, 0));
  let offset = 0;
  for (const secret of secrets) {
    joined.set(secret, offset);
    offset += secret.length;
  }
  return joined;
}

/**
 * Minimal X3DH composition (INITIATOR side):
 * DH1 = IK_A x SPK_B
 * DH2 = EK_A x IK_B
 * DH3 = EK_A x SPK_B
 * DH4 = EK_A x OPK_B (optional)
 */
export async function performX3dh(
  initiatorIdentityPrivateKey: Uint8Array,
  initiatorEphemeralPrivateKey: Uint8Array,
  recipientBundle: X3dhBundle
): Promise<X3dhResult> {
  const dh1 = await deriveSharedSecret(initiatorIdentityPrivateKey, recipientBundle.signedPreKeyPublicKey);
  const dh2 = await deriveSharedSecret(initiatorEphemeralPrivateKey, recipientBundle.identityPublicKey);
  const dh3 = await deriveSharedSecret(initiatorEphemeralPrivateKey, recipientBundle.signedPreKeyPublicKey);
  const sharedSecrets = [dh1, dh2, dh3];

  if (recipientBundle.oneTimePreKeyPublicKey) {
    const dh4 = await deriveSharedSecret(initiatorEphemeralPrivateKey, recipientBundle.oneTimePreKeyPublicKey);
    sharedSecrets.push(dh4);
  }

  const rootKey = await deriveHkdfKey(joinSecrets(sharedSecrets), {
    info: new TextEncoder().encode(X3DH_ROOT_INFO),
    length: 32,
  });
  return { rootKey, sharedSecrets };
}

/**
 * RESPONDER side of the same X3DH. X25519 is symmetric — `DH(a_priv, b_pub) ===
 * DH(b_priv, a_pub)` — so the responder reproduces the initiator's four DH
 * outputs IN THE SAME CONCATENATION ORDER using its own private keys against
 * the initiator's public IK + EK (carried in the message header):
 *
 *   DH1 = SPK_B x IK_A   (== initiator's IK_A x SPK_B)
 *   DH2 = IK_B  x EK_A   (== initiator's EK_A x IK_B)
 *   DH3 = SPK_B x EK_A   (== initiator's EK_A x SPK_B)
 *   DH4 = OPK_B x EK_A   (== initiator's EK_A x OPK_B, optional)
 *
 * Producing the identical rootKey both parties feed into `initializeRatchet`.
 */
export async function performX3dhResponder(
  responderKeys: X3dhResponderKeys,
  initiatorHeader: X3dhInitiatorHeader
): Promise<X3dhResult> {
  const dh1 = await deriveSharedSecret(responderKeys.signedPreKeyPrivateKey, initiatorHeader.initiatorIdentityPublicKey);
  const dh2 = await deriveSharedSecret(responderKeys.identityPrivateKey, initiatorHeader.initiatorEphemeralPublicKey);
  const dh3 = await deriveSharedSecret(responderKeys.signedPreKeyPrivateKey, initiatorHeader.initiatorEphemeralPublicKey);
  const sharedSecrets = [dh1, dh2, dh3];

  if (initiatorHeader.usedOneTimePreKeyId !== undefined) {
    if (!responderKeys.oneTimePreKeyPrivateKey) {
      throw new Error(
        `X3DH responder: header references one-time prekey ${initiatorHeader.usedOneTimePreKeyId} but no oneTimePreKeyPrivateKey was supplied`,
      );
    }
    const dh4 = await deriveSharedSecret(
      responderKeys.oneTimePreKeyPrivateKey,
      initiatorHeader.initiatorEphemeralPublicKey,
    );
    sharedSecrets.push(dh4);
  }

  const rootKey = await deriveHkdfKey(joinSecrets(sharedSecrets), {
    info: new TextEncoder().encode(X3DH_ROOT_INFO),
    length: 32,
  });
  return { rootKey, sharedSecrets };
}
