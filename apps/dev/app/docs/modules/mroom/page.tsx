import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mROOM',
  description: 'Ephemeral rooms with no-account join links. Group txt + ptt + media.',
};

export default function MroomPage() {
  return (
    <Prose>
      <H1>mROOM</H1>
      <Lead>Ephemeral rooms with no-account join links. Group txt + ptt + media.</Lead>

      <P>
        <code className="font-mono text-radar-green">mROOM</code> is the "create a room, share a link, anyone joins without signup, kills itself after TTL" primitive.
      </P>
      <P>
        Whereby has guest links. WhatsApp has guest chats. Whereby/WhatsApp aren't agent-callable. mROOM is.
      </P>

      <H2>Tools</H2>

      <H3>mROOM_create_with_link</H3>
      <Pre lang="ts">{`mROOM_create_with_link({
  name?: string,
  ttl_seconds?: number,         // default 86400 (24h)
  max_participants?: number,    // default 50
  modes?: ('txt' | 'ptt' | 'video')[],
  no_account_allowed?: boolean, // default true
})
→ {
  room_id,
  join_link,    // https://mosadd.com/r/abc123
  expires_at,
}`}</Pre>

      <H3>mROOM_join</H3>
      <Pre lang="ts">{`mROOM_join({
  room_id_or_link: string,
  display_name?: string,        // anonymous guests choose handle
})
→ { participant_id, modes_available }`}</Pre>

      <H3>mROOM_post</H3>
      <Pre lang="ts">{`mROOM_post({ room_id, text })
→ { message_id }`}</Pre>

      <H3>mROOM_close</H3>
      <Pre lang="ts">{`mROOM_close({ room_id })`}</Pre>

      <H2>Providers</H2>
      <Ul>
        <li>LiveKit (forked) for ptt + video</li>
        <li>Supabase + Realtime for txt</li>
        <li>nwaku for anonymous identity mode</li>
      </Ul>

      <H2>Use cases</H2>
      <Ul>
        <li>Customer support — agent creates room, shares link with customer, anonymous PTT call</li>
        <li>Live-stream after-party — creator drops mROOM link in stream chat, fans join with one click</li>
        <li>Incident bridge — sec team spins up room, shares 24h link with stakeholders</li>
        <li>Anonymous tipline — <code className="font-mono">no_account_allowed: true</code> + <code className="font-mono">modes: ['txt']</code> + short TTL</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <Ul>
        <li><code className="font-mono">COMINT.no_account_join</code> — first-time anonymous participant</li>
        <li><code className="font-mono">BEHAVIORAL.room_brigading</code> — N participants joining within M seconds from same IP block</li>
        <li><code className="font-mono">PRIVACY.guest_link_leak_external</code> — link shared to known abuse forums (radar feed)</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
