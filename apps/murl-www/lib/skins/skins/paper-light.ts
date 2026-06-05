// paper-light — bright, paper-like, easy on the eyes. For non-techies.
// High contrast text on warm off-white, brand green deepened for AA contrast.
export const PAPER_LIGHT_CSS = `
:root[data-murl-skin="paper-light"],
:host([data-murl-skin="paper-light"]),
.m-root[data-murl-skin="paper-light"] {
  --m-bg: #f6f4ee;
  --m-fg: #1a1a1a;
  --m-fg-muted: rgba(26,26,26,0.55);
  --m-card: #ffffff;
  --m-card-fg: #1a1a1a;
  --m-primary: #1f7a4e;
  --m-primary-fg: #ffffff;
  --m-accent: #1f7a4e;
  --m-border: rgba(26,26,26,0.18);
  --m-danger: #c83a4b;
  --m-warning: #c98a14;
  --m-info: #1d6dcc;
  --m-radius: 0.5rem;
  --m-font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-nick-1: #1f7a4e; --m-nick-2: #1d6dcc; --m-nick-3: #b53a9e; --m-nick-4: #b08200;
  --m-nick-5: #c95a1c; --m-nick-6: #2f9450; --m-nick-7: #6f3fb4; --m-nick-8: #c83a4b;
  --m-grid: rgba(31,122,78,0.05);
  --m-scanline: transparent;
  --m-glow: rgba(31,122,78,0.30);
}
`;
