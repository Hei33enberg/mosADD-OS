import { getRuntimeCrypto, getRuntimeTextDecoder, getRuntimeTextEncoder } from "./platform";

let _encoder: TextEncoder | null = null;
let _decoder: TextDecoder | null = null;

export function getTextEncoder(): TextEncoder {
  if (!_encoder) _encoder = getRuntimeTextEncoder();
  return _encoder;
}

export function getTextDecoder(): TextDecoder {
  if (!_decoder) _decoder = getRuntimeTextDecoder();
  return _decoder;
}

export const textEncoder = {
  encode: (text?: string) => getTextEncoder().encode(text)
};

export const textDecoder = {
  decode: (bytes?: BufferSource) => getTextDecoder().decode(bytes)
};

export interface NobleCryptoKey extends CryptoKey {
  _raw: Uint8Array;
}

export function extractNobleKeyBytes(key: CryptoKey): Uint8Array {
  if ('_raw' in key) {
    return (key as NobleCryptoKey)._raw;
  }
  throw new Error("Expected a NobleCryptoKey but got a different object");
}

export function toBase64(bytes: Uint8Array): string {
  const g = globalThis as any;
  const _btoa = typeof btoa !== "undefined" ? btoa : g.btoa;
  if (typeof _btoa !== "function") {
    throw new Error("Base64 encoding is unavailable in this runtime");
  }
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return _btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const g = globalThis as any;
  const _atob = typeof atob !== "undefined" ? atob : g.atob;
  if (typeof _atob !== "function") {
    throw new Error("Base64 decoding is unavailable in this runtime");
  }
  const binary = _atob(base64);
  return Uint8Array.from(binary, (c: string) => c.charCodeAt(0));
}

export function toWebCryptoBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const normalized = new Uint8Array(bytes.byteLength);
  normalized.set(bytes);
  return normalized;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  getRuntimeCrypto().getRandomValues(out);
  return out;
}
