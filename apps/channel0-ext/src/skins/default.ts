/**
 * Base layer — defaults for every token. Loaded ALWAYS, before any skin
 * override. A skin only needs to declare what it changes.
 *
 * Triple-selector pattern: works on the murl-www site (:root[data-murl-skin]),
 * the extension shadow DOM (:host), and the embed widget (.m-root).
 */
export const DEFAULT_CSS = `
:root, :host, .m-root {
  /* Surface */
  --m-bg: #000000;
  --m-fg: #f2f2f2;
  --m-fg-muted: rgba(255, 255, 255, 0.55);
  --m-card: #0a0a0a;
  --m-card-fg: #f2f2f2;

  /* Brand */
  --m-primary: #00ff7a;
  --m-primary-fg: #000000;
  --m-accent: #00ff7a;

  /* Lines / edges */
  --m-border: rgba(255, 255, 255, 0.2);

  /* Status */
  --m-danger: #ff5577;
  --m-warning: #ffd23f;
  --m-info: #5fb4ff;

  /* Geometry */
  --m-radius: 0;

  /* Type */
  --m-font-sans: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
  --m-font-mono: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;

  /* Per-nick palette */
  --m-nick-1: #00ff7a;
  --m-nick-2: #5fb4ff;
  --m-nick-3: #ff7adf;
  --m-nick-4: #ffd23f;
  --m-nick-5: #ffa14a;
  --m-nick-6: #a2ff5e;
  --m-nick-7: #c08bff;
  --m-nick-8: #ff5577;

  /* Decorative */
  --m-grid: rgba(0, 255, 122, 0.06);
  --m-scanline: rgba(0, 0, 0, 0.22);
  --m-glow: rgba(0, 255, 122, 0.45);
}
`;
