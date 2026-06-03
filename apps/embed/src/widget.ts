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
  /** "inline" (default — chat rendered into the host div as-is) or "launcher"
   *  (collapses to a small "mIRC #channel ● N online" pill; click to expand
   *  into a floating panel). LINEAR-2735/2682-A. */
  mode: "inline" | "launcher";
  /** Where the launcher pill sits when mode=launcher. Ignored otherwise. */
  launcherPosition: "br" | "bl" | "tr" | "tl";
  /** Label shown on the launcher pill, e.g. "mIRC #strajkpolski". Defaults to
   *  `mIRC #${channel}`. */
  launcherLabel?: string;
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
  mode: "inline" as const,
  launcherPosition: "br" as const,
};

/** Poll interval (ms) for the launcher presence count when WS is NOT open.
 *  30s = fresh-enough for a "23 online" badge without bothering the DO too often.
 *  When the chat panel is expanded the WS broadcasts presence frames in
 *  real-time so we clear this poll. */
const PRESENCE_POLL_MS = 30_000;

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
  const mode = (a.mode === "launcher" ? "launcher" : "inline") as "inline" | "launcher";
  const launcherPosition = (() => {
    const v = (a.launcherPosition || DEFAULTS.launcherPosition).toLowerCase();
    return (["br", "bl", "tr", "tl"] as const).includes(v as any) ? (v as "br" | "bl" | "tr" | "tl") : "br";
  })();
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
    mode,
    launcherPosition,
    launcherLabel: a.launcherLabel,
  };
}

/** Read the live presence count over the read-only REST endpoint (no WS needed).
 *  Returns null if the channel is blocked / unreachable. Used by the launcher
 *  pill when the chat panel is collapsed — we want the badge to update without
 *  forcing every page visitor to open a WebSocket. */
async function fetchPresence(
  edgeUrl: string,
  channel: string,
): Promise<{ count: number; status: string } | null> {
  try {
    // edgeUrl is wss://… for WS upgrade; the REST endpoint is http(s)://…
    const httpBase = edgeUrl.replace(/^ws/, "http");
    const r = await fetch(`${httpBase}/c/${encodeURIComponent(channel)}/presence`, {
      method: "GET",
    });
    if (!r.ok) return null;
    const data = await r.json() as { count?: number; status?: string };
    return { count: typeof data.count === "number" ? data.count : 0, status: data.status ?? "open" };
  } catch {
    return null;
  }
}

export class MosaddMircWidget {
  private host: HTMLElement;
  private cfg: WidgetConfig;
  private shadow: ShadowRoot;
  private root!: HTMLDivElement;
  private cardEl!: HTMLDivElement;          // the full chat card (frame + stream + input)
  private streamEl!: HTMLDivElement;
  private joinEl!: HTMLDivElement;
  private inputEl!: HTMLDivElement;
  private badgeEl!: HTMLDivElement;
  private headStatusEl!: HTMLSpanElement;
  // Launcher (mode === "launcher" only). Always-visible pill that toggles the card.
  private launcherEl: HTMLDivElement | null = null;
  private launcherDotEl: HTMLSpanElement | null = null;
  private launcherCountEl: HTMLSpanElement | null = null;
  private panelOpen = false;
  private presencePollHandle: number | null = null;
  private onlineCount = 0;

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
    if (this.cfg.mode === "launcher") {
      this.mountLauncher();
      // Hide the card until clicked. We still build it eagerly so the click
      // expansion is instant; only the WS + presence poll start lazily.
      this.cardEl.style.display = "none";
      // Start lightweight presence polling so the badge shows online count
      // even before the user opens the chat.
      void this.refreshPresence();
      this.presencePollHandle = window.setInterval(() => {
        void this.refreshPresence();
      }, PRESENCE_POLL_MS);
    } else {
      this.restore();
    }
  }

  private mount(): void {
    // In launcher mode the root is fixed-positioned (one of 4 corners); in
    // inline / sidebar / fullscreen / floating-*, m-pos-<x> handles it.
    const rootPos = this.cfg.mode === "launcher"
      ? `m-pos-launcher m-launcher-pos-${this.cfg.launcherPosition}`
      : `m-pos-${this.cfg.position}`;
    this.root = el<HTMLDivElement>("div", `m-root ${rootPos}`);
    const card = el<HTMLDivElement>("div", "m-card");
    this.cardEl = card;

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
    // In launcher mode the header gets an X to collapse back to the pill.
    if (this.cfg.mode === "launcher") {
      const closeBtn = el<HTMLButtonElement>("button", "m-close");
      closeBtn.type = "button";
      closeBtn.innerHTML = "×";
      closeBtn.setAttribute("aria-label", "Close chat");
      closeBtn.addEventListener("click", () => this.collapse());
      head.appendChild(closeBtn);
    }
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

  /** Launcher mode — render a small "mIRC #channel ● 23 online" pill anchored
   *  to one of 4 page corners. Click opens the full chat card. We poll the
   *  read-only `/presence` REST endpoint every 30s so the badge updates even
   *  while the chat is collapsed (no WS — lurkers don't burn DO compute). */
  private mountLauncher(): void {
    const pill = el<HTMLButtonElement>("button", "m-launcher");
    pill.type = "button";

    const dot = el<HTMLSpanElement>("span", "m-launcher-dot");
    const label = el<HTMLSpanElement>("span", "m-launcher-label");
    const labelText = this.cfg.launcherLabel ?? `mIRC #${this.cfg.channel}`;
    label.textContent = labelText;
    const sep = el<HTMLSpanElement>("span", "m-launcher-sep");
    sep.textContent = "·";
    const count = el<HTMLSpanElement>("span", "m-launcher-count");
    count.textContent = "—";

    pill.appendChild(dot);
    pill.appendChild(label);
    pill.appendChild(sep);
    pill.appendChild(count);
    pill.addEventListener("click", () => this.expand());

    this.launcherEl = pill;
    this.launcherDotEl = dot;
    this.launcherCountEl = count;

    // The launcher lives inside the SAME m-root so the corner-position rule
    // applies to both pill and card. CSS swaps which one is visible.
    this.root.appendChild(pill);
  }

  /** Update the launcher count badge from the live presence (REST or WS). */
  private setOnlineCount(n: number): void {
    this.onlineCount = Math.max(0, Math.floor(n));
    if (!this.launcherCountEl) return;
    this.launcherCountEl.textContent =
      this.onlineCount >= 100 ? "99+ online" : `${this.onlineCount} online`;
    if (this.launcherDotEl) {
      this.launcherDotEl.classList.toggle("active", this.onlineCount > 0);
    }
  }

  private async refreshPresence(): Promise<void> {
    if (this.panelOpen) return; // WS is the source of truth when chat is open
    const p = await fetchPresence(this.cfg.edgeUrl, this.cfg.channel);
    if (!p) return;
    this.setOnlineCount(p.count);
  }

  /** Expand the launcher → show the full chat card. If the user already has a
   *  saved nick we auto-join + connect; otherwise the join form prompts. */
  private expand(): void {
    if (this.panelOpen) return;
    this.panelOpen = true;
    if (this.launcherEl) this.launcherEl.style.display = "none";
    this.cardEl.style.display = "";
    this.root.classList.add("m-launcher-open");
    // Stop polling — the WS will broadcast presence in real time once open.
    if (this.presencePollHandle !== null) {
      clearInterval(this.presencePollHandle);
      this.presencePollHandle = null;
    }
    // First open: restore saved nick OR show join form.
    this.restore();
  }

  /** Collapse back to the pill. Keep the WS open if it's connected so
   *  reopening the chat is instant + presence frames keep flowing. */
  private collapse(): void {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.cardEl.style.display = "none";
    if (this.launcherEl) this.launcherEl.style.display = "";
    this.root.classList.remove("m-launcher-open");
    // If WS is closed (user never joined OR it dropped), resume REST polling.
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.presencePollHandle === null) {
        this.presencePollHandle = window.setInterval(() => {
          void this.refreshPresence();
        }, PRESENCE_POLL_MS);
      }
    }
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
    let parsed: { type?: string; count?: number; id?: string } & Partial<Message>;
    try { parsed = JSON.parse(e.data) as any; } catch { return; }
    if (!parsed) return;

    // Presence frame from channel0 ({type:"presence", count, roster}). We update
    // the launcher badge even when the chat panel is open (so the count stays
    // truthful) and ignore the roster array — we don't render it as a sidebar
    // (yet — that's 2682-Q follow-up).
    if (parsed.type === "presence" && typeof parsed.count === "number") {
      this.setOnlineCount(parsed.count);
      return;
    }

    // Regular message frame: {id, ts, from, text}.
    if (!parsed.id || typeof (parsed as Message).text !== "string") return;
    this.renderMessage(parsed as Message);
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
