/**
 * Utility: derive a deterministic X25519 key pair from a vault master key.
 * This avoids requiring a separate X25519 key storage—the same master key
 * always yields the same X25519 pair.
 */
import { deriveHkdfKey } from "./hkdf";
import { generateX25519KeyPair, exportX25519KeyPair, importX25519PrivateKey } from "./x25519";
import { x25519 } from "@noble/curves/ed25519.js";
import { textEncoder, toBase64 } from "./utils";

export interface DerivedX25519Keys {
  publicKeyBase64: string;
  privateKeyBase64: string;
}

/**
 * Derives a deterministic X25519 key pair from the vault's master key.
 * Used for group key wrapping/unwrapping in E2EE channels.
 */
export async function deriveX25519FromMasterKey(masterKey: Uint8Array): Promise<DerivedX25519Keys> {
  const seed = await deriveHkdfKey(masterKey, {
    info: textEncoder.encode("m0ssad-x25519-channel-keys"),
    length: 32,
  });
  // Use the seed directly as X25519 private key
  const publicKey = x25519.getPublicKey(seed);
  return {
    publicKeyBase64: toBase64(publicKey),
    privateKeyBase64: toBase64(seed),
  };
}
