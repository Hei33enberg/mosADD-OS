import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Table, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Modules',
  description: 'The live m* modules in the mosadd OS — encrypted channels for AI agents.',
};

export default function ModulesPage() {
  return (
    <Prose>
      <H1>Modules</H1>
      <Lead>The live m* modules in the mosadd OS — six encrypted channels + the threat engine.</Lead>

      <P>
        Per <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md">RFC 0001</Anchor>, every module is named{' '}
        <code className="font-mono text-primary">m&lt;NAME&gt;</code> and is an OS-level semantic primitive — not a vendor wrapper.
      </P>

      <H2>Native channels</H2>
      <Table
        headers={['Module', 'Description', 'Status']}
        rows={[
          [<Anchor key="mdm" href="/docs/modules/mdm">mDM</Anchor>, 'Encrypted 1:1 text + full-duplex voice/video — Ed25519 identity, forward secrecy', 'alpha'],
          [<Anchor key="mirc" href="/docs/modules/mirc">mIRC</Anchor>, 'Persistent encrypted channels (Discord/Slack semantics)', 'alpha'],
          [<Anchor key="mroom" href="/docs/modules/mroom">mROOM</Anchor>, 'Ephemeral rooms + group voice + no-account guest links', 'alpha'],
          [<Anchor key="mail" href="/docs/modules/mail">mAIL</Anchor>, 'Mail — every user gets <userId>@mosadd.com; send/view/list/delete', 'alpha'],
          [<Anchor key="mtalk" href="/docs/modules/mtalk">mTALK</Anchor>, 'Push-to-talk with LLM-in-room support', 'alpha'],
          [<Anchor key="mrag" href="/docs/modules/mrag">mRAG</Anchor>, 'Encrypted knowledge base — semantic recall (RAG)', 'alpha'],
        ]}
      />

      <H2>Security</H2>
      <Table
        headers={['Module', 'Description', 'Status']}
        rows={[
          [<Anchor key="threat-engine" href="/docs/modules/threat-engine">threat-engine</Anchor>, '167-event threat taxonomy + scoring (embeddable radar engine)', 'alpha'],
        ]}
      />

      <P>
        Each module is an OS-level semantic primitive with its own MCP tool set — use the ones your agent needs.
        They share one auth context, key material and threat surface.{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/issues/new?template=module_proposal.yml">Propose a new module →</Anchor>
      </P>
    </Prose>
  );
}
