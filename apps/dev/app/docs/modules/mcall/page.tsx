import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mCALL',
  description: 'PSTN out with anonymous numbers + vocoder. Place real phone calls from an agent over an encrypted SIP relay.',
};

export default function McallPage() {
  return (
    <Prose>
      <H1>mCALL</H1>
      <Lead>PSTN out with anonymous numbers and an optional vocoder — real phone calls from an agent, over an encrypted SIP relay.</Lead>

      <P>
        <code className="font-mono text-radar-green">mCALL</code> dials real phone numbers (E.164) from a
        carrier-provisioned number, bridges the media over an encrypted SIP relay, and can disguise the caller&apos;s
        voice with a vocoder. The control plane is MCP; audio never flows through the tool call (see{' '}
        <Anchor href="/docs/mcp">MCP server / long-running sessions</Anchor>).
      </P>

      <Callout type="warn">
        <strong>Status: backend live, awaiting a carrier.</strong> The call path is deployed on prod
        (<code className="font-mono">call-start-pstn</code> / <code className="font-mono">call-end-pstn</code>) with a
        LiveKit SIP bridge, zone-based pricing and a metered minutes wallet. To place real calls, wire one carrier:
        a <strong>LiveKit SIP trunk</strong> (<code className="font-mono">LIVEKIT_SIP_TRUNK_ID</code>), or
        <strong> Telnyx</strong> (<code className="font-mono">TELNYX_API_KEY</code> + <code className="font-mono">TELNYX_CONNECTION_ID</code> + <code className="font-mono">TELNYX_FROM_NUMBER</code>).
        See <Anchor href="/pricing">pricing</Anchor> for metered minutes.
      </Callout>

      <H2>Tools</H2>

      <H3>mCALL_start_pstn</H3>
      <Pre lang="ts">{`mCALL_start_pstn({
  to: string,         // E.164, e.g. +14155550123
  vocoder?: boolean,  // disguise the caller's voice (anonymous). Default false
})
→ {
  session_id,
  room_name,
  destination_number,
  vocoder_enabled,
  minutes_remaining,
  zone,
  zone_label,
}`}</Pre>
      <P>
        The caller number is carrier-provisioned server-side (LiveKit SIP trunk or Telnyx). There is no
        number-acquisition tool: the sending DID is set by the wired carrier, not chosen per call.
      </P>

      <H3>mCALL_end_pstn</H3>
      <Pre lang="ts">{`mCALL_end_pstn({ session_id })   // session_id from mCALL_start_pstn
→ { duration_ms, cost_credits }`}</Pre>

      <H2>BYOC — bring your own carrier</H2>
      <Ul>
        <li>Point mCALL at your own Telnyx/LiveKit SIP trunk: transmission bills to your account, mosadd takes a thin hub fee, zero markup on minutes.</li>
        <li>Per-tenant DID self-service (buy/list numbers from MCP) is on the roadmap — not yet a tool.</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <Ul>
        <li><code className="font-mono">COMINT.pstn_session_start</code></li>
        <li><code className="font-mono">SIGINT.ss7_redirect_suspected</code> — anomalous call-path routing</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
