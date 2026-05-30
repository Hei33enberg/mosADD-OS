import { ed25519 } from "@noble/curves/ed25519.js";
import { fromBase64, toBase64, toHex } from "./utils";

export interface Ed25519KeyPairExport {
  publicKey: string;
  privateKey: string;
}

export interface Ed25519KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface Identity {
  accountId: string;
  keyPair: Ed25519KeyPair;
}

export async function generateEd25519KeyPair(seed?: Uint8Array): Promise<Ed25519KeyPair> {
  const privateBytes = seed ? (seed.length > 32 ? seed.slice(0, 32) : seed) : ed25519.utils.randomSecretKey();
  const publicBytes = ed25519.getPublicKey(privateBytes);
  return { publicKey: publicBytes, privateKey: privateBytes };
}

export async function exportEd25519KeyPair(keyPair: Ed25519KeyPair): Promise<Ed25519KeyPairExport> {
  return {
    publicKey: toBase64(keyPair.publicKey),
    privateKey: toBase64(keyPair.privateKey)
  };
}

export async function importEd25519KeyPair(payload: Ed25519KeyPairExport): Promise<Ed25519KeyPair> {
  return {
    publicKey: fromBase64(payload.publicKey),
    privateKey: fromBase64(payload.privateKey)
  };
}

export async function getAccountId(publicKey: Uint8Array): Promise<string> {
  return `m0:${toHex(publicKey).slice(0, 16)}`;
}

/** Sign a message with an Ed25519 identity private key. Returns raw signature bytes. */
export function signEd25519(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

/**
 * Verify an Ed25519 signature. Returns false (never throws) on any malformed
 * input, so callers can treat a bad signature as a clean rejection.
 */
export function verifyEd25519(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

export async function generateIdentity(seed?: Uint8Array): Promise<Identity> {
  const keyPair = await generateEd25519KeyPair(seed);
  const accountId = await getAccountId(keyPair.publicKey);
  return { accountId, keyPair };
}
