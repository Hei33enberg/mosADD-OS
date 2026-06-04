import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mCALL',
  description: 'Burner telephony API: lease an ephemeral 10-min number, place & receive real phone calls from an agent over an encrypted SIP relay, with an optional voice mask.',
};

export default function McallPage() {
  return (
    <Prose>
      <H1>mCALL</H1>
      <Lead>Burner telephony as an API — lease an ephemeral number, call and receive over an encrypted SIP relay, mask the caller&apos;s voice with a vocoder.</Lead>

      <P>
        <code className="font-mono text-radar-green">mCALL</code> leases a short-lived (&ldquo;burner&rdquo;) phone
        number, presents it as your caller-ID on outbound calls, receives inbound calls to it, and can disguise the
        caller&apos;s voice with a vocoder. Real PSTN (E.164), media bridged over an encrypted SIP relay. The control
        plane is MCP; audio never flows through the tool call (see{' '}
        <Anchor href="/docs/mcp">MCP server / long-running sessions</Anchor>).
      </P>

      <Callout type="warn">
        <strong>Status: backend live, awaiting a carrier.</strong> The control plane, ephemeral-number lease,
        metering and inbound routing are deployed on prod
        (<code className="font-mono">call-did-pool</code>, <code className="font-mono">call-start-pstn</code> /{' '}
        <code className="font-mono">call-end-pstn</code>, <code className="font-mono">call-inbound-webhook</code>).
        To place/receive real calls, wire one carrier: a <strong>LiveKit SIP trunk</strong>{' '}
        (<code className="font-mono">LIVEKIT_SIP_TRUNK_ID</code>) or <strong>Telnyx</strong>{' '}
        (<code className="font-mono">TELNYX_API_KEY</code> + <code className="font-mono">TELNYX_CONNECTION_ID</code>),
        and point the carrier&apos;s inbound webhook at <code className="font-mono">call-inbound-webhook</code>.
        See <Anchor href="/pricing">pricing</Anchor> for metered minutes.
      </Callout>

      <H2>Burner numbers (ephemeral DIDs)</H2>
      <P>
        A leased number lives for ~10 minutes. While held it is your outbound caller-ID and can receive inbound
        calls; it auto-recycles when the lease lapses — never mid-call. Extend to keep it, release to drop it early.
      </P>
      <Pre lang="ts">{`mCALL_acquire_number({})   // idempotent — returns your live lease if you hold one
→ { did: { id, phone_number, hold_until }, reused, hold_until, seconds_remaining }

mCALL_my_numbers({})
→ { numbers: [{ id, phone_number, seconds_remaining }] }

mCALL_extend_number({ number_id? })   // omit to extend your current lease
→ { did, hold_until, seconds_remaining }

mCALL_release_number({ number_id? })  // omit to release all you hold
→ { released, dids }`}</Pre>

      <H2>Outbound</H2>

      <H3>mCALL_start_pstn</H3>
      <Pre lang="ts">{`mCALL_start_pstn({
  to: string,         // E.164, e.g. +14155550123
  vocoder?: boolean,  // disguise the caller's voice (anonymous). Default false
})
→ {
  session_id,
  room_name,
  destination_number,
  from_number,        // your leased burner number (caller-ID), if one is held
  vocoder_enabled,
  minutes_remaining,
  zone,
  zone_label,
}`}</Pre>
      <P>
        If you hold a leased number it is presented as the caller-ID (<code className="font-mono">from_number</code>);
        otherwise mCALL falls back to the carrier&apos;s static DID. Acquire a number first to call as your burner.
      </P>

      <H3>mCALL_end_pstn</H3>
      <Pre lang="ts">{`mCALL_end_pstn({ session_id })   // session_id from mCALL_start_pstn
→ { duration_ms, cost_credits }`}</Pre>

      <H2>Inbound (receiving calls)</H2>
      <P>
        When someone dials your leased number, <code className="font-mono">call-inbound-webhook</code> resolves the
        current lessee, opens a call leg, and signals you out-of-band (MCP is request/response, so rings are pushed,
        not polled):
      </P>
      <Ul>
        <li><strong>Supabase Realtime broadcast</strong> on channel <code className="font-mono">mcall-inbound-&lt;identity_id&gt;</code>, event <code className="font-mono">inbound_call</code>.</li>
        <li><strong>Integrator webhook</strong> (optional) — a single URL via <code className="font-mono">MCALL_INBOUND_WEBHOOK_URL</code> for MVP; per-key registration is on the roadmap.</li>
      </Ul>
      <Pre lang="ts">{`// inbound_call payload
{ session_id, room_name, from, to, call_control_id, at }

// answer it — mint a LiveKit token and join the room to bridge audio
mCALL_answer({ room_name })
→ { token, url, roomName, identity }`}</Pre>
      <P>
        Join the room with the returned token and publish your microphone — or a vocoder-processed track to mask your
        voice on answer too.
      </P>

      <H2>Voice mask (vocoder)</H2>
      <P>
        The vocoder runs client-side: build a Web Audio chain (EQ + pitch-shift, e.g. the
        <code className="font-mono"> ANONYMOUS</code> preset) and publish the processed track instead of the raw mic.
        Set <code className="font-mono">vocoder: true</code> on <code className="font-mono">mCALL_start_pstn</code> to
        flag the call as masked. Server-side audio is never transformed — the mask is produced where the audio is.
      </P>

      <H2>BYOC — bring your own carrier</H2>
      <Ul>
        <li>Point mCALL at your own Telnyx/LiveKit SIP trunk: transmission bills to your account, mosadd takes a thin hub fee, zero markup on minutes.</li>
        <li>Self-service ephemeral numbers (acquire/extend/release from MCP) are <strong>live</strong>; SMS and a hosted consumer app are on the roadmap.</li>
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
