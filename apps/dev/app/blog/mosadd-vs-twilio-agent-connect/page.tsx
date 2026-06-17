import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Anchor, Callout } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'mosadd vs Twilio Agent Connect: open OS vs vendor lock-in',
  description:
    'Twilio Agent Connect went GA with a self-hosted, model-agnostic pitch. Here is what it leaves out — and why an open, MCP-native, vendor-agnostic OS wins for agent communications.',
  openGraph: {
    title: 'mosadd vs Twilio Agent Connect',
    description: 'Open OS vs vendor lock-in for agent communications.',
    type: 'article',
  },
};

export default function Post() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <Prose>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">2026-06-01</div>
        <H1>mosadd vs Twilio Agent Connect: open OS vs vendor lock-in</H1>
        <Lead>
          Twilio Agent Connect just went GA with a pitch that should sound familiar if you&apos;ve read this
          site: self-hosted, model-agnostic, &ldquo;focus on agent behavior, not glue code.&rdquo; It&apos;s a
          good product. It&apos;s also a trap, and here&apos;s the part the launch post leaves out.
        </Lead>

        <H2>The pitch you&apos;ll hear</H2>
        <P>
          Every comms vendor is racing to wrap an &ldquo;agent layer&rdquo; around their network. Twilio Agent
          Connect bridges your LLM to Twilio Voice/SMS/WhatsApp; LiveKit gives you voice rooms; Composio gives
          you tool calls. Each says the same thing: stop writing glue, ship faster.
        </P>

        <H2>The part they leave out</H2>
        <P>
          The orchestration SDK is open. The <em>network underneath is not</em>. Agent Connect runs on Twilio
          numbers, Twilio rates, Twilio&apos;s Conversation layer. Swap models freely — but you can never swap
          Twilio. You&apos;ve traded glue code for a meter you don&apos;t control.
        </P>
        <Ul>
          <li>One vendor&apos;s network, one vendor&apos;s pricing, one vendor&apos;s outage page.</li>
          <li>Voice only goes as far as their channels — no native DM, rooms, channels, mail in one place.</li>
          <li>It&apos;s an SDK, not an MCP server — you wire it per-app, per-framework.</li>
          <li>Encryption, anti-abuse, threat-scoring: still your problem.</li>
        </Ul>

        <H2>What an OS does instead</H2>
        <P>
          mosadd is the layer below the channels. One MCP server exposes 70 tools across DM, channels, rooms,
          mail, push-to-talk and knowledge recall. You bring your own keys — LiveKit, Resend, OpenAI, Supabase — or self-host the whole thing for
          $0, forever, under Apache-2.0. The provider is a swappable seam, not a landlord.
        </P>
        <Callout type="success">
          <strong>One call, any provider:</strong>{' '}
          <code className="font-mono">mROOM_create_guest_link</code> replaces a LiveKit room + guest-token auth +
          a Resend invite — wired by hand. Switch the provider behind it without touching
          your agent.
        </Callout>

        <H2>Why MCP-native matters</H2>
        <P>
          An SDK lives inside one app. An MCP server is spoken by every agent client — Claude Code, Cursor,
          Windsurf, Cline, ChatGPT Apps, the Vercel AI SDK, LangChain. Write your tool surface once; it works
          everywhere an agent runs, including off-grid radio hardware. That&apos;s the difference between a
          library and an operating system.
        </P>

        <H2>The honest comparison</H2>
        <P>
          See the side-by-side on the <Anchor href="/#comparison">home page</Anchor> and run your own numbers in
          the <Anchor href="/pricing">cost calculator</Anchor>. If we got a cell wrong,{' '}
          <Anchor href="https://github.com/Hei33enberg/mosadd-os/issues">open an issue</Anchor> — the whole
          thing is open for exactly this reason.
        </P>
        <P>
          Read the code. Bring your keys. Own your stack.{' '}
          <Anchor href="/docs/quickstart">Start free →</Anchor>
        </P>
      </Prose>
    </div>
  );
}
