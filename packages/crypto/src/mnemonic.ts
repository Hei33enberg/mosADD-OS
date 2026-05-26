// Self-contained BIP-39 mnemonic implementation using Web Crypto.
// Wordlist is loaded lazily from the bundled text file via dynamic import or fetch.
// For environments where neither works, pass words via initWordlist().
import { toWebCryptoBytes } from "./utils";

let WORDLIST: string[] | null = null;

/** Allows pre-seeding the wordlist for environments without fetch/fs. */
export function initWordlist(words: string[]): void {
  if (words.length !== 2048) throw new Error("BIP-39 wordlist must contain exactly 2048 words");
  WORDLIST = words;
}

function getWordlist(): string[] {
  if (!WORDLIST) {
    throw new Error("BIP-39 wordlist not loaded. Call initWordlist() first or use generateMnemonic() which auto-loads.");
  }
  return WORDLIST;
}

async function ensureWordlist(): Promise<string[]> {
  if (WORDLIST) return WORDLIST;

  // Try fetching the bundled wordlist in browser environments
  if (typeof globalThis !== "undefined" && typeof (globalThis as any).fetch === "function") {
    try {
      // Vite serves files from packages via the dev server
      const candidates = [
        "/bip39-english.txt",
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            const words = text.trim().split(/\r?\n/).filter(Boolean);
            if (words.length === 2048) {
              WORDLIST = words;
              return WORDLIST;
            }
          }
        } catch {
          // try next candidate
        }
      }
    } catch {
      // fall through
    }
  }

  throw new Error("BIP-39 wordlist not initialized. Call initWordlist() with 2048 words before mnemonic operations.");
}

import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { randomBytes, textEncoder } from "./utils";

async function sha256Async(data: Uint8Array): Promise<Uint8Array> {
  return sha256(data);
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(2).padStart(8, "0"))
    .join("");
}

export async function generateMnemonic(strength = 128): Promise<string> {
  if (strength % 32 !== 0 || strength < 128 || strength > 256) {
    throw new Error("Invalid entropy strength");
  }
  const wordlist = await ensureWordlist();
  const entropy = randomBytes(strength / 8);

  const hash = await sha256Async(entropy);
  const checksumBits = strength / 32;
  const entropyBits = bytesToBinary(entropy);
  const checksumBinary = bytesToBinary(hash).slice(0, checksumBits);
  const allBits = entropyBits + checksumBinary;

  const words: string[] = [];
  for (let i = 0; i < allBits.length; i += 11) {
    const idx = parseInt(allBits.slice(i, i + 11), 2);
    words.push(wordlist[idx]);
  }
  return words.join(" ");
}

export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  const words = mnemonic.trim().split(/\s+/g);
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;

  const wordlist = await ensureWordlist();
  const bits: string[] = [];
  for (const w of words) {
    const idx = wordlist.indexOf(w);
    if (idx === -1) return false;
    bits.push(idx.toString(2).padStart(11, "0"));
  }
  const allBits = bits.join("");
  const strength = (words.length * 11 * 32) / 33;
  const checksumLen = strength / 32;
  const entropyBits = allBits.slice(0, strength);
  const checksumBits = allBits.slice(strength);

  const entropy = new Uint8Array(strength / 8);
  for (let i = 0; i < entropy.length; i++) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, i * 8 + 8), 2);
  }
  const hash = await sha256Async(entropy);
  const expectedChecksum = bytesToBinary(hash).slice(0, checksumLen);
  return checksumBits === expectedChecksum;
}

export function mnemonicToWords(mnemonic: string): string[] {
  return mnemonic.trim().split(/\s+/g);
}

export async function mnemonicToSeed(mnemonic: string, passphrase = "", options?: { highSecurity?: boolean }): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const password = enc.encode(mnemonic.normalize("NFKD"));
  const salt = enc.encode("mnemonic" + passphrase.normalize("NFKD"));
  const iterations = 2048;
  return pbkdf2Async(sha512, password, salt, { c: iterations, dkLen: 64 });
}
