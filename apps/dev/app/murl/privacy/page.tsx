import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'mURL — privacy policy | mosadd',
  description:
    'Privacy policy for the mURL browser extension. What data we collect, what we do not, and how to delete it.',
  robots: { index: true, follow: true },
};

export default function Channel0PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · privacy policy</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective: 2026-06-03 · Last updated: 2026-06-03</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">TL;DR</h2>
          <ul className="space-y-2">
            <li>· No accounts. No email. No phone number.</li>
            <li>· Random per-install device token, used only for rate-limit and ban.</li>
            <li>· Messages stored short-term (durable system-of-record on Supabase), shown only to whoever is in the same domain room.</li>
            <li>· No browsing-history tracking. No third-party ad networks. No data sold or rented.</li>
            <li>· You can wipe everything by removing the extension.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What we collect</h2>
          <p>When you use the extension, the following is processed:</p>
          <ul className="mt-3 space-y-2">
            <li>· <span className="text-foreground">Domain you are on</span> — only the registrable domain (e.g. <span className="font-mono">zalando.pl</span>), never the full URL, never the page path. We need this to put you in the right room.</li>
            <li>· <span className="text-foreground">Random device token</span> — a UUID generated once per install, stored in your browser&apos;s extension storage. The server only ever sees a salted SHA-256 hash of it. Used for rate-limit + ban only. Not linkable to your identity.</li>
            <li>· <span className="text-foreground">Nick you choose</span> — defaults to a deterministic random string (e.g. <span className="font-mono">lucky-otter-77</span>). Stored locally per domain. Visible to others in the same room.</li>
            <li>· <span className="text-foreground">Messages you send</span> — broadcast to others in the same room, persisted to a system-of-record (Supabase) so late joiners see history. Plaintext alpha — see <a className="text-primary underline" href="/docs/security">/docs/security</a>.</li>
            <li>· <span className="text-foreground">IP address (transient)</span> — visible to the server during the request, used for IP-level rate-limit (60-120/min). Not stored long-term.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What we do NOT collect</h2>
          <ul className="space-y-2">
            <li>· Full URLs or page content of sites you visit</li>
            <li>· Your browsing history</li>
            <li>· Email, phone, or any other personal identifier</li>
            <li>· Browser fingerprint (we deliberately do not run a fingerprinting library)</li>
            <li>· Anything from a site other than the registrable domain you are currently on</li>
            <li>· Anything from non-website pages (chrome://, file://, localhost, etc.)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Why we need the &ldquo;all URLs&rdquo; permission</h2>
          <p>mURL is a chat scoped to whichever domain you are currently on. To run the chat panel on that page, the extension must be able to inject a content script there — that is what the <span className="font-mono">&lt;all_urls&gt;</span> host permission grants. The script only does the following:</p>
          <ul className="mt-3 space-y-2">
            <li>· Reads <span className="font-mono">document.location.hostname</span> to compute the room name.</li>
            <li>· Renders a chat panel in a closed shadow root.</li>
            <li>· Opens a WebSocket to the mURL backbone (Cloudflare Worker).</li>
          </ul>
          <p className="mt-3">It does NOT read the page DOM, page text, form values, or anything else from the host site.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Third parties</h2>
          <p>The extension talks to exactly two backends, both operated by mosadd:</p>
          <ul className="mt-3 space-y-2">
            <li>· <span className="text-foreground">Cloudflare Workers</span> — real-time channel backbone. Sees: domain slug, channel token, your messages.</li>
            <li>· <span className="text-foreground">Supabase</span> — durable system-of-record + rate-limit counters. Sees: hashed device token, IP (transient), domain.</li>
          </ul>
          <p className="mt-3">No analytics SDK, no ad tracker, no third-party fingerprinting in the extension.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Retention &amp; deletion</h2>
          <ul className="space-y-2">
            <li>· Messages persist on the Cloudflare DO ring (last 100 per channel) and Supabase <span className="font-mono">messages_meta</span> table indefinitely until pruned for cost.</li>
            <li>· Rate-limit counters auto-expire (1-hour windows, 2-day reaper).</li>
            <li>· You can wipe ALL local data by removing the extension: it drops the device token, nick map, and settings from <span className="font-mono">chrome.storage</span>.</li>
            <li>· You can request server-side deletion of messages sent under your device token by emailing <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Children</h2>
          <p>The extension is not intended for users under 16. Chat content is user-generated and unmoderated outside of automated filters + a report-and-auto-hide flow. Underage users should not install the extension.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Domain owners</h2>
          <p>If you own a domain and want to disable the mURL chat on it, you can do so for free by proving ownership via DNS TXT record (<span className="font-mono">_mosadd-murl</span>) at <a className="text-primary underline" href="/murl#own-a-domain">mosadd.dev/murl</a>. For abuse or DMCA requests, email <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a>.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Changes</h2>
          <p>We will update the &ldquo;Last updated&rdquo; date at the top of this page when this policy changes materially.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Privacy: <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a><br />
            Abuse: <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a><br />
            Source: <a className="text-primary underline" href="https://github.com/Hei33enberg/mosADD-OS/tree/main/apps/murl-ext">github.com/Hei33enberg/mosADD-OS/apps/murl-ext</a> (Apache-2.0)
          </p>
        </section>
      </div>
    </div>
  );
}
