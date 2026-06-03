// Brutalist mIRC styles. Used by content (shadow root) + sidepanel.
export const CHAT_CSS = `
.c0-chat { position: relative; display: flex; flex-direction: column; overflow: hidden;
  background: #0a0a0a; color: #fff; font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px; height: 100%; min-height: 0; }
.c0-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(0,255,122,0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,122,0.12) 1px, transparent 1px);
  background-size: 28px 28px; }
.c0-chat > :not(.c0-bg) { position: relative; z-index: 1; }
.c0-head { display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: #000; color: #fff; border-bottom: 2px solid #fff; }
.c0-head-title { font-weight: 900; letter-spacing: 0.06em; font-size: 13px;
  min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c0-head-title .c0-mirc { color: #fff; }
.c0-head-title .c0-domain { color: #00ff7a; margin-left: 4px;
  font-family: ui-monospace, Menlo, Consolas, monospace; }
.c0-head-live { margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(255,255,255,0.6); }
.c0-head-live .c0-dot { width: 6px; height: 6px; border-radius: 3px;
  background: #00ff7a; animation: c0-pulse 1.5s ease-in-out infinite; }
@keyframes c0-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.c0-head-spacer { flex: 1; }
.c0-head-btn { background: transparent; color: #fff;
  border: 2px solid rgba(255,255,255,0.3); padding: 4px; cursor: pointer; line-height: 0; }
.c0-head-btn:hover { background: rgba(255,255,255,0.1); }
.c0-head-btn.is-active { background: #00ff7a; border-color: #00ff7a; color: #000; }
.c0-head-btn svg { width: 14px; height: 14px; display: block; }
.c0-notice { padding: 8px 12px; font-size: 11.5px; line-height: 1.4;
  color: #c4c4c4; background: rgba(0,0,0,0.7); border-bottom: 2px solid #fff; }
.c0-notice b { color: #00ff7a; font-weight: 700; }
.c0-feed { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
  font-family: ui-monospace, Menlo, Consolas, monospace; }
.c0-row { display: flex; gap: 6px; align-items: baseline; font-size: 13px; }
.c0-time { color: #888; font-size: 11px; flex-shrink: 0; min-width: 44px; }
.c0-nick { font-weight: 700; color: #00ff7a; flex-shrink: 0; white-space: nowrap; }
.c0-nick.is-me { color: #fff; }
.c0-text { color: #fff; word-break: break-word; white-space: pre-wrap; flex: 1; min-width: 0; }
.c0-system .c0-text { color: #888; font-style: italic; }
.c0-prejoin { margin-top: auto; background: #000; border-top: 2px solid #fff; padding: 14px 12px; }
.c0-prejoin-label { display: block; margin-bottom: 8px;
  font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.85); }
.c0-prejoin-row { display: flex; gap: 6px; align-items: stretch; }
.c0-prejoin-row input { flex: 1; background: #fff; color: #0a0a0a; border: 2px solid #fff;
  padding: 8px 10px; font-size: 14px; outline: none; }
.c0-prejoin-row input:focus { box-shadow: 0 0 0 2px #00ff7a inset; }
.c0-prejoin-row input::placeholder { color: rgba(10,10,10,0.4); }
.c0-prejoin-go { flex-shrink: 0; background: #00ff7a; color: #000;
  border: 2px solid #fff; padding: 0 16px; font-size: 13px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; line-height: 1; }
.c0-prejoin-go:hover { background: #fff; color: #00ff7a; }
.c0-prejoin-alt { display: inline-block; margin-top: 10px;
  font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em;
  color: #00ff7a; text-decoration: underline; }
.c0-prejoin-alt:hover { color: #fff; }
.c0-compose { display: flex; gap: 6px; padding: 10px; background: #000; border-top: 2px solid #fff; }
.c0-compose input { flex: 1; background: #fff; color: #0a0a0a; border: 2px solid #fff;
  padding: 8px 10px; font-size: 14px; outline: none; }
.c0-compose input:focus { box-shadow: 0 0 0 2px #00ff7a inset; }
.c0-compose input::placeholder { color: rgba(10,10,10,0.4); }
.c0-compose button { flex-shrink: 0; background: #00ff7a; color: #000;
  border: 2px solid #fff; padding: 0 16px; font-size: 13px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; line-height: 1; }
.c0-compose button:hover:not(:disabled) { background: #fff; color: #00ff7a; }
.c0-compose button:disabled { opacity: 0.4; cursor: not-allowed; }
`;
