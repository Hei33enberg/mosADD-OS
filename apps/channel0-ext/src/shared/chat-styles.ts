// Chat panel CSS — tokenized via @mosadd/skins.
// Every color/font literal is now `var(--m-*, fallback)`. The fallback is the
// classic mosadd-dark look, so the panel renders correctly even before a skin
// stylesheet is injected (defensive: fresh installs, race during bootstrap).
//
// The skin <style> is injected in content/index.ts buildStyles() + apply via
// `@mosadd/skins/runtime/extension`. This file no longer holds brand colors.
export const CHAT_CSS = `
.c0-chat { position: relative; display: flex; flex-direction: column; overflow: hidden;
  background: var(--m-bg, #000); color: var(--m-fg, #fff);
  font-family: var(--m-font-mono, ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace);
  font-size: 12px; line-height: 1.45; height: 100%; min-height: 0; }
.c0-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(var(--m-grid, rgba(0,255,122,0.06)) 1px, transparent 1px),
    linear-gradient(90deg, var(--m-grid, rgba(0,255,122,0.06)) 1px, transparent 1px);
  background-size: 24px 24px; }
.c0-chat > :not(.c0-bg) { position: relative; z-index: 1; }

/* HEADER — tight, mono, no extra padding. */
.c0-head { display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; min-height: 26px;
  background: var(--m-bg, #000); color: var(--m-fg, #fff);
  border-bottom: 1px solid var(--m-border, rgba(255,255,255,0.2)); }
.c0-head-title { font-weight: 700; letter-spacing: 0.04em; font-size: 12px;
  min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px; }
.c0-head-title .c0-mirc { color: var(--m-fg-muted, rgba(255,255,255,0.55)); text-transform: lowercase; }
.c0-head-title .c0-domain { color: var(--m-primary, #00ff7a); }
.c0-head-live { display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; color: var(--m-fg-muted, rgba(255,255,255,0.4)); margin-left: 6px;
  text-transform: uppercase; letter-spacing: 0.06em; }
.c0-head-live .c0-dot { width: 5px; height: 5px; border-radius: 50%;
  background: var(--m-primary, #00ff7a); box-shadow: 0 0 4px var(--m-glow, #00ff7a);
  animation: c0-pulse 1.6s ease-in-out infinite; }
@keyframes c0-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.c0-head-spacer { flex: 1; }
.c0-head-btn { background: transparent; color: var(--m-fg-muted, rgba(255,255,255,0.5));
  border: 1px solid var(--m-border, rgba(255,255,255,0.15));
  width: 20px; height: 20px; padding: 0; cursor: pointer; line-height: 0;
  display: inline-flex; align-items: center; justify-content: center; }
.c0-head-btn:hover { color: var(--m-fg, #fff); border-color: var(--m-primary, #00ff7a); }
.c0-head-btn.is-active { background: var(--m-primary, #00ff7a); border-color: var(--m-primary, #00ff7a); color: var(--m-primary-fg, #000); }
.c0-head-btn svg { width: 11px; height: 11px; display: block; }

/* DISCLAIMER — one tight line, low contrast. */
.c0-notice { padding: 5px 10px; font-size: 10px; line-height: 1.4;
  color: var(--m-fg-muted, rgba(255,255,255,0.4)); background: var(--m-card, rgba(0,0,0,0.85));
  border-bottom: 1px solid var(--m-border, rgba(255,255,255,0.08));
  letter-spacing: 0.01em; }
.c0-notice b { color: var(--m-primary, rgba(0,255,122,0.85)); font-weight: 600; }

/* FEED — irc style, tight rows. */
.c0-feed { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px;
  display: flex; flex-direction: column; gap: 2px; }
.c0-row { display: flex; gap: 6px; align-items: baseline; font-size: 12px; position: relative; }
.c0-time { color: var(--m-fg-muted, rgba(255,255,255,0.3)); font-size: 10px; flex-shrink: 0; min-width: 38px; }
.c0-nick { font-weight: 700; color: var(--m-primary, #00ff7a); flex-shrink: 0; white-space: nowrap; }
.c0-nick.is-me { color: var(--m-fg, #fff); }
.c0-nick.is-host { color: var(--m-warning, #ffd23f); }
.c0-text { color: var(--m-fg, #fff); word-break: break-word; white-space: pre-wrap; flex: 1; min-width: 0; }
.c0-system .c0-nick { color: var(--m-fg-muted, rgba(255,255,255,0.3)); }
.c0-system .c0-text { color: var(--m-fg-muted, rgba(255,255,255,0.45)); font-style: italic; }

/* PRE-JOIN — compact, sharp corners, hud feel. */
.c0-prejoin { margin-top: auto; padding: 8px;
  background: var(--m-bg, #000); border-top: 1px solid var(--m-border, rgba(255,255,255,0.2)); }
.c0-prejoin-label { display: block; margin-bottom: 6px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--m-fg-muted, rgba(255,255,255,0.5)); }
.c0-prejoin-row { display: flex; gap: 4px; align-items: stretch; }
.c0-prejoin-row input { flex: 1; min-width: 0;
  background: var(--m-card, rgba(255,255,255,0.04)); color: var(--m-fg, #fff);
  border: 1px solid var(--m-border, rgba(255,255,255,0.2));
  padding: 5px 8px; font-size: 12px; outline: none;
  font-family: inherit; }
.c0-prejoin-row input:focus { border-color: var(--m-primary, #00ff7a); }
.c0-prejoin-row input::placeholder { color: var(--m-fg-muted, rgba(255,255,255,0.25)); }
.c0-prejoin-go { flex-shrink: 0;
  background: var(--m-primary, #00ff7a); color: var(--m-primary-fg, #000);
  border: 1px solid var(--m-primary, #00ff7a); padding: 0 12px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; font-family: inherit; }
.c0-prejoin-go:hover { background: var(--m-fg, #fff); border-color: var(--m-fg, #fff); color: var(--m-bg, #000); }
.c0-prejoin-alt { display: inline-block; margin-top: 6px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--m-primary, rgba(0,255,122,0.75));
  text-decoration: none; border-bottom: 1px solid var(--m-primary, rgba(0,255,122,0.4)); }
.c0-prejoin-alt:hover { color: var(--m-accent, #00ff7a); border-color: var(--m-accent, #00ff7a); }

/* COMPOSE (joined state) — same compact treatment. */
.c0-compose { display: flex; gap: 4px; padding: 8px 10px; background: var(--m-bg, #000);
  border-top: 1px solid var(--m-border, rgba(255,255,255,0.2)); }
.c0-compose input { flex: 1; min-width: 0;
  background: var(--m-card, rgba(255,255,255,0.04)); color: var(--m-fg, #fff);
  border: 1px solid var(--m-border, rgba(255,255,255,0.2));
  padding: 6px 8px; font-size: 12px; outline: none;
  font-family: inherit; }
.c0-compose input:focus { border-color: var(--m-primary, #00ff7a); }
.c0-compose input::placeholder { color: var(--m-fg-muted, rgba(255,255,255,0.25)); }
.c0-compose .c0-send,
.c0-compose button { flex-shrink: 0;
  background: var(--m-primary, #00ff7a); color: var(--m-primary-fg, #000);
  border: 1px solid var(--m-primary, #00ff7a); padding: 0 12px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  cursor: pointer; font-family: inherit; }
.c0-compose button:hover:not(:disabled) { background: var(--m-fg, #fff); border-color: var(--m-fg, #fff); color: var(--m-bg, #000); }
.c0-compose button:disabled { opacity: 0.3; cursor: not-allowed; }

/* Branding (C2-2) - official badge + pinned message. */
.c0-badge { display: inline-block; margin-left: 8px; padding: 1px 5px;
  background: var(--m-primary, rgba(0,255,122,0.18)); color: var(--m-primary-fg, #00ff7a);
  border: 1px solid var(--m-primary, rgba(0,255,122,0.4));
  font-size: 8.5px; font-weight: 900; letter-spacing: 0.12em;
  text-transform: uppercase; vertical-align: middle; }
.c0-pin { padding: 8px 12px; background: var(--m-card, rgba(0,255,122,0.05));
  border-bottom: 1px solid var(--m-border, rgba(0,255,122,0.25));
  font-size: 11.5px; color: var(--m-fg, #fff); line-height: 1.45; }
.c0-pin-body { white-space: pre-wrap; word-break: break-word; }

/* Footer — brand billboard (the "powered by mosadd" impression). */
.c0-footer { display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 10px; background: var(--m-bg, #000);
  border-top: 1px solid var(--m-border, rgba(255,255,255,0.12));
  font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; }
.c0-foot-you { color: var(--m-fg-muted, rgba(255,255,255,0.4)); min-width: 0; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; }
.c0-foot-you b { color: var(--m-fg, rgba(255,255,255,0.7)); }
.c0-foot-brand { color: var(--m-primary, #00ff7a); font-weight: 700; text-decoration: none; white-space: nowrap; }
.c0-foot-brand:hover { text-decoration: underline; }

/* Report button — appears on row hover. */
.c0-rep { opacity: 0; transition: opacity 120ms; margin-left: auto;
  background: transparent; border: 1px solid var(--m-border, rgba(255,255,255,0.15));
  color: var(--m-fg-muted, rgba(255,255,255,0.4)); font-family: inherit;
  width: 18px; height: 18px; padding: 0; cursor: pointer; line-height: 0;
  font-size: 11px; font-weight: 700; }
.c0-row:hover .c0-rep { opacity: 1; }
.c0-rep:hover { color: var(--m-danger, #ff5577); border-color: var(--m-danger, #ff5577); }
.c0-rep:disabled { opacity: 0.4 !important; cursor: default;
  color: var(--m-primary, rgba(0,255,122,0.7)); border-color: var(--m-primary, rgba(0,255,122,0.4)); }
`;
