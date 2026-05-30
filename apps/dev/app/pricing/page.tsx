import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Callout, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Tier preview for the Phase 2 hosted mosadd hub.',
};

type Tier = {
  id: string;
  name: string;
  blurb: string;
  price: string;
  unit?: string;
  highlight?: boolean;
  features: string[];
  cta: { label: string; href: string };
};

const tiers: Tier[] = [
  {
    id: 'oss',
    name: 'Self-host',
    blurb: 'Run the whole stack yourself. Apache-2.0 forever.',
    price: '$0',
    features: [
      '@m0ssad/mcp + all SDK adapters',
      'All 32 tools, all m* modules',
      'Bring your own keys (Telnyx, Resend, LiveKit, Supabase)',
      'Community support — GitHub Discussions',
      'No telemetry, no phone-home',
    ],
    cta: { label: 'Get started', href: '/docs/quickstart' },
  },
  {
    id: 'free',
    name: 'Free',
    blurb: 'Hosted MCP, no setup. Start playing in 60 seconds.',
    price: '$0',
    features: [
      'Hosted MCP at mcp.mosadd.com',
      '100 messages / month',
      '30 minutes mTALK / month',
      '0 PSTN minutes',
      'Single project',
      'Best-effort uptime',
    ],
    cta: { label: 'Coming Phase 2', href: '#status' },
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For solo builders shipping production agents.',
    price: '$9',
    unit: '/mo',
    highlight: true,
    features: [
      'Everything in Free',
      '10,000 messages / month',
      '10 hours mTALK / month',
      '60 PSTN minutes / month',
      'Single anonymous DID',
      'Email support',
      '99.5% uptime SLO',
    ],
    cta: { label: 'Coming Phase 2', href: '#status' },
  },
  {
    id: 'team',
    name: 'Team',
    blurb: 'For startup teams running multiple agents.',
    price: '$49',
    unit: '/mo',
    features: [
      'Everything in Pro',
      '100,000 messages / month',
      '100 hours mTALK / month',
      '600 PSTN minutes / month',
      'Up to 5 DIDs',
      'Shared projects, role-based access',
      '99.9% uptime SLO',
    ],
    cta: { label: 'Coming Phase 2', href: '#status' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    blurb: 'Self-host Docker + BYOK + SLA + NIS2 audit log.',
    price: 'Custom',
    features: [
      'Self-hosted in your VPC',
      'BYOK key broker for every provider',
      'NIS2-compliant audit log retention',
      'Threat radar 167-event feed',
      'Dedicated Slack channel + DPA',
      '99.95% uptime SLO',
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
          Open-source forever. Hosted hub freemium. Enterprise self-host with BYOK + SLA.
        </Lead>
        <Callout type="info" id="status">
          <strong>Phase 2 preview.</strong> The hosted hub at{' '}
          <code className="font-mono text-radar-green">hub.mosadd.com</code> lands after the public OS core ships.
          Self-host is available today via <Anchor href="/download">Download</Anchor>.
        </Callout>
      </Prose>

      <div className="grid lg:grid-cols-5 gap-4 mt-12">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col rounded-lg p-5 border ${
              t.highlight
                ? 'border-radar-green/60 bg-radar-green/[0.04]'
                : 'border-neutral-800 bg-neutral-900/30'
            }`}
          >
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{t.id}</div>
            <div className="font-display text-xl text-neutral-100 mb-1">{t.name}</div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{t.blurb}</p>
            <div className="mb-5">
              <span className="font-display text-3xl text-neutral-50">{t.price}</span>
              {t.unit ? <span className="text-sm text-neutral-500">{t.unit}</span> : null}
            </div>
            <ul className="text-xs text-neutral-300 space-y-2 mb-6 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-radar-green mt-0.5">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={t.cta.href}
              className={`block text-center px-3 py-2 rounded text-sm font-medium transition ${
                t.highlight
                  ? 'bg-radar-green text-black hover:bg-radar-green/90'
                  : 'border border-neutral-700 text-neutral-200 hover:border-neutral-500'
              }`}
            >
              {t.cta.label} →
            </a>
          </div>
        ))}
      </div>

      <Prose className="mt-16">
        <H2>FAQ</H2>
        <P><strong>What counts as a message?</strong> Every <code className="font-mono text-radar-green">mDM_send</code>, <code className="font-mono text-radar-green">mIRC_post</code>, <code className="font-mono text-radar-green">mROOM_post</code>, or <code className="font-mono text-radar-green">mAIL_send</code> outbound. Inbound is free.</P>
        <P><strong>Can I move from self-host to hosted later?</strong> Yes — your data, your keys. The hosted hub is a thin wrapper plus the 167-event threat radar (which is proprietary).</P>
        <P><strong>Why is mTALK metered in minutes?</strong> Voice is expensive (LiveKit egress + STT/TTS). Metered for cost predictability.</P>
        <P><strong>What about PSTN?</strong> PSTN minutes cost real money (Telnyx + carrier fees). We pass through at-cost in Pro+ and don't markup more than 10%.</P>
      </Prose>
    </div>
  );
}
