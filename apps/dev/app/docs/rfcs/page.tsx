import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ol, Ul, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'RFCs',
  description: 'Substantive design decisions, accepted and proposed.',
};

export default function RfcsPage() {
  return (
    <Prose>
      <H1>RFCs</H1>
      <Lead>Substantive design decisions, accepted and proposed.</Lead>

      <P>
        mosadd uses an RFC process for any substantive change (new modules, breaking API, new providers, new bridges). See{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/GOVERNANCE.md">GOVERNANCE.md</Anchor> for the process.
      </P>

      <H2>Accepted</H2>
      <Ul>
        <li>
          <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md">
            <strong>RFC 0001 — m* module naming</strong>
          </Anchor>{' '}
          — every module is <code className="font-mono text-primary">m&lt;NAME&gt;</code> and is an OS-level semantic primitive, not a vendor wrapper
        </li>
      </Ul>

      <H2>Open</H2>
      <P>
        None yet.{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0000-template.md">Propose one →</Anchor>
      </P>

      <H2>Process</H2>
      <Ol>
        <li>Copy the template</li>
        <li>Open a PR with <code className="font-mono">rfc</code> label</li>
        <li>Discussion in PR + linked Discussion</li>
        <li>Maintainer vote</li>
        <li>Merge to <code className="font-mono">docs/rfcs/</code> + implementation PR</li>
      </Ol>
    </Prose>
  );
}
