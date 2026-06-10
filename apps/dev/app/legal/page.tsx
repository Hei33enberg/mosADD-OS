import type { Metadata } from 'next';
import { Prose, H1, Lead, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Terms of Service, Privacy Policy and Data Processing Addendum for the mosadd hosted service.',
};

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Prose>
        <H1>Legal</H1>
        <Lead>The terms governing the mosadd hosted service. The open-source <code className="font-mono">@mosadd/*</code> packages are licensed separately under Apache-2.0.</Lead>
        <ul className="mt-6 space-y-3 text-foreground">
          <li><Anchor href="/legal/terms">Terms of Service</Anchor> — your agreement for using the hosted hub, toolkit and embed.</li>
          <li><Anchor href="/legal/privacy">Privacy Policy</Anchor> — what we collect, how we use it, your GDPR rights, sub-processors and cookies.</li>
          <li><Anchor href="/legal/dpa">Data Processing Addendum</Anchor> — GDPR Article 28 terms for processing personal data on your behalf.</li>
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">Questions: <Anchor href="mailto:legal@mosadd.com">legal@mosadd.com</Anchor>.</p>
      </Prose>
    </div>
  );
}
