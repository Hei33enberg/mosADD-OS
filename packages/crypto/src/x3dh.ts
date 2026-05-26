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
 * Minimal X3DH composition:
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

  const joined = new Uint8Array(sharedSecrets.reduce((sum, secret) => sum + secret.length, 0));
  let offset = 0;
  for (const secret of sharedSecrets) {
    joined.set(secret, offset);
    offset += secret.length;
  }

  const rootKey = await deriveHkdfKey(joined, { info: new TextEncoder().encode("m0ssad-x3dh-root"), length: 32 });
  return { rootKey, sharedSecrets };
}
