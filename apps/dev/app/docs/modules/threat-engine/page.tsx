import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Table, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'Threat Engine',
  description:
    'The 167-event threat taxonomy + scoring — the kernel security primitive, as an embeddable package. @mosadd/threat-engine ships the same engine that powers the mosadd.com radar.',
};

export default function ThreatEnginePage() {
  return (
    <Prose>
      <H1>Threat Engine</H1>
      <Lead>The 167-event threat taxonomy + scoring — the kernel security primitive, as an embeddable package.</Lead>

      <P>
        <code className="font-mono text-radar-green">@mosadd/threat-engine</code> (Apache-2.0) is the{' '}
        <strong>same engine</strong> that powers the mosadd.com app&apos;s radar. Ship it in <em>your</em> app
        (Electron / mobile / web) so you don&apos;t have to rewrite 167 detections from scratch. It is a pure,
        side-effect-free decision function — events in, a defensive verdict out — so it runs anywhere with no backend.
      </P>

      <Callout type="info">
        <strong>Status: alpha.</strong> The decision engine is live and embeddable today. The full 167-event taxonomy
        port lands incrementally across the <code className="font-mono">3.0.0-alpha</code> line.
      </Callout>

      <H2>Install</H2>
      <Pre lang="bash">{`npm i @mosadd/threat-engine`}</Pre>

      <H2>The 167-event taxonomy</H2>
      <P>
        Every module&apos;s &ldquo;Threat radar hooks&rdquo; emits events tagged with one of six category prefixes.
        Here is the reference so you finally know what each one means:
      </P>
      <Table
        headers={['Category', 'What it covers']}
        rows={[
          [<code key="comint" className="font-mono text-radar-green">COMINT</code>, 'Communications intelligence — anomalies in message/channel/room traffic (volume spikes, exfiltration patterns, malformed payloads)'],
          [<code key="sigint" className="font-mono text-radar-green">SIGINT</code>, 'Signals intelligence — network/transport signals: SS7 routing anomalies, SIP malformation, QoS drops, IMSI-catcher fingerprints'],
          [<code key="masint" className="font-mono text-radar-green">MASINT</code>, 'Measurement & signature intelligence — device/OS-level signatures: known spyware fingerprints, kernel-compromise + SIM-swap indicators'],
          [<code key="behavioral" className="font-mono text-radar-green">BEHAVIORAL</code>, 'Behavioral anomalies — auth brute-force, session/identity misuse, carrier/DID abuse (toll fraud, robocalls)'],
          [<code key="phishing" className="font-mono text-radar-green">PHISHING</code>, 'Social-engineering surface — impersonation, malicious links, contact-request abuse'],
          [<code key="privacy" className="font-mono text-radar-green">PRIVACY</code>, 'Privacy / data-leak signals — PII exposure, location leakage, metadata that breaks the zero-knowledge posture'],
        ]}
      />

      <H2>Scoring API</H2>
      <P>
        The core is one deterministic function: hand it a <code className="font-mono text-radar-green">ThreatEvent</code>,
        get back a <code className="font-mono text-radar-green">ThreatDecision</code> with the recommended defensive
        action, a normalized severity, and a human-readable reason. The engine <em>decides</em>; the caller carries
        out the action against whatever backend it has.
      </P>
      <Pre lang="ts">{`import { evaluateEvent, VERSION } from '@mosadd/threat-engine';

const decision = evaluateEvent({
  eventType: 'SIM_SWAP',   // case-insensitive, e.g. AUTH_BRUTEFORCE, QOS_DROP
  severity: 'killswitch',  // optional producer hint: "killswitch" | "critical"
  details: 'carrier reported SIM re-provision',
});

// decision = {
//   action:   'lock_account',   // 'log_only' | 'revoke_sessions' | 'lock_account' | 'suspend_did'
//   severity: 'killswitch',     // 'info' | 'warning' | 'critical' | 'killswitch'
//   reason:   'Critical physical or OS-level compromise detected',
// }

// YOU execute decision.action against your backend — the engine never acts.`}</Pre>
      <P>
        Real export shape lives in{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/packages/threat-engine/src/index.ts">
          packages/threat-engine/src/index.ts
        </Anchor>{' '}
        — <code className="font-mono">evaluateEvent</code>, the <code className="font-mono">ThreatEvent</code> /{' '}
        <code className="font-mono">ThreatDecision</code> / <code className="font-mono">ThreatAction</code> /{' '}
        <code className="font-mono">ThreatSeverity</code> types, and a pinned <code className="font-mono">VERSION</code>.
      </P>

      <H2>Engine vs hosted radar</H2>
      <P>
        Be clear about what you get: the package is the detection <strong>engine</strong> you run client-side — the
        same way mosadd.com evaluates threats on-device. A managed, hosted radar service (cross-tenant correlation,
        live feeds, alerting) is the <strong>Phase-2 commercial layer</strong>, <em>not</em> something running on the
        free dev toolkit today. The free toolkit hands you the engine; nothing here phones home or watches your
        traffic.
      </P>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
