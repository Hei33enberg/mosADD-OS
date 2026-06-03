// =============================================================================
// Client-side proof-of-work (LINEAR-2696 / C1-1).
//
// Hashcash with SHA-256: find nonce s.t.
//   sha256(domain + ":" + device_token + ":" + ts + ":" + nonce)
// starts with `bits` leading zero bits. Default difficulty (12 bits) → ~4096
// hashes on average, ~50-500ms in a modern browser via Web Crypto API.
// Invisible to humans on first join; ruinous for spammer fleets.
//
// Stateless: the server does not issue a challenge — the client picks its
// own timestamp (must be within 120s of server time at verification) and
// nonces locally. Anti-replay is provided by the timestamp window + the
// 5-min channel-token TTL minted on success.
// =============================================================================

const enc = new TextEncoder();

export interface PowSolution {
  ts: number;     // unix seconds, client-picked
  nonce: string;  // random string discovered to satisfy the difficulty
}

async function sha256(s: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return new Uint8Array(buf);
}

function leadingZeroBits(bytes: Uint8Array): number {
  let n = 0;
  for (const b of bytes) {
    if (b === 0) { n += 8; continue; }
    let m = 0x80;
    while (m && !(b & m)) { n++; m >>= 1; }
    break;
  }
  return n;
}

/** Solve the PoW. Yields control roughly every 256 attempts so the UI thread
 *  stays responsive on slow devices. */
export async function solvePow(args: {
  domain: string;
  device_token: string;
  bits: number;
  /** Optional override; defaults to current client time. */
  ts?: number;
  /** Max attempts before throwing — prevents runaway compute on broken inputs. */
  maxAttempts?: number;
}): Promise<PowSolution> {
  const { domain, device_token, bits } = args;
  const ts = args.ts ?? Math.floor(Date.now() / 1000);
  const maxAttempts = args.maxAttempts ?? 5_000_000;

  if (bits <= 0) return { ts, nonce: "0" };

  let attempts = 0;
  while (attempts < maxAttempts) {
    // 8-byte nonce keeps the hash input short while leaving 64 bits of entropy.
    const nonce = Math.random().toString(36).slice(2) + attempts.toString(36);
    const candidate = `${domain}:${device_token}:${ts}:${nonce}`;
    const h = await sha256(candidate);
    if (leadingZeroBits(h) >= bits) return { ts, nonce };
    attempts++;
    // Cooperative yield every 256 iterations.
    if ((attempts & 0xff) === 0) await new Promise((r) => setTimeout(r, 0));
  }
  throw new Error("pow_exhausted");
}
