import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead, H2, H3, P, Pre, InlineCode, Anchor, Ul, Table } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'mIRC Embed — drop-in chat for any website',
  description:
    'Paste 6 lines of HTML and your blog, news site, or YouTube channel has a real-time mIRC widget. Powered by Cloudflare Durable Objects + scoped JWTs. Free up to 1,000 Monthly Active Talkers. No marketplace, no lock-in.',
};

const SNIPPET = `<div id="mosadd-mirc"
     data-channel="strajkpolski"
     data-position="sidebar-right"
     data-locale="pl">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="m_pk_live_…">
</script>`;

const tiers = [
  {
    name: 'Self-host',
    price: '$0',
    unit: 'forever',
    blurb: 'Run the Worker + this bundle yourself. Apache-2.0.',
    features: [
      'Unlimited MAT (you pay your own CF bill)',
      'Full skin shop + community skins',
      'Bring your own Supabase',
      'No mosadd account required',
    ],
    cta: { label: 'Docs', href: '/docs/quickstart' },
  },
  {
    name: 'Free',
    price: '$0',
    unit: '/ mo (hosted)',
    blurb: 'For bloggers, hobbyists, small communities.',
    features: [
      '1,000 Monthly Active Talkers',
      '1 embed key / 1 channel',
      'All public gallery skins',
      '“powered by mosadd” badge shown',
      'Anti-spam + auto-cap at 110% (we stop, we don’t bill)',
    ],
    cta: { label: 'Create a key', href: 'https://hub.mosadd.com/embed/new' },
  },
  {
    name: 'Pro',
    price: '$9',
    unit: '/ mo + PAYG',
    highlight: true,
    blurb: 'For active creators, mid-tier blogs and news sites.',
    features: [
      '10,000 MAT included',
      '5 embed keys',
      'Custom CSS skin URL',
      'Badge removal +$3/mo (or keep it)',
      'PAYG overage $0.001 / extra MAT, hard cap = 2× plan price',
    ],
    cta: { label: 'Start Pro', href: 'https://hub.mosadd.com/embed/new?plan=pro' },
  },
  {
    name: 'Team',
    price: '$29',
    unit: '/ mo + PAYG',
    blurb: 'For news rooms, agencies, creator companies.',
    features: [
      '100,000 MAT included',
      'Unlimited embed keys',
      'White-label (badge included off)',
      'Webhooks + audit log + multi-tenant',
      'PAYG overage $0.001 / extra MAT, hard cap = 2× plan price',
    ],
    cta: { label: 'Start Team', href: 'https://hub.mosadd.com/embed/new?plan=team' },
  },
  {
    name: 'Enterprise',
    price: 'custom',
    unit: '',
    blurb: 'For platforms, broadcasters, regulated industries.',
    features: [
      'Unlimited MAT',
      'SSO / SAML',
      'DPA, NIS2 audit log',
      'Dedicated infra + SLA',
      'Premium support',
    ],
    cta: { label: 'Talk to us', href: 'mailto:hello@mosadd.dev?subject=Embed%20Enterprise' },
  },
];

export default function EmbedLanding() {
  return (
    <main className="min-h-[100svh] bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
            mosadd<span className="text-[0.55em] align-super ml-0.5 text-primary">™</span> &nbsp;/ &nbsp; mIRC EMBED &nbsp;· &nbsp;v0.1 alpha
          </div>
          <h1 className="font-mono text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6">
            Drop-in chat for any&nbsp;website.<br />
            <span className="text-primary">6 lines of HTML.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            mIRC-style retro chat embed for creators. WebSocket fan-out via Cloudflare
            Durable Objects, scoped 5-min JWTs (the hub key never enters the browser),
            free up to 1,000 Monthly Active Talkers, Apache-2.0 for self-host.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://hub.mosadd.com/embed/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider text-sm rounded-none"
            >
              CREATE A KEY →
            </Link>
            <Link
              href="#snippet"
              className="inline-flex items-center gap-2 px-5 py-3 border border-border text-foreground font-mono font-bold uppercase tracking-wider text-sm rounded-none hover:border-primary hover:text-primary"
            >
              SHOW THE SNIPPET
            </Link>
            <Link
              href="/docs/embed"
              className="inline-flex items-center gap-2 px-5 py-3 text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider text-sm"
            >
              READ THE DOCS ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Snippet */}
      <section id="snippet" className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">01 · PASTE</div>
            <H2>Six lines. That&apos;s the install.</H2>
            <P>
              Paste one <InlineCode>&lt;div&gt;</InlineCode> + one{' '}
              <InlineCode>&lt;script&gt;</InlineCode> into your page. The widget
              reads its config from <InlineCode>data-*</InlineCode> attributes and
              renders into a Shadow DOM — your page CSS can&apos;t reach in, our
              CSS can&apos;t leak out.
            </P>
            <P>
              The publishable key (<InlineCode>m_pk_live_…</InlineCode>) is
              browser-safe. Origin allow-list + channel allow-list enforce scope
              server-side; if the key shows up on a domain you didn&apos;t list,
              the mint endpoint rejects.
            </P>
            <P>
              <Anchor href="/docs/embed#attributes">All data-attrs →</Anchor>
            </P>
          </div>
          <div>
            <Pre lang="html">{SNIPPET}</Pre>
            <P>
              <span className="text-muted-foreground">Default skin =</span>{' '}
              <InlineCode>mosadd-mIRC</InlineCode>{' '}
              <span className="text-muted-foreground">— mosadd brand frame, retro mIRC chat inside.</span>
            </P>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">02 · WHY IT WORKS</div>
          <H2>The hub key never enters the browser.</H2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="text-primary font-mono text-2xl mb-3">→ MINT</div>
              <P>
                Visitor opens the page. Your publishable key is sent server-to-server
                to <InlineCode>mirc-embed-token</InlineCode>. We validate origin +
                channel + MAT cap, then return a <strong>5-min JWT</strong> scoped
                to one channel, one scope (<InlineCode>chat:rw</InlineCode>).
              </P>
            </div>
            <div>
              <div className="text-primary font-mono text-2xl mb-3">→ CONNECT</div>
              <P>
                Widget opens a WebSocket to the Cloudflare Durable Object with{' '}
                <InlineCode>Sec-WebSocket-Protocol: mosadd.v1, bearer.&lt;jwt&gt;</InlineCode>.
                No <InlineCode>?k=hub_key</InlineCode> in URLs — nothing leaks to CDN
                access logs (Strajk&apos;s HANDOFF-14 lesson, baked in).
              </P>
            </div>
            <div>
              <div className="text-primary font-mono text-2xl mb-3">→ TALK</div>
              <P>
                Sub-100ms global fan-out from the DO. Messages flush
                async to Supabase as system-of-record (search, audit, history
                beyond the ring buffer). One DO per channel — scales per channel.
              </P>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">03 · PRICING</div>
          <h2 className="font-mono text-3xl md:text-4xl font-bold mb-2">
            Free up to <span className="text-primary">1,000 MAT</span>.
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            The unit is <strong className="text-foreground">MAT</strong> — Monthly Active Talkers, unique senders per month per
            account. Viewers free, messages free. Card on file caps overage at 2× your plan price — no surprise bills.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`p-5 border rounded-none flex flex-col gap-4 ${
                  t.highlight ? 'border-primary bg-primary/5' : 'border-border bg-background'
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">{t.name}</div>
                  <div className="font-mono">
                    <span className="text-2xl font-bold text-foreground">{t.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">{t.unit}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">{t.blurb}</p>
                </div>
                <ul className="text-sm text-foreground space-y-1.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary mt-0.5">›</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.cta.href}
                  className={`text-center px-4 py-2.5 text-xs uppercase tracking-wider font-mono font-bold rounded-none border ${
                    t.highlight
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {t.cta.label}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-6 max-w-2xl leading-relaxed">
            <strong>How we count MAT:</strong> one unique sub (anonymous joiner or
            logged-in user) sending at least one message in a calendar month = 1 MAT.
            Viewers, page loads, reconnects, lurkers — all free. Repeat talkers in
            the same month — 1 MAT, not many. We dedupe in Postgres, idempotent on{' '}
            <InlineCode>bump_mat_counter</InlineCode>.
          </p>
        </div>
      </section>

      {/* Skin Shop */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">04 · SKIN SHOP</div>
          <H2>Style it like Winamp.</H2>
          <P>
            Default look = mosadd brand frame + retro mIRC chat (the same vibe
            strajkpolski.pl shipped manually — we ship it OOTB). Want it
            different?
          </P>
          <Ul>
            <li>Browse the community gallery at <Anchor href="/skins">mosadd.dev/skins</Anchor>, click apply.</li>
            <li>Or open the live editor at <Anchor href="/skins/editor">/skins/editor</Anchor> and tweak colors, fonts, scanline opacity, nick prefix, sounds.</li>
            <li>Or write CSS, export <InlineCode>.mosaddskin</InlineCode> and host it yourself (Pro+ tier).</li>
          </Ul>
          <P>
            All skins are <strong>Apache-2.0</strong>, community-contributed via PR
            to{' '}
            <Anchor href="https://github.com/Hei33enberg/mosADD-OS/tree/main/skins">
              mosadd-os/skins/
            </Anchor>
            . No marketplace, no rev-share, no friction. Bring your best skin —
            it ships with the next bundle.
          </P>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-mono text-3xl md:text-4xl font-bold mb-4">
            Ready in <span className="text-primary">60 seconds.</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Create a key, copy the snippet, paste it in WordPress / Webflow / Ghost /
            your own HTML. Visitors join with a nick. Done.
          </p>
          <Link
            href="https://hub.mosadd.com/embed/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider text-sm rounded-none"
          >
            CREATE YOUR FIRST EMBED →
          </Link>
        </div>
      </section>
    </main>
  );
}
