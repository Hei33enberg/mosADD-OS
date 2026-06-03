/**
 * mosadd-edge — Cloudflare Worker + Durable Object per channel.
 *
 * Architecture (LINEAR-2675, plan file "SCALE ARCHITECTURE"):
 *   Worker = edge router. `GET /c/:id/ws` upgrades to WebSocket on that channel's
 *   DO. `POST /c/:id/send` appends + broadcasts.
 *   ChannelDO = one DO instance per channel name. Holds connected WS clients,
 *   a recent-messages ring buffer in DO storage, and broadcasts new messages
 *   to every connected socket. Uses Hibernatable WebSockets — idle sockets
 *   don't bill, only message traffic does.
 *
 * What this Worker INTENTIONALLY does not do yet (it's E1 = prototype):
 *   - Auth (E2 will add hub-key check + meter).
 *   - Persistence to Supabase as system-of-record (E3 async flush).
 *   - Production routing (E5 — DNS chat.mosadd.com via Vercel CNAME).
 *
 * Why a DO per channel: each channel runs on its own globally-scheduled DO
 * instance. 1M concurrent writers spread across N channels = N parallel DOs,
 * no contention. The old "everything writes one Postgres" hot-spot disappears.
 */

export interface Env {
  CHANNEL: DurableObjectNamespace;
}

const HISTORY_LIMIT = 100; // recent messages retained in DO storage for late joiners

const json = (b: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(b), {
    ...init,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...(init.headers ?? {}) },
  });

const CORS_PREFLIGHT_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

/** Worker: routes a request to the right ChannelDO instance. */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "mosadd-edge", phase: "E1-prototype" });
    }

    // /c/:channelId/{ws,send,history}
    const m = url.pathname.match(/^\/c\/([A-Za-z0-9_-]{1,128})\/(ws|send|history)$/);
    if (!m) return json({ error: "not_found" }, { status: 404 });
    const [, channelId, op] = m;

    // One DO instance per channel name. idFromName is deterministic + global.
    const stub = env.CHANNEL.get(env.CHANNEL.idFromName(channelId));
    return stub.fetch(req);
  },
};

// =============================================================================
// ChannelDO — one instance per channel; holds WS clients + recent message ring.
// =============================================================================

interface StoredMessage {
  id: string;
  ts: number; // ms epoch — server-stamped, used for ordering + late-joiner replay
  from?: string | null; // sender hint (E2 will validate via hub key)
  text: string; // alpha: plain UTF-8; E2/E3 will move to encrypted_payload parity
}

export class ChannelDO {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /** Entry point for every request the Worker routes to this DO instance. */
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const op = url.pathname.split("/").pop() ?? "";

    if (op === "ws") {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "expected_websocket_upgrade" }, { status: 426 });
      return this.handleWsUpgrade();
    }

    if (op === "send" && req.method === "POST") {
      const body = await req.json().catch(() => null) as { text?: string; from?: string } | null;
      const text = typeof body?.text === "string" ? body.text.slice(0, 64_000) : "";
      if (!text) return json({ error: "text_required" }, { status: 400 });
      const msg: StoredMessage = { id: crypto.randomUUID(), ts: Date.now(), from: body?.from ?? null, text };
      await this.append(msg);
      this.broadcast(msg);
      return json({ ok: true, id: msg.id, ts: msg.ts });
    }

    if (op === "history") {
      const limit = Math.max(1, Math.min(HISTORY_LIMIT, Number(url.searchParams.get("limit") ?? "50")));
      const buf = (await this.state.storage.get<StoredMessage[]>("recent")) ?? [];
      return json({ messages: buf.slice(-limit) });
    }

    return json({ error: "not_found" }, { status: 404 });
  }

  /** Accept a WebSocket connection. Hibernatable: server doesn't bill while idle. */
  private async handleWsUpgrade(): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    // Hibernatable WS: socket stays attached to the DO across hibernation; we get
    // webSocketMessage/Close callbacks even if the DO was evicted between events.
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  // ── Hibernatable WebSocket lifecycle ─────────────────────────────────────
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return; // alpha: text only
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

  // ── State ────────────────────────────────────────────────────────────────
  private async append(msg: StoredMessage): Promise<void> {
    const buf = (await this.state.storage.get<StoredMessage[]>("recent")) ?? [];
    buf.push(msg);
    if (buf.length > HISTORY_LIMIT) buf.splice(0, buf.length - HISTORY_LIMIT);
    await this.state.storage.put("recent", buf);
  }

  private broadcast(msg: StoredMessage): void {
    const payload = JSON.stringify(msg);
    // getWebSockets() returns all sockets accepted via acceptWebSocket(), even
    // if the DO was evicted between events (hibernation-aware).
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch { /* dropped sockets clean themselves up */ }
    }
  }
}
