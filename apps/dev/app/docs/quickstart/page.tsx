import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Quickstart',
  description: 'Get the mosadd MCP server running in your agent in 60 seconds.',
};

export default function QuickstartPage() {
  return (
    <Prose>
      <H1>Quickstart</H1>
      <Lead>Get the mosadd MCP server running in your agent in 60 seconds.</Lead>

      <H2>In Claude Code</H2>
      <Pre lang="bash">{`claude mcp add mosadd npx -- -y @m0ssad/mcp`}</Pre>
      <P>Restart Claude Code. The <code className="font-mono text-radar-green">mosadd</code> MCP server is now connected. Try:</P>
      <Callout type="info">
        Send a DM to <code className="font-mono">alice@m0ssad</code>: "first message from Claude"
      </Callout>
      <P>Claude will call <code className="font-mono text-radar-green">mDM_send</code> under the hood.</P>

      <H2>In Cursor</H2>
      <P>Add to <code className="font-mono text-radar-green">~/.cursor/mcp.json</code>:</P>
      <Pre lang="json">{`{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@m0ssad/mcp"]
    }
  }
}`}</Pre>

      <H2>Standalone</H2>
      <Pre lang="bash">{`npx @m0ssad/mcp`}</Pre>
      <P>
        The server speaks MCP over stdio. Use any MCP client (Cline, Windsurf, Goose, custom).
      </P>

      <H2>Hosted (Phase 2)</H2>
      <P>
        For ChatGPT Apps, Lovable, Bolt, or any client that prefers HTTP/SSE — use the hosted endpoint:
      </P>
      <Pre>{`https://mcp.mosadd.com`}</Pre>
      <P>
        OAuth required. Free tier: 100 msg/month, 30 min PTT, 0 PSTN. Sign up at{' '}
        <Anchor href="https://hub.mosadd.com">hub.mosadd.com</Anchor> (coming with Phase 2).
      </P>

      <H2>BYOK config</H2>
      <P>Local stdio uses env vars per provider:</P>
      <Pre lang="bash">{`# DM / IRC / ROOM (default Supabase backend)
M0SSAD_SUPABASE_URL=...
M0SSAD_SUPABASE_KEY=...

# mAIL outbound
M0SSAD_RESEND_API_KEY=...

# mCALL PSTN
M0SSAD_TELNYX_API_KEY=...

# mTALK / mROOM voice (LiveKit)
M0SSAD_LIVEKIT_URL=wss://...
M0SSAD_LIVEKIT_API_KEY=...
M0SSAD_LIVEKIT_API_SECRET=...`}</Pre>
      <P>
        Missing keys = that channel is disabled in <code className="font-mono text-radar-green">comms.discover</code>. No-op fail closed.
      </P>

      <H3>Next steps</H3>
      <Ul>
        <li><Anchor href="/docs/mcp">MCP server reference</Anchor> — 32 tools, control/data plane split, transports</li>
        <li><Anchor href="/docs/modules">Module reference</Anchor> — every m* per-channel API</li>
        <li><Anchor href="/examples">Examples</Anchor> — 6 runnable example apps</li>
      </Ul>
    </Prose>
  );
}
