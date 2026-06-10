import Link from 'next/link';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur">
      {/* thin scanline accent on the top edge */}
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="mosadd.dev home">
          <Logo size="base" suffix="dev" />
        </Link>
        {/* Single collapsed menu (hamburger) on every breakpoint + the Sign-in CTA. */}
        <div className="flex items-center gap-3">
          <Link
            href="/hub"
            className="rounded-none bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
