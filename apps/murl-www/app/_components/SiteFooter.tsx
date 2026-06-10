import Link from 'next/link';
import { Wordmark } from './Wordmark';
import { MOSADD_DEV, MOSADD_COM, GITHUB_URL } from '../../lib/site';

export function SiteFooter() {
  return (
    <footer className="text-xs text-muted-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2">
          <Wordmark size="base" byline />
          <div className="mb-3 mt-3 text-foreground/80">Anonymous live chat for every website.</div>
          <div className="text-muted-foreground/70">
            Independent chat — not affiliated with the sites it appears on. Free · anonymous · no account.
          </div>
        </div>

        <div>
          <div className="mb-3 uppercase tracking-[0.25em] text-foreground/80">mURL</div>
          <ul className="space-y-2">
            <li><Link href="/#how" className="hover:text-foreground">How it works</Link></li>
            <li><Link href="/#use-cases" className="hover:text-foreground">Use cases</Link></li>
            <li><Link href="/#trending" className="hover:text-foreground">Trending rooms</Link></li>
            <li><Link href="/#faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link href="/developers" className="hover:text-foreground">Developers</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="/abuse" className="hover:text-foreground">Report abuse / DMCA</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 uppercase tracking-[0.25em] text-foreground/80">from the makers of mosADD</div>
          <ul className="space-y-2">
            <li><a href={MOSADD_COM} className="hover:text-foreground">mosadd.com</a></li>
            <li><a href={MOSADD_DEV} className="hover:text-foreground">mosadd.dev</a></li>
            <li><a href={GITHUB_URL} className="hover:text-foreground">GitHub (open source)</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>© {new Date().getFullYear()} mosadd contributors · Apache-2.0</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70">powered by</span>
          <a href={MOSADD_DEV} className="font-bold tracking-[0.1em] text-foreground/80 hover:text-foreground">
            mos<span className="text-primary">ADD</span><span className="align-super text-[0.7em] text-primary">™</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
