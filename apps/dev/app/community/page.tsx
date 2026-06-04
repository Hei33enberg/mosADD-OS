import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Discord, GitHub Discussions, governance — get involved with mosadd-os.',
};

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <H1>Community</H1>
        <Lead>
          mosadd-os is in active alpha, built in the open under Apache-2.0. We need maintainers, RFC authors, bridge devs, and human-OS thinkers.
        </Lead>

        <H2>Where we hang out</H2>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <a
            href="https://github.com/Hei33enberg/mosadd-os/discussions"
            target="_blank"
            rel="noreferrer"
            className="block border border-neutral-800 rounded-lg p-5 hover:border-radar-green/40 hover:bg-neutral-900/50 transition group"
          >
            <div className="text-radar-green text-xs uppercase tracking-widest mb-2">GitHub</div>
            <div className="font-display text-lg text-neutral-100 mb-1 group-hover:text-radar-green transition">Discussions</div>
            <p className="text-sm text-neutral-400">Long-form architecture chats, Q&amp;A, "show &amp; tell" demos.</p>
          </a>
          <a
            href="https://mosadd.com/discord"
            target="_blank"
            rel="noreferrer"
            className="block border border-neutral-800 rounded-lg p-5 hover:border-radar-green/40 hover:bg-neutral-900/50 transition group"
          >
            <div className="text-radar-green text-xs uppercase tracking-widest mb-2">Realtime</div>
            <div className="font-display text-lg text-neutral-100 mb-1 group-hover:text-radar-green transition">Discord</div>
            <p className="text-sm text-neutral-400">Real-time channel coming with Phase 1 community kickoff.</p>
          </a>
          <a
            href="https://github.com/Hei33enberg/mosadd-os/issues"
            target="_blank"
            rel="noreferrer"
            className="block border border-neutral-800 rounded-lg p-5 hover:border-radar-green/40 hover:bg-neutral-900/50 transition group"
          >
            <div className="text-radar-green text-xs uppercase tracking-widest mb-2">Bug tracker</div>
            <div className="font-display text-lg text-neutral-100 mb-1 group-hover:text-radar-green transition">Issues</div>
            <p className="text-sm text-neutral-400">Found a bug, want to suggest a feature, or propose a new module.</p>
          </a>
          <a
            href="https://x.com/mosaddcom"
            target="_blank"
            rel="noreferrer"
            className="block border border-neutral-800 rounded-lg p-5 hover:border-radar-green/40 hover:bg-neutral-900/50 transition group"
          >
            <div className="text-radar-green text-xs uppercase tracking-widest mb-2">Updates</div>
            <div className="font-display text-lg text-neutral-100 mb-1 group-hover:text-radar-green transition">@mosaddcom on X</div>
            <p className="text-sm text-neutral-400">Releases, RFC accept/reject, hardware launches.</p>
          </a>
        </div>

        <H2>Governance</H2>
        <Ul>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/GOVERNANCE.md">GOVERNANCE.md</Anchor> — RFC process, maintainer rules, voting</li>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/CODE_OF_CONDUCT.md">CODE_OF_CONDUCT.md</Anchor> — Contributor Covenant 2.1</li>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/MAINTAINERS.md">MAINTAINERS.md</Anchor> — who has merge rights</li>
          <li><Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</Anchor> — local setup, PR rules</li>
        </Ul>

        <H2>Why contribute</H2>
        <P>
          mosadd is the OSS-first alternative to Twilio Agent Connect, Composio, and LiveKit. We're not a vendor SDK — we're an{' '}
          <strong>operating system</strong> for human communications, and every contributor who lands an m* module or bridge is shaping the kernel layer of the next decade of agent comms.
        </P>
        <P>
          The commercial hub (Phase 2) stays proprietary. The OS layer stays Apache-2.0 forever.{' '}
          <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/TRADEMARK.md">Trademark policy</Anchor>.
        </P>

        <H2>Hall of fame</H2>
        <P>
          Every accepted PR lands a contributor on{' '}
          <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/HALL_OF_FAME.md">HALL_OF_FAME.md</Anchor>.
          Top-50 contributors get lifetime Pro tier on the hosted hub.
        </P>
      </Prose>
    </div>
  );
}
