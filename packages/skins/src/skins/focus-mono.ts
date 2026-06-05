// focus-mono — pure black & white, max legibility. Reading room mode.
export const FOCUS_MONO_CSS = `
:root[data-murl-skin="focus-mono"],
:host([data-murl-skin="focus-mono"]),
.m-root[data-murl-skin="focus-mono"] {
  --m-bg: #ffffff;
  --m-fg: #0a0a0a;
  --m-fg-muted: rgba(10,10,10,0.55);
  --m-card: #f5f5f5;
  --m-card-fg: #0a0a0a;
  --m-primary: #0a0a0a;
  --m-primary-fg: #ffffff;
  --m-accent: #0a0a0a;
  --m-border: rgba(10,10,10,0.16);
  --m-danger: #b00020;
  --m-warning: #8b6a00;
  --m-info: #2a4a8c;
  --m-radius: 0.25rem;
  --m-font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-nick-1: #0a0a0a; --m-nick-2: #2a4a8c; --m-nick-3: #6a2a8c; --m-nick-4: #8b6a00;
  --m-nick-5: #2a8c4a; --m-nick-6: #b00020; --m-nick-7: #4a4a4a; --m-nick-8: #8c2a4a;
  --m-grid: rgba(10,10,10,0.03);
  --m-scanline: transparent;
  --m-glow: transparent;
}
`;
