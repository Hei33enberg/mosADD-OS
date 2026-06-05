// mosadd-dark — current mURL look (terminal black + neon green).
// Default skin; the base layer already supplies these values, but we ship the
// explicit selector so the picker preview/toggle works cleanly.
export const MOSADD_DARK_CSS = `
:root[data-murl-skin="mosadd-dark"],
:host([data-murl-skin="mosadd-dark"]),
.m-root[data-murl-skin="mosadd-dark"] {
  --m-bg: #000000;
  --m-fg: #f2f2f2;
  --m-fg-muted: rgba(255,255,255,0.55);
  --m-card: #0a0a0a;
  --m-card-fg: #f2f2f2;
  --m-primary: #00ff7a;
  --m-primary-fg: #000000;
  --m-accent: #00ff7a;
  --m-border: rgba(255,255,255,0.2);
  --m-danger: #ff5577;
  --m-warning: #ffd23f;
  --m-info: #5fb4ff;
  --m-radius: 0;
  --m-font-sans: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-nick-1: #00ff7a; --m-nick-2: #5fb4ff; --m-nick-3: #ff7adf; --m-nick-4: #ffd23f;
  --m-nick-5: #ffa14a; --m-nick-6: #a2ff5e; --m-nick-7: #c08bff; --m-nick-8: #ff5577;
  --m-grid: rgba(0,255,122,0.06);
  --m-scanline: rgba(0,0,0,0.22);
  --m-glow: rgba(0,255,122,0.45);
}
`;
