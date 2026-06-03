// =============================================================================
// Deterministic anonymous nick + avatar (LINEAR-2690).
//
// Stable per (deviceToken, domain) so your nick on zalando.pl is the same on
// every visit. Pure function so the same input always produces the same nick
// — no server round-trip required. The dictionary lists are intentionally
// short and PG-safe; we trade variety for clean output, since adversarial
// nick collisions are not a threat (one DO = one room, dupes are visually
// suffixed with -NN at the call site by the popup).
// =============================================================================

const ADJECTIVES = [
  "happy", "lucky", "brave", "bright", "calm", "clever", "cosmic", "curious",
  "dreamy", "electric", "fancy", "fierce", "fuzzy", "gentle", "golden",
  "groovy", "honest", "humble", "icy", "jolly", "lively", "lucky", "mellow",
  "merry", "mighty", "neon", "noble", "plucky", "polite", "proud", "quiet",
  "rapid", "rebel", "royal", "shiny", "silent", "silly", "snappy", "sneaky",
  "spicy", "stellar", "sunny", "swift", "tiny", "vivid", "wild", "witty",
  "zesty", "zen", "atomic",
];

const NOUNS = [
  "otter", "panda", "fox", "lynx", "owl", "wolf", "hare", "raven",
  "falcon", "tiger", "lemur", "koala", "badger", "bison", "beaver",
  "cobra", "dingo", "eagle", "ferret", "gecko", "heron", "ibis",
  "jaguar", "kiwi", "llama", "mantis", "narwhal", "octopus", "puma",
  "quokka", "rhino", "stoat", "tapir", "urchin", "viper", "walrus",
  "yak", "zebra", "moose", "ocelot", "newt", "raccoon", "salamander",
];

/** Browser-safe FNV-1a 32-bit. */
function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export interface Identity {
  nick: string;
  /** HSL hue 0-359 for the avatar. */
  hue: number;
  /** Two-letter initials. */
  initials: string;
}

export function deterministicIdentity(deviceToken: string, domain: string): Identity {
  const seed = fnv1a(`${deviceToken}|${domain}`);
  const adj = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[(seed >>> 8) % NOUNS.length];
  const num = (seed >>> 16) % 100;
  const nick = `${adj}-${noun}-${num.toString().padStart(2, "0")}`;
  const hue = seed % 360;
  const initials = `${adj[0]}${noun[0]}`.toUpperCase();
  return { nick, hue, initials };
}

/** Generate a fresh per-install device token (UUID). Store once per install
 *  in chrome.storage.local — this is the rate-limit/ban key, never sent in
 *  clear to anyone else's machine. */
export function generateDeviceToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback (extremely old runtimes only — Chrome MV3 always has crypto).
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0"),
  ).join("");
}
