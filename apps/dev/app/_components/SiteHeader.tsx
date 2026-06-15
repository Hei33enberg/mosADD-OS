'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { getSupabase } from '../hub/supabaseClient';

// Primary desktop nav. The full link set lives in MobileNav (hamburger, mobile only).
const DESKTOP_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/modules', label: 'Modules' },
  { href: '/docs/mcp', label: 'MCP' },
  { href: '/embed', label: 'Embed' },
  { href: '/examples', label: 'Examples' },
  { href: '/pricing', label: 'Pricing' },
];

export function SiteHeader() {
  const [user, setUser] = useState<{ email?: string; avatar?: string } | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) setUser({ email: u.email, avatar: u.user_metadata?.avatar_url });
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { email: u.email, avatar: u.user_metadata?.avatar_url } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur">
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center shrink-0" aria-label="mosadd.dev home">
          <Logo size="base" suffix="dev" dropdown />
        </Link>

        {/* Desktop horizontal nav (hidden on mobile → hamburger takes over) */}
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {DESKTOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/hub" className="flex items-center gap-2 group">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-7 w-7 rounded-full border border-border group-hover:border-primary/60 transition-colors"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold uppercase text-primary group-hover:border-primary/60 transition-colors">
                  {(user.email ?? '?')[0]}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/hub"
              className="rounded-none bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
