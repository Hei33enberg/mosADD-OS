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
const KEY_CACHE_TTL_MS = 60_000; // 60s — fast revocation propagation, big cost saving on hot keys
const RL_PER_MIN = 600; // text rate limit per hub key per minute
const FLUSH_INTERVAL_MS = 5_000; // E3: how often the DO drains its pending queue
const FLUSH_BATCH_MAX = 500;     // matches the ingest endpoint cap

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

    const m = url.pathname.match(/^\/c\/([A-Za-z0-9_-]{1,128})\/(ws|send|history)$/);
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
interface KeyCacheEntry { hash: string; valid: boolean; user_id?: string; plan?: string; exp: number; }
interface RLBucket { count: number; window_start: number; }

export class ChannelDO {
  private state: DurableObjectState;
  private env: Env;
  /** In-memory key cache (cleared on hibernation; falls back to fresh verify). */
  private keyCache = new Map<string, KeyCacheEntry>();
  private rl = new Map<string, RLBucket>();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
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
  private checkRateLimit(keyHash: string): { ok: boolean; retry_after?: number } {
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    const b = this.rl.get(keyHash);
    if (!b || b.window_start !== minute) {
      this.rl.set(keyHash, { count: 1, window_start: minute });
      return { ok: true };
    }
    b.count += 1;
    if (b.count > RL_PER_MIN) return { ok: false, retry_after: 60 - Math.floor((now % 60_000) / 1000) };
    return { ok: true };
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

      // (1) Scoped JWT via Sec-WebSocket-Protocol — the recommended path.
      const jwt = extractScopedJwt(req);
      if (jwt && this.env.CHANNEL_TOKEN_SECRET) {
        const v = await verifyScopedJwt(jwt, this.env.CHANNEL_TOKEN_SECRET, channelId);
        if (!v.ok) return json({ error: "invalid_token", reason: v.reason }, { status: 401 });
        // For rate-limiting we tag by sub (the end-user) — generous limits handle
        // the relay-multiplexes-many-users case at the mint endpoint, not here.
        const entry: KeyCacheEntry = {
          hash: await sha256Hex(`jwt:${v.claims.sub}`),
          valid: true,
          user_id: v.claims.sub,
          plan: v.claims.plan ?? "free",
          exp: v.claims.exp * 1000,
        };
        return this.handleWsUpgrade(entry, /*echoProto*/ "mosadd.v1");
      }

      // (2,3) Hub key fallback (header preferred, ?k= deprecated).
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });
      return this.handleWsUpgrade(entry, null);
    }

    if (op === "send" && req.method === "POST") {
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });

      const rl = this.checkRateLimit(entry.hash);
      if (!rl.ok) return json({ error: "rate_limited", retry_after: rl.retry_after }, { status: 429 });

      const body = await req.json().catch(() => null) as { text?: string; from?: string } | null;
      const text = typeof body?.text === "string" ? body.text.slice(0, 64_000) : "";
      if (!text) return json({ error: "text_required" }, { status: 400 });
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
      const buf = (await this.state.storage.get<StoredMessage[]>("recent")) ?? [];
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
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    // Tag the socket with the caller so inbound messages are rate-limited per identity.
    this.state.acceptWebSocket(server, [entry.hash]);
    const headers = echoProto ? { "Sec-WebSocket-Protocol": echoProto } : undefined;
    return new Response(null, { status: 101, webSocket: client, headers });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    // Recover the caller's key-hash tag (set on acceptWebSocket).
    const tags = this.state.getTags(ws) ?? [];
    const keyHash = tags[0] ?? "anon";
    const rl = this.checkRateLimit(keyHash);
    if (!rl.ok) { try { ws.send(JSON.stringify({ error: "rate_limited", retry_after: rl.retry_after })); } catch {} return; }

    let parsed: { text?: string; from?: string } | null = null;
    try { parsed = JSON.parse(message); } catch { /* ignore garbage */ }
    const text = typeof parsed?.text === "string" ? parsed.text.slice(0, 64_000) : "";
    if (!text) return;
    const msg: StoredMessage = { id: crypto.randomUUID(), ts: Date.now(), from: parsed?.from ?? null, text };
    await this.append(msg);
    this.broadcast(msg);
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean): Promise<void> {
    try { ws.close(code, "closing"); } catch { /* idempotent */ }
  }

  async webSocketError(_ws: WebSocket, _err: unknown): Promise<void> { /* swallow */ }

  // ── State ─────────────────────────────────────────────────────────────────
  private async append(msg: StoredMessage): Promise<void> {
    const buf = (await this.state.storage.get<StoredMessage[]>("recent")) ?? [];
    buf.push(msg);
    if (buf.length > HISTORY_LIMIT) buf.splice(0, buf.length - HISTORY_LIMIT);
    await this.state.storage.put("recent", buf);

    // E3 (LINEAR-2679): queue for async flush to Supabase as system-of-record.
    // We attach channel_id so the ingest endpoint can route. At-least-once:
    // if the flush fails (or this DO is evicted mid-flush) the row stays in
    // `pending` until the next alarm.
    const channelId = (await this.state.storage.get<string>("channel_id")) ?? "";
    if (channelId) {
      const pending = (await this.state.storage.get<PendingMessage[]>("pending")) ?? [];
      pending.push({ ...msg, channel_id: channelId });
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
      const drained = await this.flush();
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
