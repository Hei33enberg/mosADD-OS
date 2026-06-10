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
        Send a DM with <code className="font-mono">mDM_send</code> — the recipient is a mosadd account id (a UUID).
        Grab yours from the <Anchor href="https://mosadd.dev/hub">hub</Anchor> and message your own id to watch it round-trip.
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
        Free tier: 1,000 msg/month, 30 min PTT. Sign up + get your key now at{' '}
        <Anchor href="https://mosadd.dev/hub">mosadd.dev/hub</Anchor> (live). The hosted HTTP/SSE
        endpoint above (<code className="font-mono">mcp.mosadd.com</code>) is rolling out in Phase 2 —
        until then, use the local stdio server (<code className="font-mono">npx @mosadd/mcp@alpha</code>) with your hub key.
      </P>

      <H2 id="byok-config">Auth config</H2>
      <P>
        <strong>Recommended — one hosted key.</strong> Paste a single hub key; the server exchanges it for a
        scoped session, so every tool acts as the key&apos;s owner. mAIL (email) and voice run through the mosadd
        relay — no provider keys to manage.
      </P>
      <Pre lang="bash">{`MOSADD_API_KEY=mk_...   # from mosadd.dev/hub`}</Pre>
      <P>
        <strong>Or bring your own Supabase backend</strong> (advanced / self-host). These are the exact vars the
        server reads:
      </P>
      <Pre lang="bash">{`MOSADD_SUPABASE_URL=https://<project>.supabase.co
MOSADD_SUPABASE_ANON_KEY=...
MOSADD_USER_JWT=...   # a signed-in user's access token`}</Pre>
      <P>
        Missing auth = that channel is disabled in <code className="font-mono text-primary">comms_capabilities</code>. No-op, fail closed.
        See <Anchor href="/docs/auth">auth</Anchor> for the full hub-key vs BYOK vs embed breakdown.
      </P>

      <H3>Next steps</H3>
      <Ul>
        <li><Anchor href="/docs/mcp">MCP server reference</Anchor> — 61 tools, control/data plane split, transports</li>
        <li><Anchor href="/docs/modules">Module reference</Anchor> — every m* per-channel API</li>
        <li><Anchor href="/examples">Examples</Anchor> — 6 runnable example apps</li>
      </Ul>
    </Prose>
  );
}
