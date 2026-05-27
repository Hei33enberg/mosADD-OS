import { getRuntimeCrypto } from "./platform";
import { deriveHkdfKey } from "./hkdf";
import { generateIdentity, exportEd25519KeyPair } from "./identity";
import { generateMnemonic, mnemonicToSeed, mnemonicToWords, validateMnemonic } from "./mnemonic";
import { randomBytes, textEncoder } from "./utils";

export interface VaultIdentity {
  accountId: string;
  mosaddEmail: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

export interface Vault {
  mnemonic: string;
  words: string[];
  masterKey: Uint8Array;
  storageKey: Uint8Array;
  lockSalt: Uint8Array;
  lockVerifier: Uint8Array;
  identity: VaultIdentity;
}

export function generateMosaddEmail(): string {
  const min = 100_000_000;
  const max = 999_999_999;
  const buf = new Uint32Array(1);
  getRuntimeCrypto().getRandomValues(buf);
  const value = min + (buf[0] % (max - min + 1));
  return `${value}@mosadd.com`;
}

async function exportIdentity(identity: Awaited<ReturnType<typeof generateIdentity>>, mosaddEmail: string): Promise<VaultIdentity> {
  // Use the noble-based export — NOT crypto.subtle.exportKey which fails on NobleCryptoKey shims
  const exported = await exportEd25519KeyPair(identity.keyPair);

  return {
    accountId: identity.accountId,
    mosaddEmail,
    publicKeyBase64: exported.publicKey,
    privateKeyBase64: exported.privateKey
  };
}

export async function createVault(options?: { mnemonic?: string; lockPassphrase?: string; mosaddEmail?: string; highSecurity?: boolean }): Promise<Vault> {
  const mnemonic = options?.mnemonic ?? await generateMnemonic(128);
  if (!(await validateMnemonic(mnemonic))) throw new Error("Invalid mnemonic");

  const seed = await mnemonicToSeed(mnemonic, "", { highSecurity: options?.highSecurity });
  const masterKey = await deriveHkdfKey(seed, { info: textEncoder.encode("m0ssad-master"), length: 32 });
  const storageKey = await deriveHkdfKey(masterKey, { info: textEncoder.encode("m0ssad-storage"), length: 32 });
  const lockSalt = randomBytes(16);

  const passphraseBytes = textEncoder.encode(options?.lockPassphrase ?? "");
  const lockVerifier = await deriveHkdfKey(passphraseBytes, {
    salt: lockSalt,
    info: textEncoder.encode("m0ssad-lock"),
    length: 32
  });

  // Derive the identity seed deterministically from masterKey
  const identitySeed = await deriveHkdfKey(masterKey, { info: textEncoder.encode("m0ssad-identity-seed"), length: 32 });
  const identity = await generateIdentity(identitySeed);
  const identityExport = await exportIdentity(identity, options?.mosaddEmail ?? generateMosaddEmail());

  return {
    mnemonic,
    words: mnemonicToWords(mnemonic),
    masterKey,
    storageKey,
    lockSalt,
    lockVerifier,
    identity: identityExport
  };
}

/** Re-lock an existing vault with a new passphrase (e.g. after generating identity without PIN). */
export async function setVaultLock(vault: Vault, newPassphrase: string): Promise<Vault> {
  const lockSalt = randomBytes(16);
  const passphraseBytes = textEncoder.encode(newPassphrase);
  const lockVerifier = await deriveHkdfKey(passphraseBytes, {
    salt: lockSalt,
    info: textEncoder.encode("m0ssad-lock"),
    length: 32
  });
  return {
    ...vault,
    lockSalt,
    lockVerifier,
  };
}

export async function verifyVaultPassphrase(passphrase: string, lockSalt: Uint8Array, expectedVerifier: Uint8Array): Promise<boolean> {
  const derived = await deriveHkdfKey(textEncoder.encode(passphrase), {
    salt: lockSalt,
    info: textEncoder.encode("m0ssad-lock"),
    length: 32
  });
  if (derived.length !== expectedVerifier.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i += 1) {
    diff |= derived[i] ^ expectedVerifier[i];
  }
  return diff === 0;
}
