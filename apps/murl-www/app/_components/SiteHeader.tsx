import Link from 'next/link';
import { Wordmark } from './Wordmark';
import { MobileNav } from './MobileNav';
import { BrowserButtons } from './BrowserButtons';

const navLinks = [
  { href: '/#how', label: 'How it works' },
  { href: '/#use-cases', label: 'Use cases' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="mURL home">
          <Wordmark size="base" byline />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <BrowserButtons variant="compact" />
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
