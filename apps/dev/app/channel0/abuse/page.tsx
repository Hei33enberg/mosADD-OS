import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'channel 0 [mIRC] — report abuse / DMCA | mosadd',
  description:
    'How to report abuse, harassment, illegal content, or DMCA violations on channel 0 [mIRC]. Domain-level disable for owners.',
  robots: { index: true, follow: true },
};

export default function AbusePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">channel 0 [mIRC] · abuse &amp; DMCA</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Report abuse or DMCA</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
        channel 0 is an anonymous chat overlaid on third-party domains. We take abuse and illegal content seriously.
        Most reports are resolved in &lt; 24h.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Three ways to act, fastest first</h2>
          <ol className="space-y-3">
            <li>
              <div className="font-display text-sm text-primary">1. In-chat report (instant)</div>
              <p className="mt-1">
                Hover any message in the side panel and click the <span className="font-mono">!</span> icon. Pick a
                reason (spam / abuse / illegal / other). After <strong className="text-foreground">3 distinct reporters</strong>{' '}
                a message is auto-hidden everywhere — no human in the loop required.
              </p>
            </li>
            <li>
              <div className="font-display text-sm text-primary">2. Domain-level disable (for owners)</div>
              <p className="mt-1">
                If you own the domain, verify ownership at{' '}
                <Link className="text-primary underline" href="/domains">/domains</Link> via a DNS TXT record and toggle
                the channel off. The channel returns HTTP 451 to every joiner on your domain — instant takedown, free.
              </p>
            </li>
            <li>
              <div className="font-display text-sm text-primary">3. Email us — abuse / DMCA / law enforcement</div>
              <p className="mt-1">
                For DMCA notices, harassment outside the report flow, regulator inquiries, court orders, or anything that
                needs a human:
              </p>
              <ul className="mt-3 space-y-1 text-xs">
                <li>
                  · Abuse / harassment / urgent: <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a>
                </li>
                <li>
                  · DMCA: <a className="text-primary underline" href="mailto:dmca@mosadd.dev">dmca@mosadd.dev</a>{' '}
                  (include the sworn statement; we follow the standard 17 USC §512(c)(3) format).
                </li>
                <li>
                  · Law enforcement / preservation requests: <a className="text-primary underline" href="mailto:legal@mosadd.dev">legal@mosadd.dev</a>
                </li>
                <li>
                  · Privacy / GDPR / data deletion: <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a>
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What information helps us act</h2>
          <ul className="space-y-2">
            <li>· The domain (e.g. <span className="font-mono">zalando.pl</span>) — required.</li>
            <li>· The approximate time and the offending nick if you remember it.</li>
            <li>· A screenshot if possible.</li>
            <li>· For DMCA: the work being infringed + your sworn statement.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What we do server-side automatically</h2>
          <ul className="space-y-2">
            <li>· <strong className="text-foreground">Proof-of-work</strong> on every join (anti-bot, ~100ms CPU).</li>
            <li>· <strong className="text-foreground">Per-device + per-IP rate limits</strong> on join + messages.</li>
            <li>· <strong className="text-foreground">Content validator</strong>: blocks repeat-character floods (<span className="font-mono">adadadad…</span>), zalgo, multi-line ASCII art, dominant-char spam, single-token mash, control characters.</li>
            <li>· <strong className="text-foreground">Burst tracker</strong>: 3 msgs/s OR 15 msgs/10s per socket → soft block.</li>
            <li>· <strong className="text-foreground">Same-message tracker</strong>: identical text 3× in last 5 → blocked.</li>
            <li>· <strong className="text-foreground">Auto-hide</strong> at 3 distinct community reporters.</li>
            <li>· <strong className="text-foreground">Global kill-switch</strong> for operator emergencies.</li>
          </ul>
          <p className="mt-3 text-xs">Full posture at <Link className="text-primary underline" href="/channel0/privacy">/channel0/privacy</Link>.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">For minors</h2>
          <p>
            channel 0 is not for users under 16. On first launch the extension shows an age confirmation; selecting
            &ldquo;under 16&rdquo; disables the chat surface and points the user to an{' '}
            <a className="text-primary underline" href="https://www.thinkuknow.co.uk">internet-safety resource</a>.
            We do not collect age. If you believe a minor is using the platform, report the channel via the in-chat flow
            and email <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Transparency</h2>
          <p>
            We publish quarterly transparency notes summarising aggregate report volumes, auto-hide rates, and
            government requests. First report due 2026-09-30.
          </p>
        </section>
      </div>
    </div>
  );
}
