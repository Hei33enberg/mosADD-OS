import { x25519 } from "@noble/curves/ed25519.js";
import { fromBase64, randomBytes, toBase64 } from "./utils";

export interface X25519KeyPairExport {
  publicKey: string;
  privateKey: string;
}

export async function generateX25519KeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  const privateKey = randomBytes(32);
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export async function exportX25519KeyPair(keyPair: { privateKey: Uint8Array; publicKey: Uint8Array }): Promise<X25519KeyPairExport> {
  return {
    publicKey: toBase64(keyPair.publicKey),
    privateKey: toBase64(keyPair.privateKey)
  };
}

export async function importX25519PublicKey(rawBase64: string): Promise<Uint8Array> {
  return fromBase64(rawBase64);
}

export async function importX25519PrivateKey(pkcs8Base64: string): Promise<Uint8Array> {
  return fromBase64(pkcs8Base64);
}

export async function deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
  return x25519.getSharedSecret(privateKey, publicKey);
}
