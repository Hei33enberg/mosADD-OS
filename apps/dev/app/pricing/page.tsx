import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Callout, Anchor } from '../_components/Prose';
import { Calculator } from '../_components/Calculator';
import { ComparisonTable } from '../_components/ComparisonTable';
import { WaitlistForm } from '../_components/WaitlistForm';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Open-source forever. Hosted hub usage-based with a generous free tier and BYOK = $0. Estimate your cost vs a hand-wired Twilio + LiveKit + Telnyx stack.',
};

type Tier = {
  id: string;
  name: string;
  blurb: string;
  price: string;
  unit?: string;
  highlight?: boolean;
  features: string[];
  cta: { label: string; href?: string; waitlist?: boolean };
};

const tiers: Tier[] = [
  {
    id: 'self-host',
    name: 'Self-host',
    blurb: 'Run the whole stack yourself. Apache-2.0 forever.',
    price: '$0',
    features: [
      '@mosadd/mcp + all SDK adapters',
      'All 38 tools, every m* module',
      'Bring your own keys (Telnyx, Resend, LiveKit, Supabase)',
      'Community support — GitHub Discussions',
      'No telemetry, no phone-home',
    ],
    cta: { label: 'Get started', href: '/docs/quickstart' },
  },
  {
    id: 'free',
    name: 'Free',
    blurb: 'Hosted MCP, no setup. Ship in 60 seconds.',
    price: '$0',
    features: [
      'Hosted MCP at mcp.mosadd.com',
      '100 messages included / mo',
      '30 min mTALK / mo',
      'Single project · best-effort uptime',
      'Overage billed per use — no surprise caps',
    ],
    cta: { label: 'Join waitlist', waitlist: true },
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For solo builders shipping production agents.',
    price: '$9',
    unit: '/mo + usage',
    highlight: true,
    features: [
      'Everything in Free',
      '10,000 messages included, then $0.0006 ea',
      '600 min mTALK included · BYOK = $0',
      '60 PSTN min included (≤10% over carrier)',
      'Single anonymous DID · email support · 99.5% SLO',
    ],
    cta: { label: 'Join waitlist', waitlist: true },
  },
  {
    id: 'team',
    name: 'Team',
    blurb: 'For startup teams running multiple agents.',
    price: '$49',
    unit: '/mo + usage',
    features: [
      'Everything in Pro',
      '100,000 messages included, then $0.0006 ea',
      '6,000 min mTALK · 600 PSTN min included',
      'Up to 5 DIDs · shared projects + RBAC',
      '99.9% uptime SLO',
    ],
    cta: { label: 'Join waitlist', waitlist: true },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    blurb: 'Self-host in your VPC + BYOK + SLA + audit.',
    price: 'Custom',
    features: [
      'Self-hosted in your VPC / on-prem',
      'BYOK key broker for every provider',
      'SSO / SAML · RBAC · NIS2 audit-log retention',
      'Threat radar 167-event feed',
      'Dedicated channel + DPA · 99.95% SLO',
    ],
    cta: { label: 'Talk to us', href: 'mailto:hello@mosadd.com?subject=mosadd%20Enterprise' },
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <Prose>
        <H1>Pricing</H1>
        <Lead>
          Open-source forever. The hosted hub is usage-based with a generous free tier — and{' '}
          <strong>bring-your-own-keys means $0 on voice &amp; PSTN orchestration</strong>. You only ever pay
          for what you send.
        </Lead>
        <Callout type="info" id="status">
          <strong>Phase 2 preview.</strong> The hosted hub at{' '}
          <code className="font-mono text-primary">hub.mosadd.com</code> is in build. Self-host is available
          today via <Anchor href="/download">Download</Anchor> — join the waitlist below to get hosted access first.
        </Callout>
      </Prose>

      {/* Tiers */}
      <div className="grid lg:grid-cols-5 gap-4 mt-12">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col rounded-none p-5 border ${
              t.highlight ? 'border-primary/60 bg-primary/[0.04]' : 'border-border bg-card/40'
            }`}
          >
            {t.highlight ? (
              <div className="mb-2 inline-block w-fit border border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                Most popular
              </div>
            ) : (
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{t.id}</div>
            )}
            <div className="font-display text-xl text-foreground mb-1">{t.name}</div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.blurb}</p>
            <div className="mb-5">
              <span className="font-display text-3xl text-foreground">{t.price}</span>
              {t.unit ? <span className="text-xs text-muted-foreground"> {t.unit}</span> : null}
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 mb-6 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary mt-0.5">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {t.cta.waitlist ? (
              <a
                href="#waitlist"
                className={`block text-center px-3 py-2 rounded-none text-sm font-medium transition ${
                  t.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border text-foreground hover:border-primary/50'
                }`}
              >
                {t.cta.label} →
              </a>
            ) : (
              <a
                href={t.cta.href}
                className="block text-center px-3 py-2 rounded-none text-sm font-medium border border-border text-foreground hover:border-primary/50 transition"
              >
                {t.cta.label} →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Calculator */}
      <div className="mt-16">
        <Prose>
          <H2>Estimate your cost</H2>
          <P>
            Drag the sliders. We show the cheapest mosadd plan for your usage and what the same stack would
            cost wired by hand across Twilio, LiveKit and Telnyx.
          </P>
        </Prose>
        <div className="mt-6">
          <Calculator />
        </div>
      </div>

      {/* Comparison */}
      <div className="mt-16">
        <Prose>
          <H2>mosadd vs single-vendor stacks</H2>
        </Prose>
        <div className="mt-6">
          <ComparisonTable />
        </div>
      </div>

      {/* Enterprise / CISO checklist */}
      <div className="mt-16 border border-border p-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">For the security review</h2>
        <p className="mt-2 mb-5 max-w-2xl text-sm text-muted-foreground">
          Everything your CISO needs to sign off — open code to audit, and the enterprise controls on top.
        </p>
        <div className="grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
          {[
            'Apache-2.0 source — audit every line before you deploy',
            'Self-host in your own VPC / on-prem',
            'SSO / SAML + RBAC',
            'NIS2-grade audit-log retention',
            'E2EE (X3DH + Double Ratchet) on mDM',
            'BYOK key broker — your provider keys never leave you',
            'Threat radar: 167-event scoring across every channel',
            'DPA + dedicated channel + 99.95% uptime SLO',
          ].map((f) => (
            <div key={f} className="flex gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a
          href="mailto:hello@mosadd.com?subject=mosadd%20Enterprise%20%2F%20security%20review"
          className="mt-6 inline-block rounded-none border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          Talk to us →
        </a>
      </div>

      {/* Waitlist */}
      <div id="waitlist" className="mt-16 border border-primary/30 bg-primary/[0.03] p-6 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-foreground">Get hosted access first</h2>
        <p className="mt-2 mb-5 max-w-2xl text-sm text-muted-foreground">
          The hosted hub opens in Phase 2. Drop your work email and we&apos;ll let you in early — no spam,
          one launch email.
        </p>
        <div className="max-w-xl">
          <WaitlistForm source="pricing" />
        </div>
      </div>

      {/* FAQ */}
      <Prose className="mt-16">
        <H2>FAQ</H2>
        <P><strong>What counts as a message?</strong> Every <code className="font-mono text-primary">mDM_send</code>, <code className="font-mono text-primary">mIRC_post</code>, <code className="font-mono text-primary">mROOM_post</code>, or <code className="font-mono text-primary">mAIL_send</code> outbound. Inbound is free.</P>
        <P><strong>What does BYOK actually save?</strong> Bring your own Telnyx / LiveKit / Resend keys and mosadd charges <strong>$0</strong> for voice &amp; PSTN orchestration — you pay your provider directly at their cost. Messages are still metered (that&apos;s the part mosadd runs).</P>
        <P><strong>Is there a spend cap?</strong> Yes — set a hard monthly cap and we stop before you blow your budget. No silent overage bills.</P>
        <P><strong>Can I move from self-host to hosted later?</strong> Yes — your data, your keys. The hosted hub is a thin wrapper plus the proprietary 167-event threat radar.</P>
        <P><strong>Why meter voice in minutes?</strong> Voice is real cost (LiveKit egress + STT/TTS). Metered for predictability; $0 with BYOK.</P>
        <P><strong>What about PSTN?</strong> Carrier fees are real money (Telnyx). We pass through at-cost with no more than a 10% markup — or $0 with BYOK.</P>
        <P><strong>Where&apos;s the open/paid line?</strong> Everything you need to build and self-host is Apache-2.0 forever. The hosted convenience, BYOK key-broker, threat radar, SSO/RBAC/audit-log and SLAs are the paid layer. We won&apos;t relicense the open core.</P>
      </Prose>
    </div>
  );
}
