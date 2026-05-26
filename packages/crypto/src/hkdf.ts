import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

export interface HkdfOptions {
  salt?: Uint8Array;
  info?: Uint8Array;
  length?: number;
}

export async function deriveHkdfKey(ikm: Uint8Array, options: HkdfOptions = {}): Promise<Uint8Array> {
  const salt = options.salt ?? new Uint8Array(32);
  const info = options.info ?? new Uint8Array();
  const length = options.length ?? 32;

  return hkdf(sha256, ikm, salt, info, length);
}
