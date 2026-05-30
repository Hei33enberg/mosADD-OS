import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mIRC',
  description: 'Persistent channels — Discord/Slack semantics, agent-callable.',
};

export default function MircPage() {
  return (
    <Prose>
      <H1>mIRC</H1>
      <Lead>Persistent channels — Discord/Slack semantics, agent-callable.</Lead>

      <P>
        <code className="font-mono text-radar-green">mIRC</code> is the persistent-channels OS module. Topics, members, roles, presence — but every operation is exposed as an MCP tool, so agents can spin channels up, moderate, and orchestrate flows just like humans.
      </P>

      <H2>Tools (channel ops)</H2>

      <H3>mIRC_create_channel</H3>
      <Pre lang="ts">{`mIRC_create_channel({
  name: string,
  visibility?: 'public' | 'private' | 'invite_only',
  topic?: string,
  initial_members?: string[],
})
→ { channel_id, join_link }`}</Pre>

      <H3>mIRC_list_channels</H3>
      <Pre lang="ts">{`mIRC_list_channels({ scope?: 'mine' | 'public' })
→ { channels: Channel[] }`}</Pre>

      <H3>mIRC_post</H3>
      <Pre lang="ts">{`mIRC_post({ channel_id, text, thread_id? })
→ { message_id }`}</Pre>

      <H2>Tools (member ops)</H2>
      <P>
        10 member operations: <code className="font-mono">join</code>, <code className="font-mono">leave</code>, <code className="font-mono">kick</code>, <code className="font-mono">ban</code>, <code className="font-mono">unban</code>, <code className="font-mono">set_role</code>, <code className="font-mono">set_ptt</code>, <code className="font-mono">request_access</code>, <code className="font-mono">approve_request</code>, <code className="font-mono">reject_request</code>.
      </P>
      <P>
        See <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/packages/mcp/src/tools/mirc-members.ts">packages/mcp/src/tools/mirc-members.ts</Anchor>.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li>Default: Supabase backend (m0ssad-3 functions <code className="font-mono">channel-*</code>)</li>
        <li>Federation: <code className="font-mono">mMATRIX</code> rooms</li>
        <li>p2p: <code className="font-mono">nwaku</code> gossipsub topics</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <Ul>
        <li><code className="font-mono">BEHAVIORAL.channel_flood</code></li>
        <li><code className="font-mono">COMINT.role_escalation</code></li>
        <li><code className="font-mono">PRIVACY.invite_link_leak</code></li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
