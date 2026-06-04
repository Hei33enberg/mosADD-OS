import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ol, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mTALK',
  description: 'Push-to-talk with LLM-in-room support. The kill feature.',
};

export default function MtalkPage() {
  return (
    <Prose>
      <H1>mTALK</H1>
      <Lead>Push-to-talk with LLM-in-room support. The kill feature.</Lead>

      <P>
        <code className="font-mono text-radar-green">mTALK</code> is push-to-talk voice with one twist nobody else ships:{' '}
        <strong>agents can join the room as listening/speaking participants</strong>.
      </P>
      <P>
        Zello has PTT but no agent. LiveKit has agents but no PTT semantics. mTALK has both.
      </P>

      <H2>Tools (control plane only)</H2>
      <P>
        Audio never flows through MCP — see <Anchor href="/docs/mcp">MCP server / Long-running sessions</Anchor>.
      </P>

      <H3>mTALK_open</H3>
      <Pre lang="ts">{`mTALK_open({
  label?: string,    // e.g. 'ops', 'field-team'. Omit for a personal room.
})
→ { room_id }`}</Pre>

      <H3>mTALK_join</H3>
      <Pre lang="ts">{`mTALK_join({ room_id })   // credentials for a human/bot client to connect
→ { room_id, token, url, identity }`}</Pre>

      <H3>mTALK_press</H3>
      <Pre lang="ts">{`mTALK_press({ room_id })   // request the floor (half-duplex)
→ {
  granted: boolean,   // true = you hold the floor and may speak
  position: number,   // your place in the FIFO queue if not granted
  holder: string | null,
  queue: string[],
}`}</Pre>

      <H3>mTALK_release</H3>
      <Pre lang="ts">{`mTALK_release({ room_id })   // give up the floor or cancel a queued request
→ { holder: string | null, queue: string[] }`}</Pre>

      <H3>mTALK_state</H3>
      <Pre lang="ts">{`mTALK_state({ room_id })   // read floor state without changing it
→ { holder: string | null, since: string | null, queue: string[] }`}</Pre>

      <H2>How LLM-in-room works</H2>
      <Ol>
        <li>Agent opens (or joins) a PTT room via <code className="font-mono text-radar-green">mTALK_open</code>, then mints client credentials with <code className="font-mono text-radar-green">mTALK_join</code></li>
        <li>The credentials let an agent participant subscribe to the room&apos;s audio transport (LiveKit Agents framework, with VAD + STT)</li>
        <li>Agent takes the floor with <code className="font-mono text-radar-green">mTALK_press</code> (granted when no one is transmitting), TTS&apos;s into the room, then calls <code className="font-mono text-radar-green">mTALK_release</code></li>
        <li>Floor discipline is half-duplex FIFO with an anti-hog timeout — inspect it any time with <code className="font-mono text-radar-green">mTALK_state</code></li>
      </Ol>
      <P>
        This is <strong>the killer feature</strong>. Walkie-talkie group + AI participant in the same room.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li>LiveKit (forked as <code className="font-mono text-radar-green">m0ssad-fabric</code>) — primary</li>
        <li>Mediasoup — backup</li>
        <li>Pion-based custom — fallback</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <Ul>
        <li><code className="font-mono">COMINT.voice_session_start</code></li>
        <li><code className="font-mono">MASINT.deepfake_voice_detected</code> — model on inbound audio</li>
        <li><code className="font-mono">BEHAVIORAL.session_floor_hog</code> — one user holding the floor &gt; N min</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
