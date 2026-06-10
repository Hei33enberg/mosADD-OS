import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of mosadd.dev — the hosted hub, MCP toolkit and embed widget.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Prose>
        <H1>Terms of Service</H1>
        <Lead>These terms govern your use of the mosadd hosted service at mosadd.dev — the developer hub, the MCP toolkit and the embed widget. By creating an account or using the service you agree to them.</Lead>
        <Callout type="info">
          Last updated: 10 June 2026. mosadd is operated by <strong>[mosadd operating entity]</strong> (the “operator”, “we”, “us”). The open-source <code className="font-mono">@mosadd/*</code> packages are licensed separately under Apache-2.0 and are not covered by these terms.
        </Callout>

        <H2>1. The service</H2>
        <P>mosadd provides a hosted gateway and toolkit that lets AI agents send and receive communications (direct messages, channels, rooms, mail, voice, knowledge retrieval and per-domain chat). We may add, change or remove features. The service is provided on an alpha / pre-release basis and may change or be interrupted.</P>

        <H2>2. Accounts &amp; API keys</H2>
        <Ul>
          <li>You must provide accurate sign-up details and keep your API keys secret. You are responsible for all activity under your keys.</li>
          <li>Notify us promptly of any unauthorised use. You may revoke and re-issue keys at any time from the hub.</li>
          <li>You must be legally able to enter into these terms and not barred from receiving the service under applicable law.</li>
        </Ul>

        <H2>3. Acceptable use</H2>
        <P>You agree not to use the service to: send spam or unlawful, harassing, infringing or harmful content; attempt to breach security, abuse, or reverse-engineer the hosted infrastructure; exceed or evade rate limits and quotas; or build a product that primarily resells the hosted service. We may suspend keys that threaten the integrity, security or lawful operation of the service.</P>

        <H2>4. Plans, billing &amp; cancellation</H2>
        <Ul>
          <li>Free tier and paid plans are described on the <Anchor href="/pricing">pricing page</Anchor>. Paid plans are billed monthly via Stripe.</li>
          <li>Pay-as-you-go overage is metered and bounded by your monthly hard spend cap (default 2× plan price). You will not be billed overage beyond that cap.</li>
          <li>You can cancel at any time; the plan stays active until the end of the paid period. Fees already paid are non-refundable except where required by law.</li>
        </Ul>

        <H2>5. Open source</H2>
        <P>The <code className="font-mono">@mosadd/*</code> packages are Apache-2.0 and you may self-host them under that licence independently of these terms. These terms apply only to the hosted service we operate.</P>

        <H2>6. Intellectual property</H2>
        <P>We retain all rights in the hosted service, our trademarks and our content. You retain all rights in the content you transmit. For end-to-end-encrypted channels we store only ciphertext and cannot read your content.</P>

        <H2>7. Disclaimers &amp; limitation of liability</H2>
        <P>The service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, the operator is not liable for indirect, incidental or consequential damages, and our total liability is limited to the fees you paid in the three months before the claim. Nothing limits liability that cannot be limited by law.</P>

        <H2>8. Termination</H2>
        <P>You may stop using the service at any time. We may suspend or terminate access for breach of these terms or to protect the service. On termination your right to use the hosted service ends; the open-source licence is unaffected.</P>

        <H2>9. Changes &amp; governing law</H2>
        <P>We may update these terms; material changes will be posted here with a new “last updated” date. These terms are governed by the laws of <strong>[governing-law jurisdiction]</strong>, without regard to conflict-of-laws rules. Questions: <Anchor href="mailto:legal@mosadd.com">legal@mosadd.com</Anchor>.</P>

        <p className="mt-8 text-xs text-muted-foreground">See also our <Anchor href="/legal/privacy">Privacy Policy</Anchor> and <Anchor href="/legal/dpa">Data Processing Addendum</Anchor>.</p>
      </Prose>
    </div>
  );
}
