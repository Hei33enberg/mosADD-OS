import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Table, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How mosadd collects, uses and protects personal data — GDPR-aligned, with a zero-knowledge stance on message content.',
};

export default function PrivacyPage() {
  return (
    <Prose className="px-6 py-14">
        <H1>Privacy Policy</H1>
        <Lead>How we handle personal data for the mosadd hosted service. We are privacy-first by design: for end-to-end-encrypted channels we store only ciphertext and never hold the keys to read it.</Lead>
        <Callout type="info">
          Last updated: 10 June 2026. Data controller: <strong>[mosadd operating entity]</strong>, contactable at <Anchor href="mailto:privacy@mosadd.com">privacy@mosadd.com</Anchor>.
        </Callout>

        <H2>1. What we collect</H2>
        <Ul>
          <li><strong>Account data</strong> — your email and authentication identifiers (via GitHub or magic link).</li>
          <li><strong>API keys</strong> — stored hashed; we cannot recover the plaintext.</li>
          <li><strong>Usage &amp; telemetry</strong> — message/MAT counters, plan, timestamps, IP and coarse request metadata used for quotas, billing, security and abuse-prevention.</li>
          <li><strong>Billing data</strong> — handled by Stripe; we store a customer id and plan, not card numbers.</li>
          <li><strong>Message content</strong> — for E2EE channels we store only opaque ciphertext. For non-encrypted paths, message metadata is processed to deliver and route the message.</li>
        </Ul>

        <H2>2. How we use it &amp; legal bases</H2>
        <Ul>
          <li><strong>To provide the service</strong> (performance of a contract) — auth, routing, quotas, billing.</li>
          <li><strong>Security &amp; abuse prevention</strong> (legitimate interest) — rate limiting, threat detection, integrity.</li>
          <li><strong>Product analytics</strong> (legitimate interest / consent where required) — aggregate usage to improve the product.</li>
          <li><strong>Legal compliance</strong> — where we must retain or disclose data by law.</li>
        </Ul>

        <H2>3. Sub-processors</H2>
        <P>We use the following processors to run the service. Each is bound by data-protection terms.</P>
        <Table
          headers={['Processor', 'Purpose', 'Region']}
          rows={[
            ['Supabase', 'Database, auth, edge functions', 'EU (eu-central)'],
            ['Stripe', 'Payments & billing', 'EU / US'],
            ['Resend', 'Transactional & mp0st email', 'EU / US'],
            ['Vercel', 'Web hosting & analytics', 'EU / US'],
            ['Cloudflare', 'Edge, CDN, real-time transport', 'Global'],
            ['PostHog', 'Product analytics', 'EU'],
          ]}
        />

        <H2>4. International transfers</H2>
        <P>Where data is transferred outside the EEA, we rely on adequacy decisions or EU Standard Contractual Clauses with the relevant processor.</P>

        <H2>5. Retention</H2>
        <P>Account data is kept while your account is active and deleted (or anonymised) on request or after closure. Operational logs and telemetry are retained for up to 30 days unless a longer period is required for security or legal reasons.</P>

        <H2>6. Your rights</H2>
        <P>If you are in the EEA/UK you have the right to access, rectify, erase, restrict, port and object to processing of your personal data, and to lodge a complaint with your supervisory authority. To exercise any right, email <Anchor href="mailto:privacy@mosadd.com">privacy@mosadd.com</Anchor>.</P>

        <H2>7. Cookies &amp; analytics</H2>
        <H3>Essential</H3>
        <P>We use strictly-necessary cookies/local storage to keep you signed in and to operate the hub. These cannot be switched off.</P>
        <H3>Analytics</H3>
        <P>We use privacy-respecting product analytics (Vercel, PostHog). Where required by law we ask for consent before setting non-essential cookies; you can decline without losing access to the core service.</P>

        <H2>8. Security &amp; children</H2>
        <P>We apply technical and organisational measures appropriate to the risk (encryption in transit, E2EE for message content, least-privilege access, append-only audit where applicable). The service is not directed to children under 16.</P>

        <H2>9. Changes</H2>
        <P>We will post updates here with a new “last updated” date. See also our <Anchor href="/legal/terms">Terms of Service</Anchor> and <Anchor href="/legal/dpa">Data Processing Addendum</Anchor>.</P>
      </Prose>
  );
}
