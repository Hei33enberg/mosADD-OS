import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mDM',
  description: 'Direct messages + 1:1 voice — multi-thread per contact, X3DH + Double Ratchet E2EE on mDM_send.',
};

export default function MdmPage() {
  return (
    <Prose>
      <H1>mDM</H1>
      <Lead>Direct messages + 1:1 voice — multi-thread per contact, X3DH + Double Ratchet E2EE by default.</Lead>

      <P>
        <code className="font-mono text-primary">mDM</code> is the direct-messaging OS module.{' '}
        <strong>USP:</strong> multiple threads per contact (like GitHub Issues per repo), not one flat chat like WhatsApp.
        E2EE is tool-level: <code className="font-mono text-primary">mDM_send</code> is encrypted; the explicit{' '}
        <code className="font-mono text-primary">mDM_send_unencrypted</code> fallback is the only plaintext path (deprecated; will be removed).
      </P>

      <H2>Tools</H2>

      <H3>mDM_list_contacts</H3>
      <Pre lang="ts">{`mDM_list_contacts({ limit?: number })
→ { contacts: [{ identity_id, display_name, last_seen, ... }] }
// Returns identity_id for use by mDM_send / mDM_list.`}</Pre>

      <H3>mDM_publish_keys</H3>
      <Pre lang="ts">{`mDM_publish_keys({})  // no parameters
→ { identity_id, registration_id, published_at }
// Publishes your prekey bundle to mosadd_prekey_bundles so peers can mDM_send to you E2EE.`}</Pre>

      <H3>mDM_send</H3>
      <Pre lang="ts">{`mDM_send({
  to: string,                // contact identity_id | email | phone | mosadd handle
  text: string,              // 1..64_000 chars
  thread_label?: string,     // [a-zA-Z0-9._-]{1,120}; default thread if omitted (USP: multi-thread per contact)
  reply_to_id?: string,      // id of the message being replied to
})
→ { message_id, delivered_at, thread_id }
// E2EE: X3DH + Double Ratchet via @mosadd/crypto (requires recipient ran mDM_publish_keys).`}</Pre>

      <H3>mDM_send_unencrypted</H3>
      <Pre lang="ts">{`mDM_send_unencrypted({ to, text, thread_label?, reply_to_id? })
→ { message_id, delivered_at, thread_id }
// PLAINTEXT migration fallback. Server can read the body. Deprecated, will be removed.`}</Pre>

      <H3>mDM_list</H3>
      <Pre lang="ts">{`mDM_list({
  contact_id: string,        // identity_id from mDM_list_contacts
  thread_label?: string,     // omit to read the default thread
  limit?: number,            // 1..200, default 50
  cursor?: string,
})
→ { messages: Message[], next_cursor, threads: string[] }`}</Pre>

      <H3>mDM_respond_request</H3>
      <Pre lang="ts">{`mDM_respond_request({
  request_id: string,
  action: 'accept' | 'reject',
})
→ { ok }`}</Pre>

      <H3>mDM_edit</H3>
      <Pre lang="ts">{`mDM_edit({
  message_id: string,   // from mDM_list
  new_text: string,
})
→ { message_id, edited: true }
// E2EE threads: edit stores a server-readable body — prefer delete + re-send`}</Pre>

      <H3>mDM_delete</H3>
      <Pre lang="ts">{`mDM_delete({ message_id: string })   // soft-delete, hides for both sides
→ { message_id, deleted: true }`}</Pre>

      <H2>1:1 voice &amp; voice notes</H2>
      <P>
        mDM is also the home of the <strong>ordinary 1:1 call</strong> — full-duplex, phone-style. This is NOT
        walkie-talkie (that&apos;s <code className="font-mono text-primary">mTALK</code>, half-duplex floor control) and NOT the
        phone network (that&apos;s <code className="font-mono text-primary">mCALL</code> / PSTN). Audio rides the VoiceProvider&apos;s
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
        With <code className="font-mono text-primary">encrypted: true</code>, message body is wrapped via X3DH + Double Ratchet (<code className="font-mono text-primary">@mosadd/crypto</code>). Provider sees ciphertext only.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li>Default: Supabase backend (mosadd backend functions <code className="font-mono text-primary">message-send</code>, <code className="font-mono text-primary">message-list</code>, <code className="font-mono text-primary">message-request-respond</code>)</li>
        <li>Federation: <code className="font-mono text-primary">mMATRIX</code> provider (route via Matrix homeserver)</li>
        <li>p2p: <code className="font-mono text-primary">nwaku</code> provider (anonymous-identity native)</li>
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
