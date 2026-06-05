// glass — translucent surfaces over a deep blue gradient. Premium feel.
// Note: actual backdrop-blur lives in the consumer CSS; this skin just supplies
// hsla-ish surface colors that look right against a dark page.
export const GLASS_CSS = `
:root[data-murl-skin="glass"],
:host([data-murl-skin="glass"]),
.m-root[data-murl-skin="glass"] {
  --m-bg: #0a0f1c;
  --m-fg: #f0f4ff;
  --m-fg-muted: rgba(240,244,255,0.62);
  --m-card: rgba(255,255,255,0.06);
  --m-card-fg: #f0f4ff;
  --m-primary: #67c1ff;
  --m-primary-fg: #08111f;
  --m-accent: #a78bff;
  --m-border: rgba(255,255,255,0.16);
  --m-danger: #ff7d8d;
  --m-warning: #ffd06b;
  --m-info: #67c1ff;
  --m-radius: 1rem;
  --m-font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-nick-1: #67c1ff; --m-nick-2: #a78bff; --m-nick-3: #ff8ec9; --m-nick-4: #ffd06b;
  --m-nick-5: #79ffcb; --m-nick-6: #c0a4ff; --m-nick-7: #9be3ff; --m-nick-8: #ff9aa2;
  --m-grid: rgba(103,193,255,0.05);
  --m-scanline: transparent;
  --m-glow: rgba(103,193,255,0.35);
}
`;
