import type { ReactNode } from 'react';

/** Compact brand logos for the install buttons. Chrome is the full 4-colour
 *  mark; the rest are clean brand-coloured glyphs (recognisable at chip size). */
export const BROWSER_LOGOS: Record<string, ReactNode> = {
  chrome: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <circle cx="12" cy="12" r="4.4" fill="#4285F4" />
      <path fill="#EA4335" d="M12 7.6h9A11 11 0 0 0 3.3 7l3.8 6.6A4.4 4.4 0 0 1 12 7.6z" />
      <path fill="#34A853" d="M7.1 13.6 3.3 7A11 11 0 0 0 9.8 22.9l3.8-6.6A4.4 4.4 0 0 1 7.1 13.6z" />
      <path fill="#FBBC05" d="M16.4 12a4.4 4.4 0 0 1-2.6 4.3l-3.9 6.6A11 11 0 0 0 21 7.6h-9a4.4 4.4 0 0 1 4.4 4.4z" />
    </svg>
  ),
  edge: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#0C7DBE" />
      <path fill="#37C2B1" d="M12 5.5c4.2 0 6.7 2.7 6.7 5.6 0 1.4-.8 2.2-2 2.2-2.6 0-3-2-5.8-2-2.4 0-4.2 1.7-4.2 4 0 .4 0 .8.2 1.2C6.2 14.9 5.4 12.9 5.4 11 5.4 7.6 8.2 5.5 12 5.5z" />
      <path fill="#fff" d="M9 13.4c0 2.4 2 4.3 4.9 4.6-2.7 1.2-6 .4-7.5-2-.2-.4-.2-.8-.2-1.2 0-2.3 1.8-4 4.2-4-.9.6-1.4 1.5-1.4 2.6z" />
    </svg>
  ),
  firefox: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12.4" r="10" fill="#FF7139" />
      <path fill="#FFB833" d="M19.4 7.2c.6 1.3.9 2.8.9 4.3a8.3 8.3 0 0 1-13.6 6.4c1.6 1 3.9.9 5.4-.3 1.8-1.4 2-3.7.9-5.2 1.4.3 2.7-.6 2.9-1.9.2-1.3-.6-2.3-1.6-3 1.9-.4 3.7.3 5.1-.3z" />
      <path fill="#FFE066" d="M12 3.4c1.5 1.3 2 3 1.6 4.6 1.2-.7 1.4-2.1 1-3.2 1.4.9 2.3 2.2 2.8 3.4-1.4.6-3.2-.1-5.1.3-1.3-1-3-1.3-4.6-.6C9 5.7 10.3 4.2 12 3.4z" />
    </svg>
  ),
  brave: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FB542B" d="M12 2.5 17.8 5l1.2 2.5-1 1 1 3.2-1.7 5.1L12 21.5l-5.3-4.7L5 11.7l1-3.2-1-1L6.2 5 12 2.5z" />
      <path fill="#fff" d="M12 7.4 9.2 9.7l-1 2.8 2.2 2.4 1.6 1 1.6-1 2.2-2.4-1-2.8L12 7.4z" opacity=".92" />
    </svg>
  ),
  opera: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="11" ry="11" fill="#FF1B2D" />
      <ellipse cx="12" cy="12" rx="4.4" ry="6.8" fill="#fff" />
    </svg>
  ),
};
