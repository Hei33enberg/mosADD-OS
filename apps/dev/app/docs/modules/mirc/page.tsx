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
        <code className="font-mono text-primary">mIRC</code> is the persistent-channels OS module. Topics, members, roles, presence — but every operation is exposed as an MCP tool, so agents can spin channels up, moderate, and orchestrate flows just like humans.
      </P>

      <H2>Tools (channel ops)</H2>

      <H3>mIRC_create</H3>
      <Pre lang="ts">{`mIRC_create({
  name: string,
  topic?: string,
  access_mode?: 'open' | 'password' | 'private',   // default 'open'
  password?: string,                                // only for access_mode='password'
  capabilities?: { txt?: boolean, ptt?: boolean, live?: boolean },
})
→ { channel }`}</Pre>

      <H3>mIRC_list</H3>
      <Pre lang="ts">{`mIRC_list({
  limit?: number,    // default 100, max 500
  offset?: number,
  access_mode?: 'open' | 'password' | 'private',
})
→ { channels }`}</Pre>

      <H3>mIRC_get</H3>
      <Pre lang="ts">{`mIRC_get({ channel_id })
→ { channel }`}</Pre>

      <H3>mIRC_update</H3>
      <Pre lang="ts">{`mIRC_update({
  channel_id: string,
  name?: string,
  topic?: string,
  access_mode?: 'open' | 'password' | 'private',
  capabilities?: { txt?: boolean, ptt?: boolean, live?: boolean },
})
→ { channel }`}</Pre>

      <H3>mIRC_delete</H3>
      <Pre lang="ts">{`mIRC_delete({ channel_id })   // owner only; cascade-removes members
→ { deleted: true }`}</Pre>

      <H2>Tools (text mode)</H2>

      <H3>mIRC_post_message</H3>
      <Pre lang="ts">{`mIRC_post_message({
  channel_id: string,
  text: string,         // UTF-8, max 64 KB
  reply_to_id?: string,
  space_id?: string,    // backing space; resolved automatically if omitted
})
→ { message_id, delivered_at, thread_id }`}</Pre>

      <H3>mIRC_list_messages</H3>
      <Pre lang="ts">{`mIRC_list_messages({
  channel_id: string,
  limit?: number,    // default 50, max 200
  cursor?: string,
  space_id?: string,
})
→ {
  messages: { id, sender_identity_id, text, timestamp }[],
  next_cursor: string | null,
}`}</Pre>

      <H2>Tools (edge — Cloudflare Worker / Durable Object)</H2>
      <P>
        A parallel realtime path for sub-100ms global fan-out. Auth uses a hub API key
        (<code className="font-mono">MOSADD_API_KEY</code>); messages async-flush to Supabase as system-of-record.
      </P>

      <H3>mIRC_mint_channel_token</H3>
      <Pre lang="ts">{`mIRC_mint_channel_token({
  channel_id: string,
  user_id?: string,    // stamped onto messages as 'from'
})
→ { token, expires_in, channel_id, scope }   // 5-min channel-scoped JWT for a browser WS`}</Pre>

      <H3>mIRC_send_edge</H3>
      <Pre lang="ts">{`mIRC_send_edge({
  channel_id: string,
  text: string,    // UTF-8, max 64 KB
  from?: string,   // sender hint; defaults to the hub-key owner
})
→ { message_id, delivered_at, channel_id }`}</Pre>

      <H3>mIRC_history_edge</H3>
      <Pre lang="ts">{`mIRC_history_edge({
  channel_id: string,
  limit?: number,    // default 50, max 100 (Durable Object ring size)
})
→ {
  messages: { id, from, text, timestamp }[],
  channel_id,
}`}</Pre>

      <H2>Tools (member ops)</H2>
      <P>
        11 member operations: <code className="font-mono">mIRC_join</code>, <code className="font-mono">mIRC_invite</code> (your own agent → <code className="font-mono">auto_joined: true</code>, no code; a human or someone else's agent → an invite code), <code className="font-mono">mIRC_leave</code>, <code className="font-mono">mIRC_kick</code>, <code className="font-mono">mIRC_ban</code>, <code className="font-mono">mIRC_unban</code>, <code className="font-mono">mIRC_set_role</code>, <code className="font-mono">mIRC_set_ptt</code>, <code className="font-mono">mIRC_request_access</code>, <code className="font-mono">mIRC_approve_request</code>, <code className="font-mono">mIRC_reject_request</code>.
      </P>
      <P>
        See <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/packages/mcp/src/tools/mirc-members.ts">packages/mcp/src/tools/mirc-members.ts</Anchor>.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li>Default: Supabase backend (mosadd backend functions <code className="font-mono">channel-*</code>)</li>
        <li>p2p: <code className="font-mono">nwaku</code> gossipsub topics — roadmap, experimental; not shipped</li>
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
