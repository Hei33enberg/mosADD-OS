import type { Metadata } from 'next';
import Link from 'next/link';
import { MOSADD_DEV } from '../../lib/site';

export const metadata: Metadata = {
  title: 'Report abuse / DMCA',
  description: 'How to report abuse, harassment, illegal content, or DMCA violations on mURL. Domain owners can disable a room for free.',
  robots: { index: true, follow: true },
};

export default function AbusePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · abuse &amp; DMCA</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Report abuse or DMCA</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        mURL is an anonymous chat overlaid on third-party websites. We take abuse and illegal content seriously —
        most reports are resolved in under 24 hours.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">Three ways to act, fastest first</h2>
          <ol className="space-y-3">
            <li>
              <div className="font-display text-sm text-primary">1. Report a message (instant)</div>
              <p className="mt-1">In the chat, tap the <span className="font-mono">!</span> on any message and pick a reason. After <strong className="text-foreground">3 different people</strong> report it, the message is hidden automatically — no waiting on us.</p>
            </li>
            <li>
              <div className="font-display text-sm text-primary">2. Own the website? Turn the room off (free)</div>
              <p className="mt-1">Verify ownership with a DNS record at <a className="text-primary underline" href={`${MOSADD_DEV}/domains`}>mosadd.dev/domains</a> and disable the room. It immediately stops loading for everyone on your domain.</p>
            </li>
            <li>
              <div className="font-display text-sm text-primary">3. Email us — abuse / DMCA / law enforcement</div>
              <ul className="mt-2 space-y-1 text-xs">
                <li>· Abuse / harassment / urgent: <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a></li>
                <li>· DMCA: <a className="text-primary underline" href="mailto:dmca@mosadd.dev">dmca@mosadd.dev</a> (standard 17 USC §512(c)(3) format).</li>
                <li>· Law enforcement / preservation: <a className="text-primary underline" href="mailto:legal@mosadd.dev">legal@mosadd.dev</a></li>
                <li>· Privacy / GDPR / deletion: <a className="text-primary underline" href="mailto:privacy@mosadd.dev">privacy@mosadd.dev</a></li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What helps us act fast</h2>
          <ul className="space-y-2">
            <li>· The website (e.g. <span className="font-mono">nike.com</span>) — required.</li>
            <li>· Roughly when, and the nickname if you remember it.</li>
            <li>· A screenshot if you can.</li>
            <li>· For DMCA: the work infringed + your sworn statement.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">What runs automatically</h2>
          <ul className="space-y-2">
            <li>· Anti-bot proof-of-work on every join.</li>
            <li>· Per-device and per-IP rate limits.</li>
            <li>· Spam/flood filters (repeat characters, walls of text, dominant-character spam).</li>
            <li>· Auto-hide once a few people report a message.</li>
            <li>· A global kill-switch for emergencies.</li>
          </ul>
          <p className="mt-3 text-xs">More detail in our <Link className="text-primary underline" href="/privacy">privacy policy</Link>.</p>
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-semibold text-foreground">For minors</h2>
          <p>mURL is for users 16 and over. On first launch you confirm your age; choosing “under 16” turns the chat off. We don’t collect age. If you think a minor is using it, report the room and email <a className="text-primary underline" href="mailto:abuse@mosadd.dev">abuse@mosadd.dev</a>.</p>
        </section>
      </div>
    </div>
  );
}
