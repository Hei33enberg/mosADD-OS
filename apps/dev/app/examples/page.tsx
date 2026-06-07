import type { Metadata } from 'next';
import { Prose, H1, Lead, Anchor } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Runnable starter apps for every major framework.',
};

const examples: {
  slug: string;
  title: string;
  blurb: string;
  framework: string;
  url: string;
}[] = [
  {
    slug: 'claude-code',
    title: 'Claude Code · mDM_send hello world',
    blurb: '60-second install: register the mosadd MCP server in Claude Code, then ask Claude to send a DM. Returns message_id.',
    framework: 'Claude Code',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/claude-code',
  },
  {
    slug: 'cursor',
    title: 'Cursor · MCP config',
    blurb: 'Drop-in ~/.cursor/mcp.json snippet. Cursor discovers all 60 live mosadd tools and exposes them via @-mention.',
    framework: 'Cursor',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/cursor',
  },
  {
    slug: 'chatgpt-apps',
    title: 'ChatGPT Apps · hosted MCP',
    blurb: 'Connect ChatGPT Apps to the hosted mosadd MCP via HTTP/SSE. Ships once mcp.mosadd.com is live (Phase 2).',
    framework: 'ChatGPT Apps',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/chatgpt-apps',
  },
  {
    slug: 'vercel-ai',
    title: 'Vercel AI SDK · streamText with tools',
    blurb: 'Node.js demo: import @mosadd/ai/vercel, pass mosadd tools to streamText with Claude, watch tool calls fly.',
    framework: 'Vercel AI SDK',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/vercel-ai',
  },
  {
    slug: 'langchain',
    title: 'LangChain · ReAct agent',
    blurb: 'createReactAgent with mosadd tools. Agent reasons over m* modules to complete multi-step comms tasks.',
    framework: 'LangChain',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/langchain',
  },
  {
    slug: 'anthropic',
    title: 'Anthropic SDK · tool-use loop',
    blurb: 'Raw Anthropic SDK Messages API with mosadd tools. The simplest possible agentic-comms loop.',
    framework: 'Anthropic SDK',
    url: 'https://github.com/Hei33enberg/mosadd-os/tree/main/examples/anthropic',
  },
];

export default function ExamplesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <Prose>
        <H1>Examples</H1>
        <Lead>
          Six runnable starter apps — one per major framework. Clone the repo, set the env vars from{' '}
          <Anchor href="/docs/quickstart#byok-config">BYOK config</Anchor>, then <code className="font-mono">npm start</code>.
        </Lead>
      </Prose>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 max-w-6xl">
        {examples.map((ex) => (
          <a
            key={ex.slug}
            href={ex.url}
            target="_blank"
            rel="noreferrer"
            className="block border border-neutral-800 rounded-lg p-5 hover:border-primary/40 hover:bg-neutral-900/50 transition group"
          >
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{ex.framework}</div>
            <div className="font-display text-lg text-neutral-100 group-hover:text-primary transition mb-2">{ex.title}</div>
            <p className="text-sm text-neutral-400 leading-relaxed">{ex.blurb}</p>
            <div className="mt-4 text-xs font-mono text-primary group-hover:underline">examples/{ex.slug} ↗</div>
          </a>
        ))}
      </div>

      <div className="mt-12 border-t border-neutral-800 pt-8 text-sm text-neutral-500 max-w-3xl">
        Don't see your framework?{' '}
        <a
          href="https://github.com/Hei33enberg/mosadd-os/issues/new"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Open an issue ↗
        </a>{' '}
        and we'll add an adapter. The core MCP server speaks vanilla MCP — anything that can speak MCP can speak to mosadd.
      </div>
    </div>
  );
}
