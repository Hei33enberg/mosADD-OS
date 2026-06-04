'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CHROME_STORE_URL, INSTALL_LABEL } from '../../lib/site';

const links = [
  { href: '/#how', label: 'How it works' },
  { href: '/#use-cases', label: 'Use cases' },
  { href: '/#trending', label: 'Trending rooms' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/abuse', label: 'Report abuse' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-none border border-border px-2 py-1 text-sm text-foreground"
      >
        {open ? '✕' : '≡'}
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-14 border-b border-border bg-background/95 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-3 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/50 py-2.5 text-muted-foreground last:border-0 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 bg-primary px-3 py-2.5 text-center font-medium text-primary-foreground"
            >
              {INSTALL_LABEL} →
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
