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
      <Pre lang="bash">{`claude mcp add mosadd -- npx -y @mosadd/mcp@alpha`}</Pre>
      <P>Restart Claude Code. The <code className="font-mono text-primary">mosadd</code> MCP server is now connected. Try:</P>
      <Callout type="info">
        Send a DM to <code className="font-mono">alice@mosadd</code>: "first message from Claude"
      </Callout>
      <P>Claude will call <code className="font-mono text-primary">mDM_send</code> under the hood.</P>

      <H2>In Cursor</H2>
      <P>Add to <code className="font-mono text-primary">~/.cursor/mcp.json</code>:</P>
      <Pre lang="json">{`{
  "mcpServers": {
    "mosadd": {
      "command": "npx",
      "args": ["-y", "@mosadd/mcp@alpha"]
    }
  }
}`}</Pre>

      <H2>Standalone</H2>
      <Pre lang="bash">{`npx @mosadd/mcp@alpha`}</Pre>
      <P>
        The server speaks MCP over stdio. Use any MCP client (Cline, Windsurf, Goose, custom).
      </P>

      <H2>Hosted (Phase 2)</H2>
      <P>
        For ChatGPT Apps, Lovable, Bolt, or any client that prefers HTTP/SSE — use the hosted endpoint:
      </P>
      <Pre>{`https://mcp.mosadd.com`}</Pre>
      <P>
        Free tier: 1,000 msg/month, 30 min PTT, 0 PSTN. Sign up + get your key now at{' '}
        <Anchor href="https://mosadd.dev/hub">mosadd.dev/hub</Anchor> (live). The hosted HTTP/SSE
        endpoint above (<code className="font-mono">mcp.mosadd.com</code>) is rolling out in Phase 2 —
        until then, use the local stdio server (<code className="font-mono">npx @mosadd/mcp@alpha</code>) with your hub key.
      </P>

      <H2 id="byok-config">BYOK config</H2>
      <P>Local stdio uses env vars per provider:</P>
      <Pre lang="bash">{`# DM / IRC / ROOM (default Supabase backend)
MOSADD_SUPABASE_URL=...
MOSADD_SUPABASE_KEY=...

# mAIL outbound
MOSADD_RESEND_API_KEY=...

# mCALL PSTN
MOSADD_TELNYX_API_KEY=...

# mTALK / mROOM voice (LiveKit)
MOSADD_LIVEKIT_URL=wss://...
MOSADD_LIVEKIT_API_KEY=...
MOSADD_LIVEKIT_API_SECRET=...`}</Pre>
      <P>
        Missing keys = that channel is disabled in <code className="font-mono text-primary">comms_capabilities</code>. No-op fail closed.
      </P>

      <H3>Next steps</H3>
      <Ul>
        <li><Anchor href="/docs/mcp">MCP server reference</Anchor> — 52 tools, control/data plane split, transports</li>
        <li><Anchor href="/docs/modules">Module reference</Anchor> — every m* per-channel API</li>
        <li><Anchor href="/examples">Examples</Anchor> — 6 runnable example apps</li>
      </Ul>
    </Prose>
  );
}
