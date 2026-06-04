import type { Metadata } from 'next';
import Link from 'next/link';
import { MOSADD_DEV } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'Privacy policy for mURL — what we collect, what we never collect, and how to delete it.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · privacy policy</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective: 2026-06-04 · Last updated: 2026-06-04</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">In plain words</h2>
          <ul className="space-y-2">
            <li>· No accounts. No email. No phone number.</li>
            <li>· We never track your browsing history or read the pages you visit.</li>
            <li>· A random per-install token is used only to stop spam and bans — it isn’t you, and it isn’t a fingerprint.</li>
            <li>· Messages are shown to whoever’s in the same website’s room, and kept short-term so latecomers see history.</li>
            <li>· Remove the extension and everything on your device is gone.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What we process</h2>
          <ul className="mt-1 space-y-2">
            <li>· <span className="text-foreground">The website you’re on</span> — only the registrable domain (e.g. <span className="font-mono">nike.com</span>), never the full URL or page content. That’s what puts you in the right room.</li>
            <li>· <span className="text-foreground">A random device token</span> — generated once per install, stored in your browser. The server only ever sees a salted hash of it. Used for rate-limit + bans only.</li>
            <li>· <span className="text-foreground">Your nickname</span> — a random name by default (e.g. <span className="font-mono">lucky-otter-77</span>), stored locally, visible to others in the room.</li>
            <li>· <span className="text-foreground">Messages you send</span> — shown to others in the same room and kept short-term so late joiners see history.</li>
            <li>· <span className="text-foreground">IP address (transient)</span> — seen during the request for rate-limiting, not stored long-term.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What we never collect</h2>
          <ul className="space-y-2">
            <li>· Full URLs or the content of pages you visit</li>
            <li>· Your browsing history</li>
            <li>· Email, phone, or any personal identifier</li>
            <li>· A browser fingerprint (we deliberately don’t run one)</li>
            <li>· Anything from non-website pages (chrome://, file://, localhost)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Why the extension needs “all sites” access</h2>
          <p>mURL is a chat scoped to whichever site you’re on, so it has to be able to show the chat panel on that page. The script only reads the site’s domain name, draws the panel, and opens the chat connection. It does not read the page, your forms, or your data.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Deleting your data</h2>
          <ul className="space-y-2">
            <li>· Remove the extension to wipe the device token, nicknames, and settings from your browser.</li>
            <li>· To request server-side deletion of messages sent under your device, email <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Ages</h2>
          <p>mURL is for users 16 and over. Chat is user-generated; we use automated filters plus a report-and-auto-hide flow, but it isn’t fully moderated.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Website owners</h2>
          <p>Own a domain and want the chat off it? You can disable it for free by proving ownership via a DNS record at <a className="text-primary underline" href={`${MOSADD_DEV}/domains`}>mosadd.dev/domains</a>. For abuse or DMCA, email <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a>.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Privacy: <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a><br />
            Abuse: <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a><br />
            See also <Link className="text-primary underline" href="/abuse">how to report abuse</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
