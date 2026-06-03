import Link from 'next/link';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';

const navLinks = [
  { href: '/embed', label: 'Embed' },
  { href: '/channel0', label: 'channel 0', primary: true },
  { href: '/docs', label: 'Docs' },
  { href: '/docs/mcp', label: 'MCP' },
  { href: '/skins', label: 'Skins' },
  { href: '/examples', label: 'Examples' },
  { href: '/pricing', label: 'Pricing' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      {/* thin scanline accent on the top edge */}
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="mosadd.dev home">
          <Logo size="base" suffix="dev" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.primary
                  ? 'text-primary transition-colors hover:text-primary/80'
                  : 'text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://mosadd.com"
            className="rounded-none border border-primary/40 px-3 py-1.5 text-primary transition-colors hover:bg-primary/10"
          >
            mosadd.com →
          </a>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
