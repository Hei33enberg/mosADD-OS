/**
 * mosadd-edge — Cloudflare Worker + Durable Object per channel.
 *
 * E1 (proven LIVE): one ChannelDO per channel name, Hibernatable WS fan-out,
 *   ring buffer of recent messages in DO storage.
 * E2 (this build, LINEAR-2678): edge auth via hub key (mosadd_sk_live_…) +
 *   per-key rate limit (anti-DoS) + DO-local key cache (60s). Calls Supabase
 *   `hub-key-verify` ONLY on cache miss — Supabase isn't on the hot path.
 *
 * Auth model:
 *   - Send: client passes `Authorization: Bearer mosadd_sk_live_…` (or query `?k=…`).
 *   - WebSocket: same, via query `?k=…` (browsers can't send headers on upgrade).
 *   - Free plan = text channels are allowed (mIRC/mROOM text is free). The hard
 *     paid gates (mKB / mTALK) are enforced where the paid product lives.
 *
 * Rate limit:
 *   - Per hub key per minute (token-bucket in DO state, 600/min by default).
 *     Generous: a relay multiplexes many end-users through one key.
 *
 * Not in E2 (next):
 *   - E3 async flush DO → Supabase messages_meta.
 *   - E4 client cut-over (apps/web + mcp + strajk relay).
 *   - E5 DNS chat.mosadd.com via Vercel CNAME.
 */

export interface Env {
  CHANNEL: DurableObjectNamespace;
  /** Supabase project base URL, e.g. https://<ref>.supabase.co
   *  (Set via `wrangler secret put SUPABASE_URL` or via wrangler.toml [vars]). */
  SUPABASE_URL: string;
}

const HISTORY_LIMIT = 100;
const KEY_CACHE_TTL_MS = 60_000; // 60s — fast revocation propagation, big cost saving on hot keys
const RL_PER_MIN = 600; // text rate limit per hub key per minute

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

/** Pulls the API key from Authorization OR ?k= (latter is the only way for browser WS upgrade). */
function extractKey(req: Request, url: URL): string | null {
  const authz = req.headers.get("Authorization") ?? "";
  const fromHeader = authz.replace(/^Bearer\s+/i, "").trim();
  if (fromHeader) return fromHeader;
  const fromQuery = url.searchParams.get("k") ?? "";
  return fromQuery || null;
}

// =============================================================================
// Worker: routes to the right ChannelDO + handles /health.
// =============================================================================
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "mosadd-edge", phase: "E2-auth" });
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

    // ── WS upgrade — auth via ?k= because browsers can't set headers on upgrade
    if (op === "ws") {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "expected_websocket_upgrade" }, { status: 426 });
      const apiKey = extractKey(req, url);
      const entry = await this.verifyKey(apiKey ?? "");
      if (!entry.valid) return json({ error: "invalid_key" }, { status: 401 });
      return this.handleWsUpgrade(entry);
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
  private async handleWsUpgrade(entry: KeyCacheEntry): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    // Tag the socket with the caller so inbound messages are rate-limited per key.
    this.state.acceptWebSocket(server, [entry.hash]);
    return new Response(null, { status: 101, webSocket: client });
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
  }

  private broadcast(msg: StoredMessage): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch { /* dropped sockets clean themselves up */ }
    }
  }
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
