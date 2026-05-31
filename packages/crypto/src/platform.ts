export function getRuntimeCrypto(): Crypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto) return globalThis.crypto;
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto) return (globalThis as any).crypto;
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  return {
    getRandomValues: (_buf: unknown) => {
      throw new Error("crypto.getRandomValues not available. Is react-native-get-random-values polyfilled?");
    },
    subtle: undefined as any
  } as unknown as Crypto;
}

export function getRuntimeTextEncoder(): TextEncoder {
  if (typeof globalThis !== "undefined" && globalThis.TextEncoder) return new globalThis.TextEncoder();
  if (typeof globalThis !== "undefined" && (globalThis as any).TextEncoder) return new (globalThis as any).TextEncoder();
  if (typeof window !== "undefined" && (window as any).TextEncoder) return new (window as any).TextEncoder();
  throw new Error("TextEncoder not available. Is text-encoding polyfilled?");
}

export function getRuntimeTextDecoder(): TextDecoder {
  if (typeof globalThis !== "undefined" && globalThis.TextDecoder) return new globalThis.TextDecoder();
  if (typeof globalThis !== "undefined" && (globalThis as any).TextDecoder) return new (globalThis as any).TextDecoder();
  if (typeof window !== "undefined" && (window as any).TextDecoder) return new (window as any).TextDecoder();
  throw new Error("TextDecoder not available. Is text-encoding polyfilled?");
}

export function hasWebCrypto(): boolean {
  const crypto = getRuntimeCrypto();
  return !!(crypto && crypto.subtle);
}

export function assertWebCrypto(): void {
  if (!hasWebCrypto()) {
    throw new Error("WebCrypto is required for @mosadd/crypto");
  }
}
