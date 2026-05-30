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

      <H3>mTALK_start_session</H3>
      <Pre lang="ts">{`mTALK_start_session({
  room_id?: string,           // null = create new
  vocoder_preset?: 'none' | 'pitch_shift' | 'rvc:<voice_id>',
  agent_participant?: boolean, // attach Claude/Cursor as participant
})
→ {
  session_id,
  room_id,
  daemon_socket,    // local Unix socket for the @m0ssad/daemon
  livekit_jwt,
  agent_join_url?,  // for LLM to subscribe to audio
}`}</Pre>

      <H3>mTALK_get_status</H3>
      <Pre lang="ts">{`mTALK_get_status({ session_id })
→ {
  participants: [{ id, name, speaking: boolean, mic_open: boolean }],
  agent: { listening: boolean, last_transcript: string },
}`}</Pre>

      <H3>mTALK_end_session</H3>
      <Pre lang="ts">{`mTALK_end_session({ session_id })`}</Pre>

      <H2>How LLM-in-room works</H2>
      <Ol>
        <li>User joins PTT room via <code className="font-mono text-radar-green">mTALK_start_session(&#123; agent_participant: true &#125;)</code></li>
        <li>MCP server reserves an "agent slot" in the LiveKit room</li>
        <li>Agent subscribes to audio via LiveKit Agents framework, with VAD + STT</li>
        <li>Agent can call <code className="font-mono text-radar-green">mTALK_speak(&#123; text &#125;)</code> to TTS into the room (counts as user PTT push)</li>
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
