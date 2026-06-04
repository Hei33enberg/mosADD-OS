'use client';

import { useState } from 'react';
import Link from 'next/link';

const links = [
  { href: '/embed', label: 'Embed →', primary: true },
  { href: '/docs', label: 'Docs' },
  { href: '/docs/quickstart', label: 'Quickstart' },
  { href: '/docs/auth', label: 'Credentials' },
  { href: '/docs/mcp', label: 'MCP · 40 tools' },
  { href: '/docs/modules', label: 'Modules' },
  { href: '/docs/sdk', label: 'SDK' },
  { href: '/examples', label: 'Examples' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
  { href: '/changelog', label: 'Changelog' },
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
