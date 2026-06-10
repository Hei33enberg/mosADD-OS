'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const links = [
  { href: '/embed', label: 'Embed', primary: true },
  { href: '/docs', label: 'Docs' },
  { href: '/docs/quickstart', label: 'Quickstart' },
  { href: '/docs/auth', label: 'Credentials' },
  { href: '/docs/mcp', label: 'MCP · 65 tools' },
  { href: '/docs/modules', label: 'Modules' },
  { href: '/docs/sdk', label: 'SDK' },
  { href: '/examples', label: 'Examples' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
  { href: '/changelog', label: 'Changelog' },
];

const PANEL_ID = 'mobile-nav-panel';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape; close on outside-click; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        buttonRef.current && !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((v) => !v)}
        className="rounded-none border border-border px-2 py-1 text-sm text-foreground"
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 3 H13 M1 7 H13 M1 11 H13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={PANEL_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="absolute left-0 right-0 top-14 border-b border-border bg-background/95 backdrop-blur"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-3 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={
                  l.primary
                    ? 'border-b border-border/50 py-2.5 text-primary last:border-0 hover:text-primary/80'
                    : 'border-b border-border/50 py-2.5 text-muted-foreground last:border-0 hover:text-foreground'
                }
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/Hei33enberg/mosadd-os"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 text-muted-foreground hover:text-foreground"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
