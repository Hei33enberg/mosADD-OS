import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 text-neutral-500 text-xs">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-2">
          <div className="text-neutral-200 font-display text-base mb-2">
            <span className="text-radar-green">m·os·add</span>
          </div>
          <div className="text-neutral-500 mb-3">A human OS. Add.</div>
          <div className="text-neutral-600">Apache-2.0 · Pre-alpha</div>
        </div>

        <div>
          <div className="text-neutral-300 uppercase tracking-widest mb-3">Docs</div>
          <ul className="space-y-2">
            <li><Link href="/docs/quickstart" className="hover:text-neutral-300">Quickstart</Link></li>
            <li><Link href="/docs/mcp" className="hover:text-neutral-300">MCP</Link></li>
            <li><Link href="/docs/modules" className="hover:text-neutral-300">Modules</Link></li>
            <li><Link href="/docs/sdk" className="hover:text-neutral-300">SDK</Link></li>
            <li><Link href="/docs/security" className="hover:text-neutral-300">Security</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-neutral-300 uppercase tracking-widest mb-3">Community</div>
          <ul className="space-y-2">
            <li><Link href="/community" className="hover:text-neutral-300">Community</Link></li>
            <li><Link href="/docs/rfcs" className="hover:text-neutral-300">RFCs</Link></li>
            <li><Link href="/examples" className="hover:text-neutral-300">Examples</Link></li>
            <li><a href="https://github.com/Hei33enberg/mosadd-os/discussions" className="hover:text-neutral-300">Discussions</a></li>
          </ul>
        </div>

        <div>
          <div className="text-neutral-300 uppercase tracking-widest mb-3">Resources</div>
          <ul className="space-y-2">
            <li><Link href="/download" className="hover:text-neutral-300">Download</Link></li>
            <li><Link href="/changelog" className="hover:text-neutral-300">Changelog</Link></li>
            <li><Link href="/pricing" className="hover:text-neutral-300">Pricing</Link></li>
            <li><Link href="/status" className="hover:text-neutral-300">Status</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-900 max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} mosadd contributors</div>
        <div className="flex gap-4">
          <a href="https://mosadd.com" className="hover:text-neutral-300">mosadd.com</a>
          <a href="https://github.com/Hei33enberg/mosadd-os" className="hover:text-neutral-300">GitHub</a>
          <a href="https://github.com/Hei33enberg/mosadd-os/security/policy" className="hover:text-neutral-300">Security policy</a>
        </div>
      </div>
    </footer>
  );
}
