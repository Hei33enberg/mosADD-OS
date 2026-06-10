import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Table, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Data Processing Addendum',
  description: 'The DPA governing mosadd as a processor of personal data on your behalf — GDPR Article 28.',
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Prose>
        <H1>Data Processing Addendum</H1>
        <Lead>This DPA forms part of the <Anchor href="/legal/terms">Terms of Service</Anchor> and applies where mosadd processes personal data on your behalf (you = controller, mosadd = processor) under GDPR Article 28.</Lead>
        <Callout type="info">
          Last updated: 10 June 2026. For a countersigned copy for your records, email <Anchor href="mailto:legal@mosadd.com">legal@mosadd.com</Anchor>.
        </Callout>

        <H2>1. Roles &amp; scope</H2>
        <P>You are the controller of the personal data you submit through the service; mosadd is the processor. mosadd processes that data only on your documented instructions (these terms and your use of the service) and as required by law.</P>

        <H2>2. Subject-matter of processing (Annex)</H2>
        <Table
          headers={['Item', 'Detail']}
          rows={[
            ['Subject-matter', 'Provision of the mosadd hosted communications service'],
            ['Duration', 'For the term of the agreement, until deletion/return'],
            ['Nature & purpose', 'Transport, routing, storage and delivery of communications and related metadata'],
            ['Data categories', 'Account identifiers, usage metadata, message metadata; message content as ciphertext for E2EE channels'],
            ['Data subjects', 'Your end users and the agents/operators using your keys'],
          ]}
        />

        <H2>3. Sub-processors</H2>
        <P>You authorise mosadd to engage the sub-processors listed in our <Anchor href="/legal/privacy">Privacy Policy</Anchor> (Supabase, Stripe, Resend, Vercel, Cloudflare, PostHog). We will give notice of new sub-processors and remain responsible for their performance.</P>

        <H2>4. Security measures</H2>
        <Ul>
          <li>Encryption in transit; end-to-end encryption for message content (zero-knowledge — we hold only ciphertext).</li>
          <li>Hashed API keys, least-privilege service access, row-level security on the database.</li>
          <li>Rate limiting, threat detection and abuse controls; append-only audit where applicable.</li>
        </Ul>

        <H2>5. Data-subject requests &amp; assistance</H2>
        <P>We will, taking into account the nature of processing, assist you in responding to data-subject requests and in meeting your obligations under Articles 32–36 (security, breach notification, DPIAs).</P>

        <H2>6. Personal-data breach</H2>
        <P>We will notify you without undue delay after becoming aware of a personal-data breach affecting your data, with the information you need to meet your own notification duties.</P>

        <H2>7. Deletion &amp; return</H2>
        <P>On termination, or on your request, we will delete or return the personal data we process on your behalf, save where retention is required by law.</P>

        <H2>8. International transfers &amp; audits</H2>
        <P>Where data leaves the EEA we rely on adequacy decisions or EU Standard Contractual Clauses. We make available the information necessary to demonstrate compliance with Article 28 and will allow for reasonable audits subject to confidentiality.</P>

        <p className="mt-8 text-xs text-muted-foreground">This DPA is read together with the <Anchor href="/legal/terms">Terms of Service</Anchor> and <Anchor href="/legal/privacy">Privacy Policy</Anchor>.</p>
      </Prose>
    </div>
  );
}
