// =============================================================================
// Domain normalization (LINEAR-2690).
//
// Goal: collapse every URL on a site to ONE canonical channel name so
// www.zalando.pl/men, m.zalando.pl, zalando.pl/x?q=1 all join the same room.
//
// We use a tiny built-in eTLD+1 heuristic instead of pulling the full Public
// Suffix List into the extension bundle (PSL is ~200 KB and updates monthly).
// The heuristic handles the long tail of `co.uk`-style multi-part TLDs that
// matter in practice — it's not perfect for every IDN edge case but it's
// good enough for the P0 viral loop. We can swap to a real PSL fetch (cached
// in chrome.storage) in P1 without changing the slug format.
//
// Output:
//   normalizeDomain("https://www.zalando.pl/men/?q=1") →
//     { domain: "zalando.pl", slug: "zalando-pl" }
// =============================================================================

/** Known multi-part public suffixes — pragmatic shortlist, not PSL-complete. */
const MULTIPART_TLDS = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "net.uk",
  "com.au", "net.au", "org.au", "gov.au", "edu.au",
  "co.nz", "net.nz", "org.nz", "govt.nz",
  "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
  "com.br", "net.br", "org.br", "gov.br",
  "co.in", "net.in", "org.in", "gov.in",
  "com.mx", "com.ar", "com.tr", "com.sg", "com.hk", "com.tw", "com.cn",
  "co.za", "co.kr", "co.il",
  "or.kr",
]);

const STRIPPABLE_PREFIXES = ["www.", "m.", "mobile.", "amp."];

/** Reserved/invalid targets — never produce a channel for these. */
const INVALID_HOSTS = new Set([
  "localhost", "127.0.0.1", "0.0.0.0", "::1",
]);

export interface NormalizedDomain {
  /** Canonical registrable domain: lowercase, no scheme/port/path, no `www.`. */
  domain: string;
  /** Worker/DO route id: dots replaced by dashes (`zalando-pl`). */
  slug: string;
}

/** Returns the eTLD+1 of `host`. Heuristic. */
function registrableDomain(host: string): string {
  // IP literals: not a domain, return as-is so the caller can reject.
  if (/^[0-9.]+$/.test(host) || host.includes(":")) return host;
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) return host;
  const last2 = parts.slice(-2).join(".");
  const last3 = parts.slice(-3).join(".");
  if (parts.length >= 3 && MULTIPART_TLDS.has(parts.slice(-2).join("."))) {
    return last3; // e.g. `bbc.co.uk`
  }
  return last2;
}

/** Normalize a URL or host into the canonical domain + Worker slug. Returns
 *  null when the host is unsuitable (IP, localhost, file://, etc.). */
export function normalizeDomain(input: string): NormalizedDomain | null {
  if (!input) return null;
  let host: string;
  try {
    const u = input.includes("://") ? new URL(input) : new URL(`http://${input}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    host = u.hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host || INVALID_HOSTS.has(host)) return null;
  // IP literals are not browseable as "the zalando room" — skip.
  if (/^[0-9.]+$/.test(host) || host.includes(":")) return null;

  for (const p of STRIPPABLE_PREFIXES) {
    if (host.startsWith(p)) { host = host.slice(p.length); break; }
  }
  const domain = registrableDomain(host);
  if (!domain || !domain.includes(".")) return null;
  // Domain must already be lowercased a-z0-9.- — punycode IDN handled by URL.
  if (!/^[a-z0-9.-]{1,253}$/.test(domain)) return null;
  const slug = domain.replace(/\./g, "-");
  if (!/^[a-z0-9-]{1,128}$/.test(slug)) return null;
  return { domain, slug };
}
