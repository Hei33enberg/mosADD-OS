import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Table, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Modules',
  description: 'The live m* modules in the mosadd OS — comms channels for AI agents, grouped by job: reach, huddle, remember.',
};

export default function ModulesPage() {
  return (
    <Prose>
      <H1>Modules</H1>
      <Lead>The four m* modules — mDM (the only E2EE one), mIRC, mURL and mAYL — plus capabilities and the Irondome security pillar. Only mDM is end-to-end encrypted; the rest are server-readable (encrypted in transit and at rest).</Lead>

      <P>
        Per <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md">RFC 0001</Anchor>, every module is named{' '}
        <code className="font-mono text-primary">m&lt;NAME&gt;</code> and is an OS-level semantic primitive — not a vendor wrapper.
      </P>

      <H2>Native channels</H2>
      <Table
        headers={['Module', 'Posture', 'Description', 'Status']}
        rows={[
          [<Anchor key="mdm" href="/docs/modules/mdm">mDM</Anchor>, 'E2EE', 'E2EE-by-default 1:1 text + full-duplex voice/video — X3DH + Double Ratchet, Ed25519 identity, forward secrecy; operator cannot read content', 'alpha'],
          [<Anchor key="mirc" href="/docs/modules/mirc">mIRC</Anchor>, 'server-readable', 'Persistent channels (Discord/Slack semantics) — also the embeddable website-chat widget engine', 'alpha'],
          [<Anchor key="murl" href="/docs/modules/murl">mURL</Anchor>, 'server-readable', 'Open-web rooms — live chat on any website or via a single link; no account', 'alpha'],
          [<Anchor key="mail" href="/docs/modules/mail">mAYL</Anchor>, 'server-readable', 'Mail — every user gets <userId>@mosadd.com; send/view/list/delete + open/click/forward tracking + inbound-mail notify', 'alpha'],
        ]}
      />
      <P>73 tools across the toolkit.</P>

      <H2>Capabilities</H2>
      <P>Capabilities ride inside the modules — they are not modules themselves.</P>
      <Table
        headers={['Capability', 'Description', 'Status']}
        rows={[
          [<Anchor key="mtalk" href="/docs/modules/mtalk">mTALK</Anchor>, 'Push-to-talk with LLM-in-room support', 'alpha'],
          [<Anchor key="mrag" href="/docs/modules/mrag">mRAG</Anchor>, 'Per-tenant agent memory — semantic recall (RAG) + list/delete indexed sources', 'alpha'],
        ]}
      />

      <H2>Security</H2>
      <Table
        headers={['Module', 'Posture', 'Description', 'Status']}
        rows={[
          [<Anchor key="threat-engine" href="/docs/modules/threat-engine">Irondome</Anchor>, 'on-device', 'Irondome — the on-device security pillar: device-integrity + network-anomaly monitoring, incl. mercenary-spyware C2 lookups; embeddable engine', 'alpha'],
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
