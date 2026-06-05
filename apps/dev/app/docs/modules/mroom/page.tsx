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
        <code className="font-mono text-primary">mROOM</code> is the "create a room, share a link, anyone joins without signup, kills itself after TTL" primitive.
      </P>
      <P>
        Whereby has guest links. WhatsApp has guest chats. Whereby/WhatsApp aren't agent-callable. mROOM is.
      </P>

      <H2>Tools</H2>

      <H3>mROOM_create</H3>
      <Pre lang="ts">{`mROOM_create({
  ttl_seconds?: number,    // default 86400 (24h), min 60, max 30 days. Auto-joins creator.
})
→ { room }`}</Pre>

      <H3>mROOM_create_guest_link</H3>
      <Pre lang="ts">{`mROOM_create_guest_link({
  room_id: string,
  display_name: string,    // the only identifier — guest never signs up
  ttl_seconds?: number,    // default 3600 (1h), max 7 days
})
→ {
  token,
  join_url,    // https://mosadd.com/r/<room_id>?t=<token>
  expires_at,
}`}</Pre>

      <H3>mROOM_join</H3>
      <Pre lang="ts">{`mROOM_join({ room_id })   // current user, not a guest
→ { joined: true, room_id }`}</Pre>

      <H3>mROOM_leave</H3>
      <Pre lang="ts">{`mROOM_leave({ room_id })
→ { left: true, room_id }`}</Pre>

      <H3>mROOM_close</H3>
      <Pre lang="ts">{`mROOM_close({ room_id })   // founder only; removes all members
→ { closed: true, room_id }`}</Pre>

      <H3>mROOM_list</H3>
      <Pre lang="ts">{`mROOM_list({})   // rooms the current user belongs to
→ { rooms }`}</Pre>

      <H3>mROOM_send_message</H3>
      <Pre lang="ts">{`mROOM_send_message({
  room_id: string,
  text: string,         // UTF-8, max 64 KB
  reply_to_id?: string,
})
→ { message_id, delivered_at, thread_id }`}</Pre>

      <H3>mROOM_list_messages</H3>
      <Pre lang="ts">{`mROOM_list_messages({
  room_id: string,
  limit?: number,    // default 50, max 200
  cursor?: string,
})
→ {
  messages: { id, sender_identity_id, text, timestamp }[],
  next_cursor: string | null,
}`}</Pre>

      <H3>mROOM_voice_join</H3>
      <Pre lang="ts">{`mROOM_voice_join({
  room_id: string,
  video?: boolean,   // default false (audio-only)
})
→ { room_id, token, url, identity, mode }`}</Pre>
      <P>
        Full-duplex <strong>group</strong> voice — everyone can talk (no walkie-talkie floor; that&apos;s{' '}
        <code className="font-mono text-primary">mTALK</code>). Returns media credentials for the room&apos;s
        audio/video transport. Be a room member first (<code className="font-mono">mROOM_join</code> or a guest link).
      </P>

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
        <li>Anonymous tipline — create an mROOM with a short <code className="font-mono">ttl_seconds</code> and share its <code className="font-mono">mROOM_create_guest_link</code> URL (no-account join is built into the link, not a per-room parameter)</li>
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
