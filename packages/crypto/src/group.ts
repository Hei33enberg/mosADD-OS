import { deriveHkdfKey } from "./hkdf";
import { generateX25519KeyPair, deriveSharedSecret, importX25519PublicKey, exportX25519KeyPair } from "./x25519";
import { encryptBytes, decryptBytes, type EncryptedPayload } from "./aes";
import { randomBytes, textEncoder, fromBase64, toBase64 } from "./utils";

export interface WrappedGroupKey {
  ephemeralPub: string;
  iv: string;
  ciphertext: string;
}

/**
 * Generates a strong 32-byte AES-GCM symmetric key for a group channel.
 */
export function generateGroupKey(): Uint8Array {
  return randomBytes(32);
}

/**
 * Wraps (encrypts) the symmetric group key for a specific member using their X25519 public key.
 * 
 * 1. Generates ephemeral X25519 key pair.
 * 2. Derives shared secret with member's public key.
 * 3. Derives 32-byte wrapping AES key via HKDF.
 * 4. Encrypts the group key.
 * 5. Returns the ephemeral public key and ciphertext payload.
 */
export async function wrapGroupKey(
  groupKey: Uint8Array,
  memberPublicKeyBase64: string
): Promise<WrappedGroupKey> {
  const ephemeral = await generateX25519KeyPair();
  const exportedEphemeral = await exportX25519KeyPair(ephemeral);
  const memberPub = await importX25519PublicKey(memberPublicKeyBase64);

  const sharedSecret = await deriveSharedSecret(ephemeral.privateKey, memberPub);
  const wrappingKey = await deriveHkdfKey(sharedSecret, {
    info: textEncoder.encode("m0ssad-group-wrap"),
    length: 32
  });

  const encrypted = await encryptBytes(wrappingKey, groupKey);

  return {
    ephemeralPub: exportedEphemeral.publicKey,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext
  };
}

/**
 * Unwraps (decrypts) the group symmetric key using the member's private key.
 * 
 * 1. Derives shared secret from their private key and the wrapper's ephemeral public key.
 * 2. Derives the 32-byte wrapping AES key via HKDF.
 * 3. Decrypts the payload to reveal the group key.
 */
export async function unwrapGroupKey(
  wrapped: WrappedGroupKey,
  memberPrivateKey: Uint8Array
): Promise<Uint8Array> {
  const ephemeralPub = await importX25519PublicKey(wrapped.ephemeralPub);
  
  const sharedSecret = await deriveSharedSecret(memberPrivateKey, ephemeralPub);
  const wrappingKey = await deriveHkdfKey(sharedSecret, {
    info: textEncoder.encode("m0ssad-group-wrap"),
    length: 32
  });

  return decryptBytes(wrappingKey, {
    iv: wrapped.iv,
    ciphertext: wrapped.ciphertext
  });
}
