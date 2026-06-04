import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mDM',
  description: 'Direct messages + 1:1 voice — multi-thread per contact, E2E optional.',
};

export default function MdmPage() {
  return (
    <Prose>
      <H1>mDM</H1>
      <Lead>Direct messages + 1:1 voice — multi-thread per contact, E2E optional.</Lead>

      <P>
        <code className="font-mono text-radar-green">mDM</code> is the direct-messaging OS module.{' '}
        <strong>USP:</strong> multiple threads per contact (like GitHub Issues per repo), not one flat chat like WhatsApp.
      </P>

      <H2>Tools</H2>

      <H3>mDM_send</H3>
      <Pre lang="ts">{`mDM_send({
  to: string,           // contact_id | email | phone | mosadd handle
  text: string,
  thread_id?: string,   // null = default thread for this contact
  encrypted?: boolean,  // E2E via @mosadd/crypto
})
→ { message_id, delivered_at, thread_id }`}</Pre>

      <H3>mDM_list</H3>
      <Pre lang="ts">{`mDM_list({
  contact_id: string,
  thread_id?: string,
  limit?: number,
  cursor?: string,
})
→ { messages: Message[], next_cursor, threads: Thread[] }`}</Pre>

      <H3>mDM_respond_request</H3>
      <Pre lang="ts">{`mDM_respond_request({
  request_id: string,
  action: 'accept' | 'reject',
})
→ { ok }`}</Pre>

      <H2>1:1 voice &amp; voice notes</H2>
      <P>
        mDM is also the home of the <strong>ordinary 1:1 call</strong> — full-duplex, phone-style. This is NOT
        walkie-talkie (that&apos;s <code className="font-mono text-radar-green">mTALK</code>, half-duplex floor control) and NOT the
        phone network (that&apos;s <code className="font-mono text-radar-green">mCALL</code> / PSTN). Audio rides the VoiceProvider&apos;s
        media transport (LiveKit by default); the tools handle the room and the invite/hangup signalling over the DM thread.
      </P>

      <H3>mDM_call_start</H3>
      <Pre lang="ts">{`mDM_call_start({
  to: string,            // contact identity id
  video?: boolean,       // default false (audio-only)
  thread_label?: string,
})
→ { room_id, token, url, identity, mode, invited, thread_id }
// creates the room, returns join creds, AND drops a call_invite in the DM thread`}</Pre>

      <H3>mDM_call_answer</H3>
      <Pre lang="ts">{`mDM_call_answer({ room_id: string })
→ { room_id, token, url, identity }   // join creds for the same room`}</Pre>

      <H3>mDM_call_end</H3>
      <Pre lang="ts">{`mDM_call_end({
  room_id: string,
  to?: string,           // also drop a call_end (hangup) control message
  thread_label?: string,
})
→ { room_id, signalled }`}</Pre>

      <H3>mDM_voice_note</H3>
      <Pre lang="ts">{`mDM_voice_note({
  to: string,
  audio_url: string,     // already-uploaded clip
  duration_ms?: number,
  mime?: string,         // default audio/ogg
  thread_label?: string,
})
→ { message_id, thread_id }   // fire-and-forget async voice`}</Pre>

      <H2>E2E encryption</H2>
      <P>
        With <code className="font-mono text-radar-green">encrypted: true</code>, message body is wrapped via X3DH + Double Ratchet (<code className="font-mono text-radar-green">@mosadd/crypto</code>). Provider sees ciphertext only.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li>Default: Supabase backend (m0ssad-3 functions <code className="font-mono text-radar-green">message-send</code>, <code className="font-mono text-radar-green">message-list</code>, <code className="font-mono text-radar-green">message-request-respond</code>)</li>
        <li>Federation: <code className="font-mono text-radar-green">mMATRIX</code> provider (route via Matrix homeserver)</li>
        <li>p2p: <code className="font-mono text-radar-green">nwaku</code> provider (anonymous-identity native)</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <P>Every operation emits:</P>
      <Ul>
        <li><code className="font-mono">BEHAVIORAL.mass_dm</code> — rate threshold</li>
        <li><code className="font-mono">COMINT.encrypted_send</code> — when <code className="font-mono">encrypted: true</code></li>
        <li><code className="font-mono">MASINT.cross_thread_pattern</code> — same content across many threads</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
