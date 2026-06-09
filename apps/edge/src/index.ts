/**
 * mosadd-edge — Cloudflare Worker + Durable Object per channel.
 *
 * E1 (LIVE): one ChannelDO per channel name, Hibernatable WS fan-out, ring buffer.
 * E2 (LIVE, LINEAR-2678): edge auth via hub key + per-key rate limit + DO-local
 *   key cache (60s). Supabase `hub-key-verify` only on cache miss.
 * E3 (LIVE, LINEAR-2679): async flush DO → Supabase as system-of-record.
 * E6 (this build, LINEAR-2675): scoped per-channel JWT auth via
 *   `Sec-WebSocket-Protocol`, so browsers + external relays NEVER need to ship
 *   the hub key. Strajk HANDOFF-14 surfaced two real flaws in our prior recipe:
 *     1. `?k=mosadd_sk_live_…` leaks the hub key to CF access logs.
 *     2. External relays are often serverless — they can't hold a stateful WS.
 *   E6 fixes both: server-side mints a 5-min channel-scoped JWT via Supabase
 *   `hub-mint-channel-token` (hub-key Bearer in → JWT out), the client (browser
 *   or relay) opens the DO WS with `Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>`,
 *   the Worker validates HS256 locally (no Supabase hop), echoes `mosadd.v1`
 *   in the upgrade response.
 *
 * Auth model (precedence order on the WS upgrade):
 *   1. `Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>` (E6, RECOMMENDED).
 *   2. `Authorization: Bearer mosadd_sk_live_…` (server-side relays / MCP).
 *   3. `?k=mosadd_sk_live_…` (DEPRECATED — kept for backward compat; CF logs
 *      the URL, so this leaks the key. Stop using it.)
 *
 * Rate limit unchanged: 600/min per identity (key-hash for hub keys, jwt.sub
 *   for scoped tokens), token bucket in DO state.
 */

export interface Env {
  CHANNEL: DurableObjectNamespace;
  /** Supabase project base URL — public, in wrangler.toml [vars]. */
  SUPABASE_URL: string;
  /** Shared secret with the Supabase `message-ingest-batch` fn (LINEAR-2679).
   *  Set via `wrangler secret put CF_INGEST_SECRET` (CI does it). Same value on
   *  the Supabase side as an Edge Function secret. */
  CF_INGEST_SECRET?: string;
  /** HS256 secret for short-lived per-channel JWTs minted by hub-mint-channel-token
   *  (LINEAR-2675/E6). Lets the browser hold a SCOPED token instead of a hub key.
   *  Set via `wrangler secret put CHANNEL_TOKEN_SECRET`. */
  CHANNEL_TOKEN_SECRET?: string;
}

const HISTORY_LIMIT = 100;
const KEY_CACHE_TTL_MS = 60_000;
const RL_PER_MIN_HUB = 600;
const RL_PER_MIN_ANON = 90;
const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_BATCH_MAX = 500;
// Phase 0 hardening: bound the durable pending queue (drop-oldest on overflow —
// better to lose the oldest few than to OOM the DO and lose everything) and cap
// concurrent sockets per anonymous identity (anti token-replay amplification).
const PENDING_MAX = 10_000;
const MAX_SOCKETS_PER_IDENTITY = 5;

// Hardening — per-socket burst + per-channel ceiling + content rules.
const MSG_MAX_LEN          = 2_000;
const MSG_MAX_LINES        = 3;
const MSG_REPEAT_CHAR_RUN  = 8;
const MSG_DOMINANT_RATIO   = 0.70;
const MSG_DOMINANT_MIN_LEN = 20;
const MSG_ZALGO_RATIO      = 0.30;
const BURST_SEC1_MAX       = 3;
const BURST_SEC10_MAX      = 15;
const REPEAT_LOOKBACK      = 5;
const REPEAT_BLOCK_AT      = 3;
const CHANNEL_CEILING_PMIN = 200;
// channel0 (LINEAR-2693): how long the DO trusts a domain-status check (open/claimed/blocked)
// before re-asking domain-channel-ensure. Long enough to absorb all hot traffic; short
// enough for a verified-owner block to propagate worldwide in under a minute.
const ENSURE_CACHE_TTL_MS = 60_000;
const NICK_TAG_PREFIX = "nick:"; // second WS tag holds the presence nick

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

const json = (b: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(b), {
    ...init,
    headers: { "Content-Type": "application/json", ...CORS, ...(init.headers ?? {}) },
  });

/** Pulls a hub key from Authorization OR ?k= (the latter is DEPRECATED — leaks to CF logs). */
function extractKey(req: Request, url: URL): string | null {
  const authz = req.headers.get("Authorization") ?? "";
  const fromHeader = authz.replace(/^Bearer\s+/i, "").trim();
  if (fromHeader) return fromHeader;
  const fromQuery = url.searchParams.get("k") ?? "";
  return fromQuery || null;
}

/** Parses `Sec-WebSocket-Protocol` looking for the E6 mosadd handshake.
 *  Browsers can't set arbitrary headers on a WS upgrade, but they CAN set the
 *  sub-protocol — that's why this lives there. Format we accept (case-insensitive):
 *    Sec-WebSocket-Protocol: mosadd.v1, bearer.<jwt>
 *  Returns the bare JWT if present, else null. */
function extractScopedJwt(req: Request): string | null {
  const raw = req.headers.get("Sec-WebSocket-Protocol");
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  let sawMosadd = false;
  let token: string | null = null;
  for (const p of parts) {
    if (/^mosadd\.v1$/i.test(p)) sawMosadd = true;
    else if (/^bearer\./i.test(p)) token = p.slice("bearer.".length);
  }
  return sawMosadd && token ? token : null;
}

const b64urlDecodeToBytes = (s: string): Uint8Array => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const b64urlDecodeToStr = (s: string): string => new TextDecoder().decode(b64urlDecodeToBytes(s));

interface ScopedJwtClaims {
  iss?: string;
  sub: string;
  iat: number;
  exp: number;
  channel_id: string;
  scope: string;
  plan?: string;
  key_id?: string;
}

/** Verifies an HS256 JWT minted by Supabase `hub-mint-channel-token`. Validates
 *  signature, exp, iss, and that the token's channel_id matches the path. No
 *  Supabase round-trip — the shared secret is enough. */
async function verifyScopedJwt(
  jwt: string,
  secret: string,
  expectedChannelId: string,
): Promise<{ ok: true; claims: ScopedJwtClaims } | { ok: false; reason: string }> {
  const parts = jwt.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [h, p, s] = parts;
  let header: { alg?: string; typ?: string };
  let claims: ScopedJwtClaims;
  try { header = JSON.parse(b64urlDecodeToStr(h)); } catch { return { ok: false, reason: "bad_header" }; }
  try { claims = JSON.parse(b64urlDecodeToStr(p)) as ScopedJwtClaims; } catch { return { ok: false, reason: "bad_payload" }; }
  if (header.alg !== "HS256") return { ok: false, reason: "bad_alg" };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigOk = await crypto.subtle.verify("HMAC", key, b64urlDecodeToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!sigOk) return { ok: false, reason: "bad_sig" };

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp < now) return { ok: false, reason: "expired" };
  if (claims.iss && claims.iss !== "mosadd-hub") return { ok: false, reason: "bad_iss" };
  if (!claims.channel_id || claims.channel_id !== expectedChannelId) return { ok: false, reason: "channel_mismatch" };
  // Accept either the bare scope "chat:rw" or a comma-separated scope list containing it.
  const scopes = (claims.scope ?? "").split(/[\s,]+/).filter(Boolean);
  if (!scopes.includes("chat:rw")) return { ok: false, reason: "bad_scope" };
  if (!claims.sub) return { ok: false, reason: "no_sub" };
  return { ok: true, claims };
}

// =============================================================================
// Worker: routes to the right ChannelDO + handles /health.
// =============================================================================
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "mosadd-edge", phase: "E6-scoped-jwt" });
    }

    const m = url.pathname.match(/^\/c\/([A-Za-z0-9_-]{1,128})\/(ws|send|history|presence)$/);
    if (!m) return json({ error: "not_found" }, { status: 404 });
    const [, channelId] = m;
    const stub = env.CHANNEL.get(env.CHANNEL.idFromName(channelId));
    return stub.fetch(req);
  },
};

// =============================================================================
// ChannelDO — per-channel WS fan-out + key cache + rate limit.
// =============================================================================

interface StoredMessage { id: string; ts: number; from?: string | null; text: string; }
/** Same as StoredMessage but carries channel_id so the ingest endpoint can route to the
 *  right messages_meta row. The DO knows its channel_id from its idFromName via the URL. */
interface PendingMessage extends StoredMessage { channel_id: string; }
interface KeyCacheEntry { hash: string; valid: boolean; user_id?: string; plan?: string; exp: number; nick?: string }
interface RLBucket { count: number; window_start: number; }
/** channel0 (LINEAR-2693): cached result of the domain-channel-ensure call so the
 *  DO can refuse `blocked` domains without a Supabase round-trip on every join. */
interface EnsureCache { status: "open" | "claimed" | "blocked"; branding: Record<string, unknown>; exp: number; }

export class ChannelDO {
  private state: DurableObjectState;
  private env: Env;
  /** In-memory key cache (cleared on hibernation; falls back to fresh verify). */
  private keyCache = new Map<string, KeyCacheEntry>();
  private rl = new Map<string, RLBucket>();
  private burst = new Map<string, number[]>();
  private repeat = new Map<string, string[]>();
  private channelBucket = { window_start: 0, count: 0 };
  /** channel0: domain-status cache (one entry — the DO is per-channel). */
  private ensure: EnsureCache | null = null;
  /** Count of pending messages dropped under sustained flush backpressure (surfaced via metrics). */
  private droppedPending = 0;
  /** Phase 0.3 cost fix: recent-history ring kept in MEMORY (best-effort) and
   *  snapshotted to storage once per flush, instead of a durable put per message.
   *  Lazy-loaded on first use (and after hibernation). Supabase is the SoR. */
  private recentMem: StoredMessage[] | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /** channel0: ask Supabase once per ENSURE_CACHE_TTL_MS whether this domain is
   *  open / claimed / blocked, and what branding to apply. On any error we
   *  fail OPEN (treat as `open`) — viral path stays unblocked if Supabase
   *  hiccups; the channel0-join edge fn is the authoritative check at mint time
   *  and re-runs every 5 minutes anyway. */
  private async ensureDomainStatus(slug: string): Promise<EnsureCache> {
    const now = Date.now();
    if (this.ensure && this.ensure.exp > now) return this.ensure;
    const fallback: EnsureCache = { status: "open", branding: {}, exp: now + ENSURE_CACHE_TTL_MS };
    if (!this.env.SUPABASE_URL || !this.env.CF_INGEST_SECRET) { this.ensure = fallback; return fallback; }
    try {
      const r = await fetch(`${this.env.SUPABASE_URL}/functions/v1/domain-channel-ensure`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.env.CF_INGEST_SECRET}` },
        body: JSON.stringify({ slug, domain: slug.replace(/-/g, ".") }),
      });
      if (!r.ok) { this.ensure = fallback; return fallback; }
      const data = await r.json().catch(() => null) as { status?: string; branding?: Record<string, unknown> } | null;
      const status = (data?.status === "claimed" || data?.status === "blocked") ? data.status : "open";
      this.ensure = { status, branding: data?.branding ?? {}, exp: now + ENSURE_CACHE_TTL_MS };
      return this.ensure;
    } catch {
      this.ensure = fallback;
      return fallback;
    }
  }

  /** Read the current presence roster from open WebSockets (their nick tag). */
  private rosterFromSockets(): { nicks: string[]; count: number } {
    const seen = new Set<string>();
    for (const ws of this.state.getWebSockets()) {
      const tags = this.state.getTags(ws) ?? [];
      const t = tags.find((x) => typeof x === "string" && x.startsWith(NICK_TAG_PREFIX));
      if (t) seen.add(t.slice(NICK_TAG_PREFIX.length));
    }
    // Cap the broadcast roster size — privacy & payload bound for hot rooms.
    const nicks = Array.from(seen).slice(0, 100);
    return { nicks, count: seen.size };
  }

  /** Broadcast a `{type:"presence", count, roster}` frame to all open sockets. */
  private broadcastPresence(): void {
    const { nicks, count } = this.rosterFromSockets();
    const frame = JSON.stringify({ type: "presence", count, roster: nicks });
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(frame); } catch { /* dropped */ }
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  private async verifyKey(apiKey: string): Promise<KeyCacheEntry> {
    if (!apiKey || !/^mosadd_sk_live_[a-f0-9]{32,}$/.test(apiKey)) {
      return { hash: "", valid: false, exp: Date.now() + KEY_CACHE_TTL_MS };
    }
    // Hash the key so we don't keep plaintext in memory
    const hash = await sha256Hex(apiKey);
    const now = Date.now();
    const cached = this.keyCache.get(hash);
    if (cached && cached.exp > now) return cached;

    // Cache miss → ask Supabase hub-key-verify (the only Supabase hop on hot path,
    // and only once per 60s per key per DO instance).
    try {
      const r = await fetch(`${this.env.SUPABASE_URL}/functions/v1/hub-key-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      });
      const data = await r.json().catch(() => null) as { valid?: boolean; user_id?: string; plan?: string } | null;
      const entry: KeyCacheEntry = data?.valid
        ? { hash, valid: true, user_id: data.user_id, plan: data.plan, exp: now + KEY_CACHE_TTL_MS }
        : { hash, valid: false, exp: now + KEY_CACHE_TTL_MS };
      this.keyCache.set(hash, entry);
      // Trim cache (LRU-ish)
      if (this.keyCache.size > 256) {
        const oldest = this.keyCache.keys().next().value;
        if (oldest !== undefined) this.keyCache.delete(oldest);
      }
      return entry;
    } catch {
      return { hash, valid: false, exp: now + 5_000 }; // brief negative cache on transport error
    }
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  private checkRateLimit(keyHash: string, limit: number = RL_PER_MIN_HUB): { ok: boolean; retry_after?: number } {
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    const b = this.rl.get(keyHash);
    if (!b || b.window_start !== minute) {
      this.rl.set(keyHash, { count: 1, window_start: minute });
      return { ok: true };
    }
    b.count += 1;
    if (b.count > limit) return { ok: false, retry_after: 60 - Math.floor((now % 60_000) / 1000) };
    return { ok: true };
  }

  /** Pure content checks. Returns a reject reason or null when fine. */
  private validateContent(text: string): string | null {
    if (text.length === 0) return "empty";
    if (text.length > MSG_MAX_LEN) return "too_long";
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) return "control_chars";
    const lines = text.split(/\r?\n/).length;
    if (lines > MSG_MAX_LINES) return "multiline_flood";
    if (new RegExp("(.)\\1{" + MSG_REPEAT_CHAR_RUN + ",}").test(text)) return "repeat_char";
    // Repeated short pattern (e.g. "adadadad", "abcabcabc") — 1..5 char unit repeated 4+ times.
    if (/(.{1,5})\1{3,}/.test(text)) return "repeat_pattern";
    const nonWs = text.replace(/\s+/g, "");
    if (nonWs.length >= MSG_DOMINANT_MIN_LEN) {
      const counts = new Map<string, number>();
      for (const c of nonWs) counts.set(c, (counts.get(c) ?? 0) + 1);
      let max = 0;
      for (const v of counts.values()) if (v > max) max = v;
      if (max / nonWs.length > MSG_DOMINANT_RATIO) return "dominant_char";
    }
    if (nonWs.length >= 50 && !/\s/.test(text)) return "single_token";
    const combining = (text.match(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g) ?? []).length;
    if (text.length > 8 && combining / text.length > MSG_ZALGO_RATIO) return "zalgo";
    return null;
  }

  /** Per-socket burst tracker. Returns retry-after seconds or null when fine. */
  private checkBurst(tagId: string): number | null {
    const now = Date.now();
    let arr = this.burst.get(tagId);
    if (!arr) { arr = []; this.burst.set(tagId, arr); }
    while (arr.length && now - arr[0] > 10_000) arr.shift();
    const last1s  = arr.filter((t) => now - t < 1_000).length;
    const last10s = arr.length;
    if (last1s  >= BURST_SEC1_MAX)  return 1;
    if (last10s >= BURST_SEC10_MAX) return Math.max(1, Math.ceil((10_000 - (now - arr[0])) / 1000));
    arr.push(now);
    return null;
  }

  /** Same-text repeat tracker. */
  private isRepeat(tagId: string, text: string): boolean {
    let ring = this.repeat.get(tagId);
    if (!ring) { ring = []; this.repeat.set(tagId, ring); }
    ring.push(text);
    if (ring.length > REPEAT_LOOKBACK) ring.shift();
    let n = 0;
    for (const t of ring) if (t === text) n++;
    return n >= REPEAT_BLOCK_AT;
  }

  /** DO-wide per-minute ceiling. */
  private checkChannelCeiling(): { ok: boolean; retry_after: number } {
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    if (this.channelBucket.window_start !== minute) {
      this.channelBucket = { window_start: minute, count: 1 };
      return { ok: true, retry_after: 0 };
    }
    this.channelBucket.count += 1;
    if (this.channelBucket.count > CHANNEL_CEILING_PMIN) {
      return { ok: false, retry_after: 60 - Math.floor((now % 60_000) / 1000) };
    }
    return { ok: true, retry_after: 0 };
  }

  /** Phase 0: drop stale per-identity tracking so rl/burst/repeat can't grow
   *  unbounded during sustained activity (they used to leak → OOM). Runs each
   *  alarm tick; hibernation clears memory when the room goes fully idle. */
  private sweepMaps(): void {
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    for (const [k, b] of this.rl) if (b.window_start < minute) this.rl.delete(k);
    for (const [k, arr] of this.burst) {
      while (arr.length && now - arr[0] > 10_000) arr.shift();
      if (arr.length === 0) this.burst.delete(k);
    }
    const live = new Set<string>();
    for (const ws of this.state.getWebSockets()) {
      const t = (this.state.getTags(ws) ?? [])[0];
      if (typeof t === "string") live.add(t);
    }
    for (const k of this.repeat.keys()) if (!live.has(k)) this.repeat.delete(k);
    // Hard backstop: never let any map exceed a sane bound (drop-oldest).
    this.capMap(this.rl); this.capMap(this.burst); this.capMap(this.repeat);
  }
  private capMap(m: Map<string, unknown>, max = 50_000): void {
    if (m.size <= max) return;
    let drop = m.size - max;
    for (const k of m.keys()) { if (drop-- <= 0) break; m.delete(k); }
  }

  // ── Router ────────────────────────────────────────────────────────────────
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const op = url.pathname.split("/").pop() ?? "";
    // Cache the channel_id on first hit — needed for E3 ingest routing.
    const ch = url.pathname.match(/^\/c\/([A-Za-z0-9_-]{1,128})\//)?.[1];
    if (ch) {
      const known = await this.state.storage.get<string>("channel_id");
      if (known !== ch) await this.state.storage.put("channel_id", ch);
    }

    // ── WS upgrade — E6 precedence: scoped JWT > Authorization > ?k= (deprecated)
    if (op === "ws") {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "expected_websocket_upgrade" }, { status: 426 });
      const channelId = ch ?? "";

      // channel0 defense-in-depth: if a verified owner blocked this domain, the
      // mint endpoint already 451'd — but a leaked-but-unexpired token could
      // still arrive. Refuse here too.
      const ensured = await this.ensureDomainStatus(channelId);
      if (ensured.status === "blocked") return json({ error: "domain_blocked" }, { status: 451 });

      // (1) Scoped JWT via Sec-WebSocket-Protocol — the recommended path.
      const jwt = extractScopedJwt(req);
      if (jwt && this.env.CHANNEL_TOKEN_SECRET) {
        const v = await verifyScopedJwt(jwt, this.env.CHANNEL_TOKEN_SECRET, channelId);
        if (!v.ok) return json({ error: "invalid_token", reason: v.reason }, { status: 401 });
        // For rate-limiting we tag by sub (the end-user) — generous limits handle
        // the relay-multiplexes-many-users case at the mint endpoint, not here.
        // channel0: extract the nick from sub ("anon:<nick>") for presence + display.
        const nick = v.claims.sub.startsWith("anon:") ? v.claims.sub.slice(5) : v.claims.sub.slice(0, 32);
        const entry: KeyCacheEntry = {
          hash: await sha256Hex(`jwt:${v.claims.sub}`),
          valid: true,
          user_id: v.claims.sub,
          plan: v.claims.plan ?? "free",
          exp: v.claims.exp * 1000,
          nick,
        };
        return this.handleWsUpgrade(entry, /*echoProto*/ "mosadd.v1");
      }

      // (2,3) Hub key fallback (header preferred, ?k= deprecated).
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });
      return this.handleWsUpgrade(entry, null);
    }

    // channel0 (LINEAR-2693): `GET /presence` returns the live roster without
    // requiring a WS upgrade. Anyone can read presence for an open channel —
    // it's the discovery surface ("how many people are on zalando.pl right now").
    if (op === "presence" && req.method === "GET") {
      const ensured = await this.ensureDomainStatus(ch ?? "");
      if (ensured.status === "blocked") return json({ error: "domain_blocked" }, { status: 451 });
      const { nicks, count } = this.rosterFromSockets();
      return json({ count, roster: nicks, branding: ensured.branding, status: ensured.status });
    }

    if (op === "send" && req.method === "POST") {
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });

      const rl = this.checkRateLimit(entry.hash);
      if (!rl.ok) return json({ error: "rate_limited", retry_after: rl.retry_after }, { status: 429 });

      const body = await req.json().catch(() => null) as { text?: string; from?: string } | null;
      const rawText = typeof body?.text === "string" ? body.text : "";
      const text = rawText.slice(0, MSG_MAX_LEN).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
      if (!text) return json({ error: "text_required" }, { status: 400 });
      const sendReason = this.validateContent(text);
      if (sendReason) return json({ error: "rejected", reason: sendReason }, { status: 400 });
      const msg: StoredMessage = { id: crypto.randomUUID(), ts: Date.now(), from: body?.from ?? entry.user_id ?? null, text };
      await this.append(msg);
      this.broadcast(msg);
      return json({ ok: true, id: msg.id, ts: msg.ts });
    }

    if (op === "history") {
      // History is cheap (DO storage read) but still gated to authenticated callers.
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });
      const limit = Math.max(1, Math.min(HISTORY_LIMIT, Number(url.searchParams.get("limit") ?? "50")));
      const buf = await this.ensureRecent();
      return json({ messages: buf.slice(-limit) });
    }

    return json({ error: "not_found" }, { status: 404 });
  }

  // ── WS lifecycle ──────────────────────────────────────────────────────────
  /** Accepts the WS, tags it for rate-limiting, and (E6) echoes the chosen
   *  sub-protocol when the client requested it. Echoing matters: the WS spec
   *  says the server MUST echo one of the offered protocols if it wants the
   *  client to consider the handshake successful. Without echo, browsers
   *  reject the connection. */
  private async handleWsUpgrade(entry: KeyCacheEntry, echoProto: string | null): Promise<Response> {
    // Phase 0 (B1): cap concurrent sockets per ANONYMOUS identity — one minted
    // 5-min token must not open thousands of sockets (token-replay amplification).
    // Hub-key relays legitimately multiplex many users, so the cap is anon-only
    // (anon entries carry a nick; hub-key entries don't).
    if (entry.nick) {
      let same = 0;
      for (const ws of this.state.getWebSockets()) {
        if ((this.state.getTags(ws) ?? [])[0] === entry.hash) same++;
      }
      if (same >= MAX_SOCKETS_PER_IDENTITY) {
        return json({ error: "too_many_connections" }, { status: 429 });
      }
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    // Tags[0] = rate-limit key (back-compat).
    // Tags[1] = "nick:<presence-nick>" (channel0). Hub-key callers have no nick;
    // we tag them with a deterministic stub so presence-roster still works.
    const tags = [entry.hash, `${NICK_TAG_PREFIX}${entry.nick ?? `dev-${entry.hash.slice(0, 6)}`}`];
    this.state.acceptWebSocket(server, tags);
    const headers = echoProto ? { "Sec-WebSocket-Protocol": echoProto } : undefined;
    // Broadcast updated presence to everyone (including the new joiner — the
    // client uses this frame to render the initial roster).
    queueMicrotask(() => this.broadcastPresence());
    return new Response(null, { status: 101, webSocket: client, headers });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    if (message.length > 8_000) { try { ws.send(JSON.stringify({ error: "too_long" })); } catch {} return; }
    const tags = this.state.getTags(ws) ?? [];
    const keyHash = tags[0] ?? "anon";
    const isAnon = tags.some((t) => typeof t === "string" && t.startsWith(NICK_TAG_PREFIX));
    const perMinLimit = isAnon ? RL_PER_MIN_ANON : RL_PER_MIN_HUB;

    const rl = this.checkRateLimit(keyHash, perMinLimit);
    if (!rl.ok) { try { ws.send(JSON.stringify({ error: "rate_limited", retry_after: rl.retry_after })); } catch {} return; }

    const burst = this.checkBurst(keyHash);
    if (burst !== null) { try { ws.send(JSON.stringify({ error: "burst", retry_after: burst })); } catch {} return; }

    // Channel ceiling applies only to anon (channel0) rooms — paid hub-key
    // callers (strajkpolski, mIRC embed devs) are gated by their own 600/min
    // per-key limit + plan quotas, not by a one-size DO ceiling that would
    // brick a 50k-user strike day.
    if (isAnon) {
      const ceiling = this.checkChannelCeiling();
      if (!ceiling.ok) { try { ws.send(JSON.stringify({ error: "channel_ceiling", retry_after: ceiling.retry_after })); } catch {} return; }
    }

    let parsed: { text?: string; from?: string } | null = null;
    try { parsed = JSON.parse(message); } catch { return; }
    const raw = typeof parsed?.text === "string" ? parsed.text : "";
    const text = raw.slice(0, MSG_MAX_LEN).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
    if (!text) return;

    const contentReason = this.validateContent(text);
    if (contentReason) { try { ws.send(JSON.stringify({ error: "rejected", reason: contentReason })); } catch {} return; }

    if (this.isRepeat(keyHash, text)) { try { ws.send(JSON.stringify({ error: "rejected", reason: "repeat_message" })); } catch {} return; }

    const msg: StoredMessage = { id: crypto.randomUUID(), ts: Date.now(), from: parsed?.from ?? null, text };
    await this.append(msg);
    this.broadcast(msg);
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean): Promise<void> {
    try { ws.close(code, "closing"); } catch { /* idempotent */ }
    // channel0: drop the socket THEN announce. getWebSockets() reflects post-close.
    queueMicrotask(() => this.broadcastPresence());
  }

  async webSocketError(_ws: WebSocket, _err: unknown): Promise<void> { /* swallow */ }

  // ── State ─────────────────────────────────────────────────────────────────
  /** Lazy-load the recent ring into memory (after cold start / hibernation). */
  private async ensureRecent(): Promise<StoredMessage[]> {
    if (this.recentMem === null) {
      this.recentMem = (await this.state.storage.get<StoredMessage[]>("recent")) ?? [];
    }
    return this.recentMem;
  }

  private async append(msg: StoredMessage): Promise<void> {
    const buf = await this.ensureRecent();
    buf.push(msg);
    if (buf.length > HISTORY_LIMIT) buf.splice(0, buf.length - HISTORY_LIMIT);
    // No per-message storage.put — recent lives in memory and is snapshotted to
    // storage on each flush (alarm). Saves one durable write per message (cost).

    // E3 (LINEAR-2679): queue for async flush to Supabase as system-of-record.
    // We attach channel_id so the ingest endpoint can route. At-least-once:
    // if the flush fails (or this DO is evicted mid-flush) the row stays in
    // `pending` until the next alarm.
    const channelId = (await this.state.storage.get<string>("channel_id")) ?? "";
    if (channelId) {
      const pending = (await this.state.storage.get<PendingMessage[]>("pending")) ?? [];
      pending.push({ ...msg, channel_id: channelId });
      // Backpressure: if Supabase ingest is stuck, bound the queue (drop-oldest)
      // so a slow sink can't OOM the DO. Losing the oldest few beats losing all.
      if (pending.length > PENDING_MAX) {
        this.droppedPending += pending.length - PENDING_MAX;
        pending.splice(0, pending.length - PENDING_MAX);
      }
      await this.state.storage.put("pending", pending);
      // Schedule an alarm if none is set. setAlarm(absolute ms epoch).
      const cur = await this.state.storage.getAlarm();
      if (cur === null) await this.state.storage.setAlarm(Date.now() + FLUSH_INTERVAL_MS);
      // Burst flush: if we're past the batch cap, drain immediately.
      if (pending.length >= FLUSH_BATCH_MAX) {
        // Fire-and-forget; alarm() is still a safety net if this errors.
        void this.flush().catch(() => {});
      }
    }
  }

  private broadcast(msg: StoredMessage): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch { /* dropped sockets clean themselves up */ }
    }
  }

  /** Durable Object alarm — Cloudflare runs this even if the DO was hibernated.
   *  We use it as the periodic flush trigger (LINEAR-2679). */
  async alarm(): Promise<void> {
    try {
      this.sweepMaps();
      const drained = await this.flush();
      // Snapshot the in-memory recent ring for hibernation recovery (Phase 0.3).
      if (this.recentMem !== null) await this.state.storage.put("recent", this.recentMem);
      // Phase 1: beacon metrics to Supabase (best-effort, never blocks flush).
      void this.beaconMetrics().catch(() => {});
      // Still have pending? Re-arm.
      const left = (await this.state.storage.get<PendingMessage[]>("pending")) ?? [];
      if (left.length > 0) await this.state.storage.setAlarm(Date.now() + FLUSH_INTERVAL_MS);
      // Silent success: drained is logged via Cloudflare observability.
      void drained;
    } catch {
      // On error, re-arm sooner — at-least-once delivery; nothing is lost.
      await this.state.storage.setAlarm(Date.now() + Math.min(15_000, FLUSH_INTERVAL_MS * 2));
    }
  }

  /** Phase 1: POST key DO health metrics to channel0-metrics-ingest every alarm
   *  tick. Fire-and-forget — if the EF is down we just skip the sample. The
   *  channel_id tag lets dashboards slice per-room. */
  private async beaconMetrics(): Promise<void> {
    if (!this.env.SUPABASE_URL || !this.env.CF_INGEST_SECRET) return;
    const channelId = (await this.state.storage.get<string>("channel_id")) ?? "";
    const pending = (await this.state.storage.get<PendingMessage[]>("pending")) ?? [];
    const wsCount = this.state.getWebSockets().length;
    const tags = channelId ? { slug: channelId } : {};

    const metrics = [
      { metric: "ws_count",             value: wsCount,             tags },
      { metric: "pending_depth",        value: pending.length,      tags },
      { metric: "rl_map_size",          value: this.rl.size,        tags },
      { metric: "burst_map_size",       value: this.burst.size,     tags },
      { metric: "repeat_map_size",      value: this.repeat.size,    tags },
      { metric: "dropped_pending",      value: this.droppedPending, tags },
      { metric: "channel_ceiling_count",value: this.channelBucket.count, tags },
    ];

    await fetch(`${this.env.SUPABASE_URL}/functions/v1/channel0-metrics-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.env.CF_INGEST_SECRET}`,
      },
      body: JSON.stringify({ metrics }),
    });
  }

  /** Drain up to FLUSH_BATCH_MAX pending messages to Supabase via
   *  message-ingest-batch. Idempotent: the endpoint upserts by message id.
   *  On success the batch is removed from `pending`. On failure the batch
   *  stays and the alarm will retry. */
  private async flush(): Promise<number> {
    if (!this.env.SUPABASE_URL || !this.env.CF_INGEST_SECRET) return 0;
    const pending = (await this.state.storage.get<PendingMessage[]>("pending")) ?? [];
    if (pending.length === 0) return 0;
    const batch = pending.slice(0, FLUSH_BATCH_MAX);

    const r = await fetch(`${this.env.SUPABASE_URL}/functions/v1/message-ingest-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.env.CF_INGEST_SECRET}`,
      },
      body: JSON.stringify({ messages: batch }),
    });
    if (!r.ok) throw new Error(`ingest failed: ${r.status}`);

    const remaining = pending.slice(batch.length);
    await this.state.storage.put("pending", remaining);
    return batch.length;
  }
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
