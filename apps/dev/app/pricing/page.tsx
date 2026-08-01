import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Callout, Anchor } from '../_components/Prose';
import { ComparisonTable } from '../_components/ComparisonTable';
import { Calculator } from '../_components/Calculator';
import {
  PLANS,
  OVERAGE_RATE_USD,
  SPEND_CAP_MULTIPLIER,
  fmtLimit,
  type Plan,
} from '../_lib/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Hosted dev-hub pricing: Free, Pro $19/mo, Team $49/mo, Enterprise custom. Usage-based (MAT) with a hard spend cap. Self-host is free forever (Apache-2.0).',
};

/**
 * Every number on this page derives from app/_lib/plans.ts — the canonical plan
 * definitions the hosted hub bills against. Do NOT hand-type a price or quota
 * here: a third copy is exactly how the $9/$29-display vs $19/$49-billing
 * mismatch shipped (audit LINEAR-5066 B-10).
 */

type Presentation = {
  blurb: string;
  extras: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
};

const PRESENTATION: Record<Plan['id'], Presentation> = {
  free: {
    blurb: 'Try the hosted hub. No card.',
    extras: ['No card, no overage — a hard stop at the cap, never a bill'],
    cta: { label: 'Sign up', href: 'https://mosadd.com/keys' },
  },
  pro: {
    blurb: 'For solo devs shipping agents to production.',
    extras: [
      `Pay-as-you-go overage $${OVERAGE_RATE_USD}/MAT`,
      `Default hard spend cap: ${SPEND_CAP_MULTIPLIER}× plan price — billing stops there`,
    ],
    cta: { label: 'Start Pro', href: 'https://mosadd.com/keys?plan=pro' },
    highlight: true,
  },
  team: {
    blurb: 'For teams running agent traffic at volume.',
    extras: [
      `Pay-as-you-go overage $${OVERAGE_RATE_USD}/MAT`,
      `Default hard spend cap: ${SPEND_CAP_MULTIPLIER}× plan price — billing stops there`,
      'White-label — the "powered by mosadd" badge off',
    ],
    cta: { label: 'Start Team', href: 'https://mosadd.com/keys?plan=team' },
  },
  enterprise: {
    blurb: 'Custom volume, custom controls, a contract.',
    extras: [
      'Custom caps and billing',
      'SSO / SAML · RBAC · audit-log retention — scoped per contract',
      'Apache-2.0 self-host is free forever',
    ],
    cta: {
      label: 'Talk to us',
      href: 'mailto:hello@mosadd.com?subject=mosadd%20Enterprise',
    },
  },
};

/** Feature bullets derived from the canonical Plan object — no hand-typed quotas. */
function planFeatures(p: Plan): string[] {
  const f: string[] = [];
  f.push(`${fmtLimit(p.mat)} thread-actions (MAT) / mo`);
  f.push(`${fmtLimit(p.messages)} outbound messages / mo`);
  if (p.ragSearches === 0) f.push('mRAG search: off');
  else f.push(`${fmtLimit(p.ragSearches)} mRAG searches / mo`);
  f.push(`${fmtLimit(p.embedKeys)} embed ${p.embedKeys === 1 ? 'key' : 'keys'}`);
  f.push(`${fmtLimit(p.hubKeys)} hub (MCP) ${p.hubKeys === 1 ? 'key' : 'keys'}`);
  return f;
}

const order: Plan['id'][] = ['free', 'pro', 'team', 'enterprise'];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <Prose>
        <H1>Pricing</H1>
        <Lead>
          <strong>Usage-based, capped, honest.</strong> The hosted hub meters{' '}
          <strong>MATs</strong> — Monthly Active Thread-actions: one delivered,
          threat-scored message or action, deduplicated per sender per calendar
          month. A flat plan covers your volume; past the cap, paid plans pay as
          they go until a hard spend cap stops the bill. Self-hosting the
          Apache-2.0 toolkit is free forever.
        </Lead>
        <Callout type="success" id="status">
          <strong>LIVE now.</strong> Self-serve sign-up at{' '}
          <Anchor href="https://mosadd.com/keys">mosadd.com/keys</Anchor> — create a key, then run{' '}
          <code className="font-mono text-primary">npx -y @mosadd/mcp@alpha</code> (toolkit) and point it at the hosted gateway.
        </Callout>
      </Prose>

      {/* Tiers — every number read from _lib/plans.ts */}
      <div className="grid lg:grid-cols-4 gap-4 mt-12">
        {order.map((id) => {
          const p = PLANS[id];
          const pres = PRESENTATION[id];
          const features =
            id === 'enterprise'
              ? ['Custom / unlimited quotas', ...pres.extras]
              : [...planFeatures(p), ...pres.extras];
          return (
            <div
              key={p.id}
              className={`flex flex-col rounded-none p-5 border ${
                pres.highlight ? 'border-primary/60 bg-primary/[0.04]' : 'border-border bg-card/40'
              }`}
            >
              {pres.highlight ? (
                <div className="mb-2 inline-block w-fit border border-primary/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                  Most popular
                </div>
              ) : (
                <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{p.id}</div>
              )}
              <div className="font-display text-xl text-foreground mb-1">{p.label}</div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pres.blurb}</p>
              <div className="mb-5">
                <span className="font-display text-3xl text-foreground">{p.price}</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary mt-0.5">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={pres.cta.href}
                className={`block text-center px-3 py-2 rounded-none text-sm font-medium transition ${
                  pres.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border text-foreground hover:border-primary/50'
                }`}
              >
                {pres.cta.label} →
              </a>
            </div>
          );
        })}
      </div>

      {/* How the meter works */}
      <div className="mt-16">
        <Prose>
          <H2>How the meter works</H2>
          <P>
            A <strong>MAT</strong> (Monthly Active Thread-action) is one delivered, threat-scored
            message or action, deduplicated per sender per calendar month. Heartbeats, retries and
            re-sends inside the same thread don&apos;t stack the meter.
          </P>
        </Prose>
        <div className="mt-6 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">MAT / mo</th>
                <th className="px-4 py-3 font-medium">Messages / mo</th>
                <th className="px-4 py-3 font-medium">mRAG searches</th>
                <th className="px-4 py-3 font-medium">Over the cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              {order.map((id) => {
                const p = PLANS[id];
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-foreground">
                      {p.label} · {p.price}
                    </td>
                    <td className="px-4 py-3">{fmtLimit(p.mat)}</td>
                    <td className="px-4 py-3">{fmtLimit(p.messages)}</td>
                    <td className="px-4 py-3">{fmtLimit(p.ragSearches)}</td>
                    <td className="px-4 py-3">
                      {p.id === 'free'
                        ? 'hard stop — never billed'
                        : p.priceUsd == null
                          ? 'per contract'
                          : `$${OVERAGE_RATE_USD}/MAT, capped at ${SPEND_CAP_MULTIPLIER}× plan ($${p.priceUsd * SPEND_CAP_MULTIPLIER}/mo default)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Prose>
          <P>
            The spend cap is a default, not a trap — raise or lower it from your hub dashboard.
            Billing stops at the cap; your traffic degrades gracefully instead of your card.
          </P>
        </Prose>
      </div>

      {/* Estimate */}
      <div className="mt-16">
        <Prose>
          <H2>Estimate your bill</H2>
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
          Open code to audit today; enterprise controls scoped per contract.
        </p>
        <div className="grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
          {[
            'Apache-2.0 source — audit every line before you deploy',
            'Self-host the toolkit in your own environment (BYOK)',
            'E2EE by default (X3DH + Double Ratchet) on mDM — operator cannot read content',
            'BYOK key broker — your provider keys never leave you',
            'Irondome on-device threat classification (defensive, signals-only)',
            'SSO / SAML · RBAC · audit-log retention · DPA · SLA — Enterprise, scoped per contract',
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
        <P>
          <strong>What exactly is a MAT?</strong> One delivered, threat-scored message or action,
          deduplicated per sender per calendar month. It&apos;s the unit the hosted hub actually
          bills — the same constant drives the meter and this page, so the number you see is the
          number you&apos;re charged against.
        </P>
        <P>
          <strong>What happens when I hit my cap?</strong> On Free: a hard stop — nothing is ever
          billed. On Pro/Team: pay-as-you-go at ${OVERAGE_RATE_USD}/MAT until your spend cap
          (default {SPEND_CAP_MULTIPLIER}× plan price), where billing stops.
        </P>
        <P>
          <strong>Can I move from self-host to hosted later?</strong> Yes — your data, your keys.
          The Apache-2.0 self-host has the same data model; point your account at the hosted hub
          when you want the convenience.
        </P>
        <P>
          <strong>What about voice (mTALK)?</strong> mTALK push-to-talk is live. Carrier/media fees
          are pass-through at-cost (≤10% markup) or $0 with BYOK (your own LiveKit keys). Same
          logic for Resend (email).
        </P>
        <P>
          <strong>Where&apos;s the open/paid line?</strong> Everything you need to build and
          self-host is Apache-2.0 forever. The hosted hub, the BYOK key-broker, embeds at volume,
          white-label and the enterprise controls are the paid layer. We won&apos;t relicense the
          open core.
        </P>
      </Prose>
    </div>
  );
}
