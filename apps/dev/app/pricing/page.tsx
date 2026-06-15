import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Callout, Anchor } from '../_components/Prose';
import { Calculator } from '../_components/Calculator';
import { ComparisonTable } from '../_components/ComparisonTable';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Open-source forever. Hosted hub usage-based with a generous free tier and BYOK = $0. Estimate your cost vs a hand-wired Twilio + LiveKit + Resend stack.',
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
      'All 61 tools across 6 live modules',
      'Bring your own keys (LiveKit, Resend, OpenAI, Supabase)',
      'Unlimited MAT, msg, search — you pay your own infra',
      'Community support · GitHub Discussions',
    ],
    cta: { label: 'Get started', href: '/docs/quickstart' },
  },
  {
    id: 'free',
    name: 'Free',
    blurb: 'Hosted — ship in 60 seconds. One plan unlocks every product.',
    price: '$0',
    unit: '/ mo (hosted)',
    features: [
      '1,000 MAT (embed talkers) / mo',
      '1,000 outbound messages / mo (MCP toolkit)',
      'RAG search: off',
      '1 embed key · 1 hub key',
      '"powered by mosadd" badge shown',
    ],
    cta: { label: 'Sign up', href: 'https://mosadd.dev/hub' },
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For active creators + solo devs shipping production agents.',
    price: '$9',
    unit: '/ mo',
    highlight: true,
    features: [
      '10,000 MAT · 10,000 outbound messages',
      '1,000 RAG searches / mo',
      '5 embed keys · 5 hub keys · custom CSS skin',
      'PAYG overage at $0.001 / extra MAT, capped 2× plan price',
      'Badge removal +$3/mo addon (or keep it)',
    ],
    cta: { label: 'Start Pro', href: 'https://mosadd.dev/embed/new?plan=pro' },
  },
  {
    id: 'team',
    name: 'Team',
    blurb: 'For newsrooms, agencies, creator companies.',
    price: '$29',
    unit: '/ mo',
    features: [
      '100,000 MAT · 100,000 outbound messages',
      '10,000 RAG searches / mo',
      'Unlimited embed + hub keys · white-label (badge off)',
      'Webhooks · audit log · multi-tenant',
      'PAYG overage at $0.001 / extra MAT, capped 2× plan price',
    ],
    cta: { label: 'Start Team', href: 'https://mosadd.dev/embed/new?plan=team' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    blurb: 'Dedicated infra + SSO/DPA/NIS2 + SLA.',
    price: 'Custom',
    features: [
      'Unlimited MAT / messages / RAG searches',
      'SSO / SAML · RBAC · NIS2 audit-log retention',
      'DPA · dedicated infra · 99.95% SLO',
      'Threat radar 166-event feed',
      'Self-host in your VPC also supported',
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
          <strong>One plan unlocks every product</strong> — embed widget, MCP toolkit, RAG, hub keys. Open-source
          self-host is free forever. Hosted starts at $0 with generous limits, hard cap = 2× plan price.
          You never get a surprise bill.
        </Lead>
        <Callout type="success" id="status">
          <strong>LIVE now.</strong> Self-serve sign-up at{' '}
          <Anchor href="https://mosadd.dev/hub">mosadd.dev/hub</Anchor> — create a key, copy the snippet, paste
          on your blog (embed) or run <code className="font-mono text-primary">npx -y @mosadd/mcp@alpha</code> (toolkit).
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
            <a
              href={t.cta.href}
              className={`block text-center px-3 py-2 rounded-none text-sm font-medium transition ${
                t.highlight
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-border text-foreground hover:border-primary/50'
              }`}
            >
              {t.cta.label} →
            </a>
          </div>
        ))}
      </div>

      {/* What's a MAT? */}
      <div className="mt-16">
        <Prose>
          <H2>What counts as a MAT?</H2>
          <P>
            A <strong>MAT</strong> (Monthly Active Thread-action) is one delivered, threat-scored
            message or tracked action — a sent DM, a channel post, a tracked email open, a granted voice
            floor. Unlike a raw API or tool call, <strong>every MAT carries delivery and threat-radar
            scoring</strong> (and end-to-end encryption on private DMs), so one MAT is worth more than one
            bare call elsewhere.
          </P>
        </Prose>
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Included MAT / mo</th>
                <th className="px-4 py-3 font-medium">Overage</th>
                <th className="px-4 py-3 font-medium">Roughly fits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr><td className="px-4 py-3 text-foreground">Free</td><td className="px-4 py-3">1,000</td><td className="px-4 py-3">hard stop · no card on file</td><td className="px-4 py-3">a hobby bot / first integration</td></tr>
              <tr><td className="px-4 py-3 text-foreground">Pro · $9</td><td className="px-4 py-3">10,000</td><td className="px-4 py-3">$0.001 / MAT, capped 2× plan</td><td className="px-4 py-3">a production agent</td></tr>
              <tr><td className="px-4 py-3 text-foreground">Team · $29</td><td className="px-4 py-3">100,000</td><td className="px-4 py-3">$0.001 / MAT, capped 2× plan</td><td className="px-4 py-3">a small product / newsroom</td></tr>
            </tbody>
          </table>
        </div>
        <Prose>
          <P>
            For scale: <strong>$0.001 / MAT = $1 per 1,000</strong> delivered, threat-scored
            actions — delivery and radar included (E2EE on private DMs). A raw tool-call on a tool-aggregator buys
            none of that. Your hard spend cap (default 2× plan price) means you never get a surprise bill.
          </P>
        </Prose>
      </div>

      {/* Calculator */}
      <div className="mt-16">
        <Prose>
          <H2>Estimate your cost</H2>
          <P>
            Drag the sliders. We show the cheapest mosadd plan for your usage and what the same stack would
            cost wired by hand across Twilio, LiveKit and Resend.
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
            'Threat radar: 166-event scoring across every channel',
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

      {/* FAQ */}
      <Prose className="mt-16">
        <H2>FAQ</H2>
        <P><strong>What is a MAT?</strong> <em>Monthly Active Talker</em> — a unique visitor that <em>sends at least one message</em> to one of your embeds in a calendar month. Viewers, reconnects, lurkers — all free. Repeat senders in the same month count once. We dedupe in Postgres, idempotent.</P>
        <P><strong>What counts as a message?</strong> Every <code className="font-mono text-primary">mDM_send</code>, <code className="font-mono text-primary">mIRC_post</code>, <code className="font-mono text-primary">mROOM_post</code>, or <code className="font-mono text-primary">mAIL_send</code> outbound from the MCP toolkit. Inbound is free.</P>
        <P><strong>Why one unified plan instead of separate prices?</strong> Most users want both: a creator wants the embed for visitors AND the MCP toolkit for their own bots. Charging once is simpler. Pro $9 unlocks 10k MAT + 10k msg + 1k RAG — pick whichever fits and the others come along.</P>
        <P><strong>Is there a spend cap?</strong> Yes — hard cap = 2× your plan price. When you hit it, the mint endpoint refuses new joiners with a "queue / upgrade" UI. No silent overage bills, ever.</P>
        <P><strong>Can I move from self-host to hosted later?</strong> Yes — your data, your keys. The Apache-2.0 self-host has the same data model; just point your Stripe-paid account at the hosted hub.</P>
        <P><strong>What about voice (mTALK)?</strong> mTALK push-to-talk voice is live. Carrier/media fees are pass-through at-cost (≤10% markup) or $0 with BYOK (your own LiveKit keys). Same logic for Resend (email).</P>
        <P><strong>Where&apos;s the open/paid line?</strong> Everything you need to build and self-host is Apache-2.0 forever. The hosted convenience, BYOK key-broker, threat radar, SSO/RBAC/audit-log and SLAs are the paid layer. We won&apos;t relicense the open core.</P>
      </Prose>
    </div>
  );
}
