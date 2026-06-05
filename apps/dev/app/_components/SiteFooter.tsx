import Link from 'next/link';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border text-xs text-muted-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-5">
        <div className="col-span-2">
          <Logo size="base" />
          <div className="mb-3 mt-3 text-foreground/80">Iron Dome Multi-Channel Messenger · MCP</div>
          <div className="text-muted-foreground/70">TRUST NO TRACE. · Apache-2.0 · Engineered in Switzerland</div>
        </div>

        <div>
          <div className="mb-3 uppercase tracking-[0.25em] text-foreground/80">Docs</div>
          <ul className="space-y-2">
            <li><Link href="/docs/quickstart" className="hover:text-foreground">Quickstart</Link></li>
            <li><Link href="/docs/auth" className="hover:text-foreground">Credentials</Link></li>
            <li><Link href="/docs/mcp" className="hover:text-foreground">MCP server</Link></li>
            <li><Link href="/docs/modules" className="hover:text-foreground">Modules</Link></li>
            <li><Link href="/docs/sdk" className="hover:text-foreground">SDK</Link></li>
            <li><Link href="/docs/security" className="hover:text-foreground">Security</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 uppercase tracking-[0.25em] text-foreground/80">Community</div>
          <ul className="space-y-2">
            <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
            <li><Link href="/docs/rfcs" className="hover:text-foreground">RFCs</Link></li>
            <li><Link href="/examples" className="hover:text-foreground">Examples</Link></li>
            <li><a href="https://github.com/Hei33enberg/mosadd-os/discussions" className="hover:text-foreground">Discussions</a></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 uppercase tracking-[0.25em] text-foreground/80">Resources</div>
          <ul className="space-y-2">
            <li><Link href="/download" className="hover:text-foreground">Download</Link></li>
            <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
        <div>© {new Date().getFullYear()} mosadd contributors · TRUST NO TRACE.</div>
        <div className="flex gap-4">
          <a href="https://mosadd.com" className="hover:text-foreground">mosadd.com</a>
          <a href="https://github.com/Hei33enberg/mosadd-os" className="hover:text-foreground">GitHub</a>
          <a href="https://github.com/Hei33enberg/mosadd-os/security/policy" className="hover:text-foreground">Security</a>
        </div>
      </div>
    </footer>
  );
}
