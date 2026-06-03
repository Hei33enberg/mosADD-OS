// =============================================================================
// MosaddMircWidget — the per-target instance.
//
// Lifecycle:
//   1. Read data-attrs from the host <div>.
//   2. Render <Shadow DOM> with the chosen skin's CSS + base markup (join form).
//   3. Wait for the visitor to type a nick and click "Wejdź" (or auto-join if
//      they were here before and we have a stable sub in localStorage).
//   4. POST mirc-embed-token { pk, channel_id, sub? } → JWT.
//   5. Open WS via Sec-WebSocket-Protocol auth (E6 path).
//   6. Render messages, allow sending, persist nick + sub in localStorage.
//
// Notes on the env / config defaults:
//   - We bake the prod URLs in. A creator can override with `data-mint-url`
//     and `data-edge-url` data-attrs if they want to point a staging embed at
//     a different backend (rare; mostly we self-host).
//
// Notes on isolation:
//   - All DOM lives in a Shadow DOM so host CSS can't bleed in. We attach the
//     skin CSS as a <style> inside the root.
//   - We catch our errors and render them as a system line; we never throw
//     to the host page. A widget failure is silent on the creator's site
//     (besides our own error UI), it never breaks their page JS.
// =============================================================================

import defaultSkinCss from "./skins/default.css";

interface WidgetConfig {
  pk: string;
  channel: string;
  position: string;
  skin: string;
  mintUrl: string;
  edgeUrl: string;
  anon: boolean;
  locale: string;
  title?: string;
}

interface Message {
  id: string;
  ts: number;
  from?: string | null;
  text: string;
}

interface MintResponse {
  token: string;
  expires_in: number;
  channel_id: string;
  scope: string;
  sub: string;
  badge_required: boolean;
}

interface ErrorResponse {
  error: string;
  upgrade_url?: string;
}

const DEFAULTS = {
  mintUrl: "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/mirc-embed-token",
  edgeUrl: "wss://mosadd-edge.mr-brics-33.workers.dev",
  position: "inline",
  skin: "default",
  anon: true,
  locale: "en",
};

const NICK_COLORS = 8;

const I18N: Record<string, Record<string, string>> = {
  en: {
    join_label: "JOIN ANONYMOUSLY — PICK A NICK",
    join_placeholder: "e.g. Jane_from_Boston",
    join_button: "JOIN",
    input_placeholder: "Say something…",
    connecting: "Connecting…",
    queued: "This channel is at capacity. The creator can upgrade for more — please try again later.",
    error_origin: "This domain isn't authorized for this embed.",
    error_key: "This embed key is invalid.",
    sys_joined: "Joined the channel.",
    sys_disconnected: "Disconnected. Reconnecting…",
    powered: "powered by",
  },
  pl: {
    join_label: "DOŁĄCZ ANONIMOWO — PODAJ NICK",
    join_placeholder: "np. Janek_z_Krakowa",
    join_button: "WEJDŹ",
    input_placeholder: "Napisz coś…",
    connecting: "Łączenie…",
    queued: "Kanał osiągnął limit. Twórca może zwiększyć plan — spróbuj później.",
    error_origin: "Ta domena nie jest autoryzowana dla tego embeda.",
    error_key: "Klucz embeda jest nieprawidłowy.",
    sys_joined: "Dołączono do kanału.",
    sys_disconnected: "Rozłączono. Łączenie ponownie…",
    powered: "powered by",
  },
};

function t(locale: string, key: string): string {
  return I18N[locale]?.[key] ?? I18N.en[key] ?? key;
}

/** Stable per-host-page persistent id so a returning visitor keeps the same
 *  sub and we don't double-count them in MAT. We store TWO things:
 *  - nick (visible)
 *  - sub  (random uuid, not visible)
 *  Both keyed by (publishable key + channel) so a creator with multiple embeds
 *  on the same domain gets independent counters per channel. */
function storage(pk: string, channel: string) {
  const root = `mosadd:embed:${pk.slice(0, 24)}:${channel}`;
  return {
    getNick: () => safeRead(`${root}:nick`),
    setNick: (v: string) => safeWrite(`${root}:nick`, v),
    getSub:  () => safeRead(`${root}:sub`),
    setSub:  (v: string) => safeWrite(`${root}:sub`, v),
  };
}
function safeRead(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeWrite(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}

function hashColor(nick: string): number {
  let h = 0;
  for (let i = 0; i < nick.length; i++) {
    h = (h * 31 + nick.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % NICK_COLORS) + 1;
}

function fmtTs(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `[${h}:${m}]`;
}

function el<T extends HTMLElement>(tag: string, className?: string, text?: string): T {
  const node = document.createElement(tag) as T;
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function readConfig(host: HTMLElement, scriptKey: string): WidgetConfig {
  const a = host.dataset;
  return {
    pk: scriptKey,                                                // from the <script data-key>
    channel: a.channel || "default",
    position: (a.position || DEFAULTS.position).toLowerCase(),
    skin: (a.skin || DEFAULTS.skin).toLowerCase(),
    mintUrl: a.mintUrl || DEFAULTS.mintUrl,
    edgeUrl: a.edgeUrl || DEFAULTS.edgeUrl,
    anon: a.anon !== "false",
    locale: (a.locale || DEFAULTS.locale).toLowerCase(),
    title: a.title,
  };
}

export class MosaddMircWidget {
  private host: HTMLElement;
  private cfg: WidgetConfig;
  private shadow: ShadowRoot;
  private root!: HTMLDivElement;
  private streamEl!: HTMLDivElement;
  private joinEl!: HTMLDivElement;
  private inputEl!: HTMLDivElement;
  private badgeEl!: HTMLDivElement;
  private headStatusEl!: HTMLSpanElement;
  private ws: WebSocket | null = null;
  private mint: MintResponse | null = null;
  private nick: string = "";
  private reconnectAttempts = 0;
  private storage: ReturnType<typeof storage>;

  constructor(host: HTMLElement, scriptKey: string) {
    this.host = host;
    this.cfg = readConfig(host, scriptKey);
    this.storage = storage(this.cfg.pk, this.cfg.channel);

    // Shadow DOM keeps the host page's CSS out (and ours out of theirs).
    this.shadow = host.attachShadow({ mode: "open" });

    // Inject the skin CSS as <style> inside the shadow root.
    const css = el<HTMLStyleElement>("style");
    css.textContent = defaultSkinCss;
    this.shadow.appendChild(css);

    this.mount();
    this.restore();
  }

  private mount(): void {
    this.root = el<HTMLDivElement>("div", `m-root m-pos-${this.cfg.position}`);
    const card = el<HTMLDivElement>("div", "m-card");

    // HUD brackets
    for (const c of ["tl", "tr", "bl", "br"]) {
      card.appendChild(el("div", `m-bracket ${c}`));
    }

    // Header
    const head = el<HTMLDivElement>("div", "m-head");
    this.headStatusEl = el<HTMLSpanElement>("span", "m-status connecting");
    const title = el<HTMLSpanElement>("span", "m-title");
    title.innerHTML = `${this.cfg.title ?? "mIRC"} <span class="m-chan">#${escapeHtml(this.cfg.channel)}</span>`;
    head.appendChild(this.headStatusEl);
    head.appendChild(title);
    card.appendChild(head);

    // Stream
    this.streamEl = el<HTMLDivElement>("div", "m-stream");
    card.appendChild(this.streamEl);

    // Join form (initially visible)
    this.joinEl = el<HTMLDivElement>("div", "m-join");
    const joinLabel = el("label", "", t(this.cfg.locale, "join_label"));
    const joinRow = el<HTMLDivElement>("div", "m-row");
    const nickInput = el<HTMLInputElement>("input");
    nickInput.placeholder = t(this.cfg.locale, "join_placeholder");
    nickInput.autocomplete = "off";
    nickInput.maxLength = 32;
    const joinBtn = el<HTMLButtonElement>("button", "m-btn", t(this.cfg.locale, "join_button"));
    nickInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); joinBtn.click(); }
    });
    joinBtn.addEventListener("click", () => this.handleJoin(nickInput.value));
    joinRow.appendChild(nickInput);
    joinRow.appendChild(joinBtn);
    this.joinEl.appendChild(joinLabel);
    this.joinEl.appendChild(joinRow);
    card.appendChild(this.joinEl);

    // Input row (hidden until joined)
    this.inputEl = el<HTMLDivElement>("div", "m-input");
    this.inputEl.style.display = "none";
    const textarea = el<HTMLTextAreaElement>("textarea");
    textarea.placeholder = t(this.cfg.locale, "input_placeholder");
    textarea.rows = 1;
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend(textarea.value);
        textarea.value = "";
      }
    });
    this.inputEl.appendChild(textarea);
    card.appendChild(this.inputEl);

    // Badge (visible until JWT says otherwise)
    this.badgeEl = el<HTMLDivElement>("div", "m-badge");
    this.badgeEl.innerHTML = `${t(this.cfg.locale, "powered")} <a href="https://mosadd.dev" target="_blank" rel="noopener">mosadd</a>`;
    card.appendChild(this.badgeEl);

    this.root.appendChild(card);
    this.shadow.appendChild(this.root);
  }

  private restore(): void {
    const savedNick = this.storage.getNick();
    if (savedNick) {
      // Auto-join with the previous nick.
      this.handleJoin(savedNick);
    }
  }

  private handleJoin(rawNick: string): void {
    const nick = rawNick.trim().slice(0, 32);
    if (!nick) return;
    this.nick = nick;
    this.storage.setNick(nick);

    // Hide join, show input.
    this.joinEl.style.display = "none";
    this.inputEl.style.display = "flex";

    this.sysMessage(t(this.cfg.locale, "sys_joined"));
    void this.connect();
  }

  private async connect(): Promise<void> {
    this.setStatus("connecting");
    try {
      const sub = this.storage.getSub() ?? null;
      const mintBody: Record<string, string> = { pk: this.cfg.pk, channel_id: this.cfg.channel };
      if (sub) mintBody.sub = sub;

      const r = await fetch(this.cfg.mintUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mintBody),
      });
      const data = await r.json().catch(() => null) as MintResponse | ErrorResponse | null;

      if (!r.ok || !data || !("token" in data)) {
        const err = (data as ErrorResponse | null)?.error ?? `http_${r.status}`;
        this.handleMintError(err);
        return;
      }

      this.mint = data;
      this.storage.setSub(data.sub);
      if (!data.badge_required) this.badgeEl.style.display = "none";

      const wsUrl = `${this.cfg.edgeUrl}/c/${encodeURIComponent(this.cfg.channel)}/ws`;
      this.ws = new WebSocket(wsUrl, ["mosadd.v1", `bearer.${data.token}`]);
      this.ws.addEventListener("open", () => {
        this.setStatus("online");
        this.reconnectAttempts = 0;
      });
      this.ws.addEventListener("message", (e) => this.onWsMessage(e));
      this.ws.addEventListener("close", () => this.onWsClose());
      this.ws.addEventListener("error", () => this.setStatus("error"));
    } catch (err) {
      this.handleMintError("network");
    }
  }

  private handleMintError(code: string): void {
    if (code === "plan_exhausted") {
      this.sysMessage(t(this.cfg.locale, "queued"));
    } else if (code === "origin_not_allowed") {
      this.sysMessage(t(this.cfg.locale, "error_origin"));
    } else if (code === "invalid_key") {
      this.sysMessage(t(this.cfg.locale, "error_key"));
    } else {
      this.sysMessage(`error: ${code}`);
    }
    this.setStatus("error");
  }

  private onWsMessage(e: MessageEvent): void {
    if (typeof e.data !== "string") return;
    let m: Message | null = null;
    try { m = JSON.parse(e.data) as Message; } catch { return; }
    if (!m || !m.id) return;
    this.renderMessage(m);
  }

  private onWsClose(): void {
    this.setStatus("connecting");
    this.sysMessage(t(this.cfg.locale, "sys_disconnected"));
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s max.
    const delay = Math.min(16000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts++;
    window.setTimeout(() => { void this.connect(); }, delay);
  }

  private handleSend(rawText: string): void {
    const text = rawText.trim();
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ text, from: this.nick }));
    } catch { /* swallow */ }
  }

  private renderMessage(m: Message): void {
    const wasAtBottom = this.isStreamAtBottom();
    const line = el<HTMLDivElement>("div", "m-msg");
    const nick = m.from ?? "anon";
    line.dataset.nickColor = String(hashColor(nick));

    const tsSpan = el<HTMLSpanElement>("span", "m-ts", fmtTs(m.ts));
    const nickSpan = el<HTMLSpanElement>("span", "m-nick", nick);
    const textSpan = el<HTMLSpanElement>("span", "m-text", m.text);
    line.appendChild(tsSpan);
    line.appendChild(nickSpan);
    line.appendChild(textSpan);

    this.streamEl.appendChild(line);
    if (wasAtBottom) this.scrollToBottom();
  }

  private sysMessage(text: string): void {
    const line = el<HTMLDivElement>("div", "m-sys", text);
    this.streamEl.appendChild(line);
    this.scrollToBottom();
  }

  private setStatus(s: "connecting" | "online" | "error"): void {
    this.headStatusEl.className = `m-status ${s}`;
  }

  private isStreamAtBottom(): boolean {
    const el = this.streamEl;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  private scrollToBottom(): void {
    this.streamEl.scrollTop = this.streamEl.scrollHeight;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === '"' ? "&quot;" : "&#39;"
  ));
}
