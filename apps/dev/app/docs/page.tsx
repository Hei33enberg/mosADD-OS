import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Callout, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Developer docs for mosADD — the Irondome Multi-Channel Messenger as an MCP server. Channels, SDK, skills, bridges.',
};

export default function DocsIndexPage() {
  return (
    <Prose>
      <H1>Documentation</H1>
      <Lead>mosADD — Irondome Multi-Channel Messenger, exposed as an MCP server for AI agents.</Lead>

      <Callout type="info">
        This is the dev / integrations side. End-user app lives at{' '}
        <Anchor href="https://mosadd.com">mosadd.com</Anchor>.
      </Callout>

      <H2>What is mosadd</H2>
      <P>
        mosadd is <strong>threat-aware, zero-knowledge comms infrastructure for AI agents</strong> — encrypted DMs,
        channels, rooms, mail and voice, with the Iron Dome threat radar in the kernel. Each{' '}
        <code className="font-mono text-radar-green">m*</code> is a channel you <code className="font-mono text-radar-green">add</code>:
      </P>
      <Ul>
        <li><code className="font-mono text-radar-green">mDM</code> — direct messages</li>
        <li><code className="font-mono text-radar-green">mTALK</code> — push-to-talk (PTT + LLM in the same room)</li>
        <li><code className="font-mono text-radar-green">mAIL</code> — email</li>
        <li><code className="font-mono text-radar-green">mCALL</code> — PSTN calls with anonymous numbers + vocoder</li>
        <li><code className="font-mono text-radar-green">mIRC</code> — persistent channels</li>
        <li><code className="font-mono text-radar-green">mIRL</code> — live-stream after-party</li>
        <li><code className="font-mono text-radar-green">mROOM</code> — ephemeral rooms + no-account join links</li>
        <li><code className="font-mono text-radar-green">mMATRIX</code> / <code className="font-mono text-radar-green">mDISCORD</code> / <code className="font-mono text-radar-green">mTELEGRAM</code> / <code className="font-mono text-radar-green">mSLACK</code> / <code className="font-mono text-radar-green">mSIGNAL</code> — bridges to existing networks</li>
      </Ul>
      <P>
        All exposed through a <strong>single MCP server</strong>, plus an Anthropic Skills bundle as a bonus for Claude users.
      </P>

      <H2>Start here</H2>
      <Ul>
        <li><Anchor href="/docs/quickstart"><strong>Quickstart</strong></Anchor> — get the MCP server running in Claude Code in 60 seconds</li>
        <li><Anchor href="/docs/mcp"><strong>MCP server</strong></Anchor> — tool surface, transports, BYOK auth</li>
        <li><Anchor href="/docs/modules"><strong>Modules</strong></Anchor> — every m* module reference</li>
        <li><Anchor href="/docs/sdk"><strong>SDK</strong></Anchor> — Vercel AI SDK / LangChain / OpenAI Agents / Anthropic Agents adapters</li>
        <li><Anchor href="/docs/security"><strong>Security</strong></Anchor> — threat model, disclosure process, hardening</li>
      </Ul>

      <H2>Status</H2>
      <P>
        <strong>alpha — toolkit live.</strong> The MCP server ships 55 tools across 7 live modules today. Track progress on{' '}
        <Anchor href="https://linear.app/ip-ra/project/mosadd-deaa4bef6de8">Linear</Anchor>.
      </P>
      <P>
        Phase 1 ETA: 6–7 months with current team. See the{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/roadmap.md">roadmap on GitHub</Anchor>.
      </P>
    </Prose>
  );
}
