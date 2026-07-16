'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const links = [
  { href: '/embed', label: 'Embed', primary: true },
  { href: '/docs', label: 'Docs' },
  { href: '/docs/quickstart', label: 'Quickstart' },
  { href: '/docs/auth', label: 'Credentials' },
  { href: '/docs/mcp', label: 'MCP · 68 tools' },
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
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // The overlay is portalled to <body>. Without this it renders inside the
  // sticky <header>, whose `backdrop-blur` traps position:fixed children in the
  // header's box → the backdrop only covers the header strip and the panel
  // positions wrong (the "transparent / always-open" bug). Portal fixes it.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const overlay = (
    <>
      {/* Opaque backdrop — click to close. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Right-side panel */}
      <div
        ref={panelRef}
        id={PANEL_ID}
        role="dialog"
        aria-modal={open}
        aria-label="Site navigation"
        className={`fixed right-0 top-0 z-[70] h-full w-72 max-w-[85vw] border-l border-border bg-background shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-6 border-b border-border">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-none border border-border px-2 py-1 text-sm text-foreground hover:border-primary/50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col px-6 py-4 text-sm">
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
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((v) => !v)}
        className="rounded-none border border-border px-2 py-1 text-sm text-foreground hover:border-primary/50"
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

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
