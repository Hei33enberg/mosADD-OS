// Shared CSS for the chat shell — used by content (shadow root) and sidepanel.
export const CHAT_CSS = `
.c0-chat {
  position: relative;
  display: flex; flex-direction: column; overflow: hidden;
  background: #0a0a0a; color: #e6e6e6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 14px; line-height: 1.4;
  height: 100%; min-height: 0;
}
/* mosadd grid backdrop — subtle 16px lattice with vignette */
.c0-bg {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(0, 255, 122, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 122, 0.05) 1px, transparent 1px);
  background-size: 16px 16px;
  mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0.35) 100%);
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0.35) 100%);
}
.c0-chat > :not(.c0-bg) { position: relative; z-index: 1; }

.c0-head { padding: 10px 12px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 8px; background: rgba(10, 10, 10, 0.85); }
.c0-title { font-weight: 700; }
.c0-domain { color: #00ff7a; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; }
.c0-count { margin-left: auto; color: #888; font-size: 12px; }
.c0-close { background: none; border: none; color: #888; cursor: pointer; padding: 4px 6px; font-size: 14px; }
.c0-close:hover { color: #fff; }

.c0-notice { padding: 8px 12px; font-size: 12px; color: #c4c4c4; background: rgba(17, 17, 17, 0.85); border-bottom: 1px solid #1a1a1a; }
.c0-notice b { color: #00ff7a; font-weight: 600; }

.c0-feed { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
.c0-row { display: flex; gap: 8px; align-items: flex-start; }
.c0-av { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #000; }
.c0-bubble { flex: 1; min-width: 0; }
.c0-who { font-size: 11px; color: #888; }
.c0-who .c0-me { color: #00ff7a; }
.c0-text { word-wrap: break-word; word-break: break-word; white-space: pre-wrap; }
.c0-system { font-style: italic; color: #888; }

.c0-compose { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #1a1a1a; background: rgba(10, 10, 10, 0.85); }
.c0-compose input {
  flex: 1; background: #111; color: #e6e6e6; border: 1px solid #1a1a1a;
  border-radius: 6px; padding: 8px 10px; font-size: 14px; outline: none;
}
.c0-compose input:focus { border-color: #00ff7a; }
.c0-compose button {
  background: #00ff7a; color: #000; border: none; border-radius: 6px;
  padding: 8px 12px; font-weight: 700; cursor: pointer;
}
.c0-compose button:disabled { background: #555; cursor: not-allowed; }

.c0-footer {
  padding: 6px 12px; font-size: 11px; color: #555; border-top: 1px solid #1a1a1a;
  display: flex; align-items: center; justify-content: space-between; background: rgba(10, 10, 10, 0.85);
}
.c0-brand { color: #00ff7a; font-weight: 700; }
`;
