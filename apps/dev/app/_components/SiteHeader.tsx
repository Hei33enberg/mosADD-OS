import Link from 'next/link';

const navLinks = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/mcp', label: 'MCP' },
  { href: '/docs/modules', label: 'Modules' },
  { href: '/examples', label: 'Examples' },
  { href: '/download', label: 'Download' },
  { href: '/changelog', label: 'Changelog' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="text-radar-green">m·os·add</span>
          <span className="text-neutral-500 text-xs uppercase tracking-widest">/dev</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-neutral-400 hover:text-neutral-100 transition">
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-neutral-100 transition"
          >
            GitHub
          </a>
          <a
            href="https://mosadd.com"
            className="px-3 py-1.5 rounded border border-radar-green/40 text-radar-green hover:bg-radar-green/10 transition"
          >
            mosadd.com →
          </a>
        </nav>
        <nav className="md:hidden flex items-center gap-3 text-sm">
          <Link href="/docs" className="text-neutral-400 hover:text-neutral-100">Docs</Link>
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-neutral-100"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
