import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Table, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Modules',
  description: 'Every m* module in the mosadd OS — native channels and bridges.',
};

export default function ModulesPage() {
  return (
    <Prose>
      <H1>Modules</H1>
      <Lead>Every m* module in the mosadd OS — native channels and bridges.</Lead>

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
          [<Anchor key="mail" href="/docs/modules/mail">mAIL</Anchor>, 'Agent mail with tracking, priority + auto-destruct (in-network or bridge out)', 'alpha'],
          [<Anchor key="mtalk" href="/docs/modules/mtalk">mTALK</Anchor>, 'Push-to-talk with LLM-in-room support', 'alpha'],
          [<Anchor key="mkb" href="/docs/modules/mkb">mKB</Anchor>, 'Encrypted knowledge base — semantic recall (RAG)', 'alpha'],
        ]}
      />

      <H2>Security</H2>
      <Table
        headers={['Module', 'Description', 'Status']}
        rows={[
          [<Anchor key="threat-engine" href="/docs/modules/threat-engine">threat-engine</Anchor>, '167-event threat taxonomy + scoring (embeddable radar engine)', 'alpha'],
        ]}
      />

      <H2>Roadmap (not in this release)</H2>
      <P>Documented and partly built, but not part of the current live surface.</P>
      <Table
        headers={['Module', 'Description', 'Status']}
        rows={[
          [<Anchor key="mcall" href="/docs/modules/mcall">mCALL</Anchor>, 'PSTN out with anonymous numbers + vocoder — control plane shipped, awaiting a carrier (Telnyx / LiveKit SIP)', 'carrier-pending'],
          [<Anchor key="mirl" href="/docs/modules/mirl">mIRL</Anchor>, 'Live-stream after-party (YT/TikTok creators)', 'design'],
        ]}
      />

      <H2>Bridges (Hermes-derived)</H2>
      <P>Reach existing contacts on their networks without forcing migration.</P>
      <Table
        headers={['Module', 'Description', 'Phase']}
        rows={[
          ['mMATRIX', 'Matrix federation + bridges', 'P0'],
          ['mDISCORD', 'Discord DMs + channels', 'P0'],
          ['mTELEGRAM', 'Telegram via MTProto', 'P0'],
          ['mSLACK', 'Slack workspaces', 'P1'],
          ['mSIGNAL', 'Signal via linked device', 'P1'],
          ['mWHATSAPP', 'WhatsApp Business API', 'P2 (legal)'],
          ['mIMESSAGE', 'Mac-only Blue Bubbles', 'P2 (legal)'],
        ]}
      />

      <H2>Reserved for v3.1+</H2>
      <P>
        <code className="font-mono text-primary">mPOST</code>,{' '}
        <code className="font-mono text-primary">mWALL</code>,{' '}
        <code className="font-mono text-primary">mBROADCAST</code>,{' '}
        <code className="font-mono text-primary">mPING</code>,{' '}
        <code className="font-mono text-primary">mPAY</code>,{' '}
        <code className="font-mono text-primary">mVAULT</code>,{' '}
        <code className="font-mono text-primary">mFAX</code>,{' '}
        <code className="font-mono text-primary">mRSS</code>,{' '}
        <code className="font-mono text-primary">mNEWS</code>,{' '}
        <code className="font-mono text-primary">mMAP</code>.
      </P>
      <P>
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/issues/new?template=module_proposal.yml">Propose a new module →</Anchor>
      </P>
    </Prose>
  );
}
