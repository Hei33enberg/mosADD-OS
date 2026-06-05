import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Table, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'MCP server',
  description: 'Tool surface, transports, authentication for @mosadd/mcp.',
};

export default function McpPage() {
  return (
    <Prose>
      <H1>MCP server</H1>
      <Lead>Tool surface, transports, authentication for <code className="font-mono text-primary">@mosadd/mcp</code>.</Lead>

      <P>
        The <code className="font-mono text-primary">@mosadd/mcp</code> package is the <strong>main artifact</strong> of mosadd-os.
        It covers 11 of 12 LLM clients (Claude Code, Cursor, Windsurf, VS Code, ChatGPT Apps, Lovable, Bolt, Goose, Cline, Manus, custom).
      </P>

      <H2>Tool naming</H2>
      <P>
        Per <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md">RFC 0001</Anchor>,
        tools follow <code className="font-mono text-primary">m&lt;MODULE&gt;_&lt;operation&gt;</code> snake_case:
      </P>

      <Table
        headers={['Tool', 'What it does']}
        rows={[
          [<code key="1" className="font-mono text-primary">mDM_send</code>, 'Send an end-to-end-encrypted direct message'],
          [<code key="2" className="font-mono text-primary">mDM_list</code>, 'List messages in a thread'],
          [<code key="3" className="font-mono text-primary">mDM_respond_request</code>, 'Accept / reject a contact request'],
          [<code key="4" className="font-mono text-primary">mROOM_create_guest_link</code>, 'Create ephemeral room with no-account join link'],
          [<code key="5" className="font-mono text-primary">mROOM_join</code>, 'Join a room by link'],
          [<code key="6" className="font-mono text-primary">mIRC_create</code>, 'Create a persistent channel'],
          [<code key="7" className="font-mono text-primary">mAIL_send</code>, 'Send email'],
          [<code key="8" className="font-mono text-primary">mTALK_press</code>, 'Press push-to-talk: request the floor (half-duplex)'],
          [<code key="9" className="font-mono text-primary">mTALK_join</code>, 'Get LiveKit credentials to join a PTT room'],
          [<code key="10" className="font-mono text-primary">mKB_search</code>, "Search/answer over the user's own data (RAG)"],
          ['…', <span key="more">full list in <Anchor href="/docs/modules">modules reference</Anchor></span>],
        ]}
      />

      <P>
        Total surface today: <strong>52 tools across 6 live modules</strong> — mDM ×12 (incl. 4 voice), mIRC ×20, mROOM ×9, mAIL ×4, mTALK ×5, mKB ×2. <code className="font-mono text-primary">mCALL</code> ×7 is registered but <em>carrier-pending</em> (needs a Telnyx/LiveKit SIP trunk); with it plus the <code className="font-mono text-primary">comms_capabilities</code> discovery tool the package registers 60 tools in total.
      </P>

      <H2>Transports</H2>
      <Ul>
        <li>
          <strong>stdio</strong> (default) — <code className="font-mono text-primary">npx @mosadd/mcp@alpha</code>. For Claude Code, Cursor, Cline, Windsurf, Goose, custom local agents.
        </li>
        <li>
          <strong>HTTP/SSE</strong> — hosted at <code className="font-mono text-primary">https://mcp.mosadd.com</code> (Phase 2). For ChatGPT Apps, Lovable, Bolt.
        </li>
      </Ul>

      <H2>Authentication</H2>
      <Ul>
        <li><strong>Local stdio:</strong> env-based BYOK per provider (see <Anchor href="/docs/quickstart">quickstart</Anchor>)</li>
        <li><strong>Hosted HTTP:</strong> OAuth → user account on mosadd.dev/hub → keys stored in BYOK key broker</li>
      </Ul>

      <H2>Long-running sessions (mTALK)</H2>
      <P>
        PTT and rooms have long-running media sessions. We separate the <strong>control plane</strong> (MCP) from the <strong>data plane</strong> (LiveKit media). Audio never flows through MCP.
      </P>
      <Ul>
        <li>
          <code className="font-mono text-primary">mTALK_open</code> → returns a stable <code className="font-mono">room_id</code> (half-duplex PTT room).
        </li>
        <li>
          <code className="font-mono text-primary">mTALK_join</code> → returns <code className="font-mono">&#123; token, url, identity &#125;</code> (a LiveKit credential). A human/bot client connects with it; audio flows client ↔ LiveKit, never through MCP.
        </li>
        <li>
          <code className="font-mono text-primary">mTALK_press</code> / <code className="font-mono text-primary">mTALK_release</code> / <code className="font-mono text-primary">mTALK_state</code> → drive the floor: one speaker at a time, FIFO queue, anti-hog auto-release.
        </li>
      </Ul>
      <P>
        See <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/architecture/control-data-plane.md">control-data-plane.md</Anchor> for the full design.
      </P>

      <H2>Self-host</H2>
      <Pre lang="bash">{`docker run -p 3000:3000 \\
  -e MOSADD_SUPABASE_URL=... \\
  ghcr.io/hei33enberg/mosadd-mcp:latest`}</Pre>
      <P>Exposes HTTP/SSE on port 3000. Front with any reverse proxy + OAuth provider of choice.</P>

      <H3>Where to go next</H3>
      <Ul>
        <li><Anchor href="/docs/modules">Modules</Anchor> — per-channel API reference</li>
        <li><Anchor href="/docs/sdk">SDK adapters</Anchor> — call mosadd tools from your framework of choice</li>
        <li><Anchor href="/examples">Examples</Anchor> — runnable Claude Code, Cursor, Vercel AI SDK demos</li>
      </Ul>
    </Prose>
  );
}
