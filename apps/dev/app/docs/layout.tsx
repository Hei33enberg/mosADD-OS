import Link from 'next/link';
import type { ReactNode } from 'react';

const nav: { section: string; items: { href: string; label: string }[] }[] = [
  {
    section: 'Getting started',
    items: [
      { href: '/docs', label: 'Overview' },
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/auth', label: 'Auth' },
    ],
  },
  {
    section: 'Core',
    items: [
      { href: '/docs/mcp', label: 'MCP server' },
      { href: '/docs/sdk', label: 'SDK adapters' },
    ],
  },
  {
    section: 'Modules',
    items: [
      { href: '/docs/modules', label: 'Overview' },
      { href: '/docs/modules/mdm', label: 'mDM · DMs' },
      { href: '/docs/modules/mirc', label: 'mIRC · Channels' },
      { href: '/docs/modules/murl', label: 'mURL · Rooms' },
      { href: '/docs/modules/mail', label: 'mAYL · Email' },
    ],
  },
  {
    section: 'Capabilities',
    items: [
      { href: '/docs/modules/mtalk', label: 'mTALK · Voice/PTT' },
      { href: '/docs/modules/mrag', label: 'mRAG · Memory' },
    ],
  },
  {
    section: 'Security',
    items: [
      { href: '/docs/modules/threat-engine', label: 'Irondome' },
      { href: '/docs/security', label: 'Security' },
    ],
  },
  {
    section: 'Project',
    items: [
      { href: '/docs/rfcs', label: 'RFCs' },
    ],
  },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
      <aside className="md:sticky md:top-20 self-start">
        <nav className="space-y-8 text-sm">
          {nav.map((section) => (
            <div key={section.section}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{section.section}</div>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-2 py-1 -mx-2 rounded-none text-muted-foreground hover:text-foreground hover:bg-card/50 transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div>{children}</div>
    </div>
  );
}
