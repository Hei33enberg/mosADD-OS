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
        <code className="font-mono text-radar-green">mCALL</code> dials real phone numbers (E.164) from a pooled or
        dedicated DID, bridges the media over an encrypted SIP relay, and can disguise the caller&apos;s voice with a
        vocoder. The control plane is MCP; audio never flows through the tool call (see{' '}
        <Anchor href="/docs/mcp">MCP server / long-running sessions</Anchor>).
      </P>

      <Callout type="warn">
        <strong>Status: design.</strong> Tools are specced and ~70% of the backend exists, but live PSTN requires
        carrier onboarding (Telnyx eKYC + DID provisioning) before any call can be placed. Until then the tools return
        a <code className="font-mono">coming_soon</code> state. See{' '}
        <Anchor href="/pricing">pricing</Anchor> for metered minutes when it lands.
      </Callout>

      <H2>Tools (planned surface)</H2>

      <H3>mCALL_start_pstn</H3>
      <Pre lang="ts">{`mCALL_start_pstn({
  to: string,                 // E.164, e.g. +14155550123
  from?: string,              // your DID, or pooled number
  vocoder_preset?: 'none' | 'pitch_shift' | 'rvc:<voice_id>',
})
→ { session_id, daemon_socket, sip_jwt }`}</Pre>

      <H3>mCALL_list_did / mCALL_acquire_did</H3>
      <Pre lang="ts">{`mCALL_list_did({})
→ { numbers: [{ phone_number, country, monthly_cost_usd }], remaining_minutes }

mCALL_acquire_did({ country, area_code? })
→ { phone_number, monthly_cost_usd }`}</Pre>

      <H3>mCALL_end_pstn</H3>
      <Pre lang="ts">{`mCALL_end_pstn({ session_id })
→ { duration_ms, cost_credits }`}</Pre>

      <H2>BYOC — bring your own carrier</H2>
      <Ul>
        <li>Point mCALL at your own Telnyx/Twilio trunk: transmission bills to your account, mosadd takes a thin hub fee, zero markup on minutes.</li>
        <li>Or use the pooled DIDs + metered minutes once carrier onboarding completes.</li>
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
