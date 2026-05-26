import { ed25519 } from "@noble/curves/ed25519.js";
import { exportX25519KeyPair, generateX25519KeyPair } from "./x25519";
import { toBase64, fromBase64 } from "./utils";

export interface SignedPreKey {
  id: number;
  publicKey: string;
  privateKey: string;
  signature: string;
}

export interface OneTimePreKey {
  id: number;
  publicKey: string;
  privateKey: string;
}

export interface PreKeyBundle {
  identityPublicKey: string;
  signedPreKey: {
    id: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKeys: Array<{ id: number; publicKey: string }>;
  generatedAt: string;
}

function signWithEd25519(privateKey: Uint8Array, payload: Uint8Array): string {
  const sig = ed25519.sign(payload, privateKey);
  return toBase64(sig);
}

export async function createSignedPreKey(identityPrivateKey: Uint8Array): Promise<SignedPreKey> {
  const keyPair = await generateX25519KeyPair();
  const exported = await exportX25519KeyPair(keyPair);
  const signature = signWithEd25519(identityPrivateKey, fromBase64(exported.publicKey));

  return {
    id: Math.floor(Math.random() * 1_000_000),
    publicKey: exported.publicKey,
    privateKey: exported.privateKey,
    signature
  };
}

export async function createOneTimePreKeys(count: number): Promise<OneTimePreKey[]> {
  const out: OneTimePreKey[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    const pair = await generateX25519KeyPair();
    const exported = await exportX25519KeyPair(pair);
    let id = crypto.getRandomValues(new Uint32Array(1))[0];
    while (used.has(id)) {
      id = crypto.getRandomValues(new Uint32Array(1))[0];
    }
    used.add(id);
    out.push({ id, publicKey: exported.publicKey, privateKey: exported.privateKey });
  }
  return out;
}

export async function createPreKeyBundle(
  identityPublicKey: Uint8Array,
  identityPrivateKey: Uint8Array,
  oneTimePreKeyCount = 25
): Promise<{ bundle: PreKeyBundle; signedPreKey: SignedPreKey; oneTimePreKeys: OneTimePreKey[] }> {
  const signedPreKey = await createSignedPreKey(identityPrivateKey);
  const oneTimePreKeys = await createOneTimePreKeys(oneTimePreKeyCount);

  return {
    bundle: {
      identityPublicKey: toBase64(identityPublicKey),
      signedPreKey: {
        id: signedPreKey.id,
        publicKey: signedPreKey.publicKey,
        signature: signedPreKey.signature
      },
      oneTimePreKeys: oneTimePreKeys.map((k) => ({ id: k.id, publicKey: k.publicKey })),
      generatedAt: new Date().toISOString()
    },
    signedPreKey,
    oneTimePreKeys
  };
}
