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
      { href: '/docs/modules/threat-engine', label: 'Threat engine' },
    ],
  },
  {
    section: 'Modules',
    items: [
      { href: '/docs/modules', label: 'Overview' },
      { href: '/docs/modules/mdm', label: 'mDM · DMs' },
      { href: '/docs/modules/mirc', label: 'mIRC · Channels' },
      { href: '/docs/modules/mroom', label: 'mROOM · Rooms' },
      { href: '/docs/modules/mtalk', label: 'mTALK · PTT' },
      { href: '/docs/modules/mail', label: 'mAIL · Email' },
      { href: '/docs/modules/mrag', label: 'mRAG · Knowledge' },
    ],
  },
  {
    section: 'Project',
    items: [
      { href: '/docs/rfcs', label: 'RFCs' },
      { href: '/docs/security', label: 'Security' },
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
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">{section.section}</div>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-2 py-1 -mx-2 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/50 transition"
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
