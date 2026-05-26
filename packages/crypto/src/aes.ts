import { gcm } from "@noble/ciphers/aes.js";
import { fromBase64, randomBytes, textDecoder, textEncoder, toBase64 } from "./utils";

const IV_LENGTH = 12;

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

// Since we use @noble/ciphers, keys are just raw Uint8Array bytes
export async function generateAesKey(): Promise<Uint8Array> {
  return randomBytes(32);
}

export async function importAesKey(rawKey: Uint8Array): Promise<Uint8Array> {
  return rawKey;
}

export async function exportAesKey(key: Uint8Array): Promise<Uint8Array> {
  return key;
}

export async function encryptBytes(key: Uint8Array, plaintext: Uint8Array): Promise<EncryptedPayload> {
  const iv = randomBytes(IV_LENGTH);
  const encrypted = gcm(key, iv).encrypt(plaintext);
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(encrypted)
  };
}

export async function decryptBytes(key: Uint8Array, payload: EncryptedPayload): Promise<Uint8Array> {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);
  return gcm(key, iv).decrypt(ciphertext);
}

export async function encryptText(key: Uint8Array, plaintext: string): Promise<EncryptedPayload> {
  return encryptBytes(key, textEncoder.encode(plaintext));
}

export async function decryptText(key: Uint8Array, payload: EncryptedPayload): Promise<string> {
  const bytes = await decryptBytes(key, payload);
  return textDecoder.decode(bytes as Uint8Array<ArrayBuffer>);
}
