// Injected CSS, isolated inside the shadow root so host-page styles can't
// touch our panel and vice versa. Light/dark via prefers-color-scheme.
export const PANEL_CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
.toggle {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
  width: 56px; height: 56px; border-radius: 28px;
  background: #0a0a0a; color: #00ff7a; border: 1px solid #1a1a1a;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px; letter-spacing: .5px;
}
.toggle:hover { background: #111; }
.toggle .dot { width: 8px; height: 8px; border-radius: 4px; background: #00ff7a; margin-right: 6px; }
.toggle.has-people { box-shadow: 0 0 0 2px #00ff7a inset, 0 8px 24px rgba(0,0,0,.35); }
.panel {
  position: fixed; right: 16px; bottom: 84px; z-index: 2147483647;
  width: 360px; max-height: 520px; height: 70vh;
  background: #0a0a0a; color: #e6e6e6; border: 1px solid #1a1a1a;
  border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,.5);
  font-size: 14px; line-height: 1.4;
}
.head { padding: 10px 12px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 8px; }
.head .title { font-weight: 700; }
.head .domain { color: #00ff7a; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; }
.head .count { margin-left: auto; color: #888; font-size: 12px; }
.head .close { background: none; border: none; color: #888; cursor: pointer; padding: 4px 6px; }
.notice { padding: 8px 12px; font-size: 12px; color: #c4c4c4; background: #111; border-bottom: 1px solid #1a1a1a; }
.notice b { color: #00ff7a; }
.feed { flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; gap: 8px; align-items: flex-start; }
.av { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #000; }
.bubble { flex: 1; min-width: 0; }
.who { font-size: 11px; color: #888; }
.who .me { color: #00ff7a; }
.text { word-wrap: break-word; word-break: break-word; white-space: pre-wrap; }
.system { font-style: italic; color: #888; }
.compose { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #1a1a1a; }
.compose input {
  flex: 1; background: #111; color: #e6e6e6; border: 1px solid #1a1a1a;
  border-radius: 6px; padding: 8px 10px; font-size: 14px; outline: none;
}
.compose input:focus { border-color: #00ff7a; }
.compose button {
  background: #00ff7a; color: #000; border: none; border-radius: 6px;
  padding: 8px 12px; font-weight: 700; cursor: pointer;
}
.compose button:disabled { background: #555; cursor: not-allowed; }
.footer {
  padding: 6px 12px; font-size: 11px; color: #555; border-top: 1px solid #1a1a1a;
  display: flex; align-items: center; justify-content: space-between;
}
.footer .brand { color: #00ff7a; font-weight: 700; }
`;
