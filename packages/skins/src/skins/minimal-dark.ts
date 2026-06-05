// minimal-dark — neutral grayscale dark. Brand-quiet, default-safe alternative
// to mosadd-dark. Ported in spirit from apps/embed/src/skins/minimal-dark.css.
export const MINIMAL_DARK_CSS = `
:root[data-murl-skin="minimal-dark"],
:host([data-murl-skin="minimal-dark"]),
.m-root[data-murl-skin="minimal-dark"] {
  --m-bg: #111111;
  --m-fg: #ededed;
  --m-fg-muted: rgba(237,237,237,0.55);
  --m-card: #1a1a1a;
  --m-card-fg: #ededed;
  --m-primary: #ededed;
  --m-primary-fg: #111111;
  --m-accent: #b0b0b0;
  --m-border: rgba(255,255,255,0.14);
  --m-danger: #ff7a8a;
  --m-warning: #ffce4a;
  --m-info: #74b4ff;
  --m-radius: 0.5rem;
  --m-font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-nick-1: #ededed; --m-nick-2: #b0b0b0; --m-nick-3: #74b4ff; --m-nick-4: #ffce4a;
  --m-nick-5: #ff8ec9; --m-nick-6: #a2ff5e; --m-nick-7: #c08bff; --m-nick-8: #ff7a8a;
  --m-grid: rgba(255,255,255,0.04);
  --m-scanline: transparent;
  --m-glow: transparent;
}
`;
