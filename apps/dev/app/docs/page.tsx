import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Callout, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Developer docs for mosADD — the human-in-the-loop layer for AI agents, exposed as an MCP server. Channels, SDK, skills, security.',
};

export default function DocsIndexPage() {
  return (
    <Prose>
      <H1>Documentation</H1>
      <Lead>mosADD — the human-in-the-loop layer for AI agents, exposed as an MCP server.</Lead>

      <Callout type="info">
        This is the dev / integrations side. End-user app lives at{' '}
        <Anchor href="https://mosadd.com">mosadd.com</Anchor>.
      </Callout>

      <H2>What is mosadd</H2>
      <P>
        mosadd is <strong>the human-in-the-loop layer for AI agents</strong> — when an agent hits a decision it
        shouldn&apos;t make alone, it pulls a human into the room (rooms, voice, a private E2EE DM), reaches the
        outside world by email, and remembers what it learns. The Iron Dome threat radar scores every message in
        the kernel. Each <code className="font-mono text-primary">m*</code> is a channel you{' '}
        <code className="font-mono text-primary">add</code>:
      </P>
      <Ul>
        <li><code className="font-mono text-primary">mROOM</code> — ephemeral rooms + no-account guest links (the huddle)</li>
        <li><code className="font-mono text-primary">mTALK</code> — push-to-talk (PTT + LLM in the same room)</li>
        <li><code className="font-mono text-primary">mDM</code> — direct messages + 1:1 voice, end-to-end encrypted</li>
        <li><code className="font-mono text-primary">mp0st</code> — agent email (reach anyone)</li>
        <li><code className="font-mono text-primary">mRAG</code> — agent memory / knowledge base (RAG recall)</li>
        <li><code className="font-mono text-primary">mIRC</code> — persistent channels + embeddable website widget</li>
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
        <strong>alpha — toolkit live.</strong> The MCP server ships 71 tools across 6 live modules today. Track progress on{' '}
        <Anchor href="https://linear.app/ip-ra/project/mosadd-deaa4bef6de8">Linear</Anchor>.
      </P>
      <P>
        Phase 1 ETA: 6–7 months with current team. See the{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/roadmap.md">roadmap on GitHub</Anchor>.
      </P>
    </Prose>
  );
}
