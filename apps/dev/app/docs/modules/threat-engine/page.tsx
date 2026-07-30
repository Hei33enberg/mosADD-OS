import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Table, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'Irondome',
  description:
    'Irondome — the classification layer behind mLIDAR, mosADD\'s on-device threat monitor, shipped as an embeddable Apache-2.0 package. @mosadd/threat-engine is the same engine that runs on-device in mosadd.com.',
};

export default function ThreatEnginePage() {
  return (
    <Prose>
      <H1>Irondome</H1>
      <Lead>The classification layer behind mLIDAR — a canonical threat-event taxonomy plus a pure decision engine, as an embeddable package.</Lead>

      <P>
        <code className="font-mono text-primary">@mosadd/threat-engine</code> (Apache-2.0) is the{' '}
        <strong>same engine</strong> that powers the mosadd.com app&apos;s radar. Ship it in <em>your</em> app
        (Electron / mobile / web) so you don&apos;t have to build a threat taxonomy from scratch. It is a pure,
        side-effect-free decision function — events in, a defensive verdict out — so it runs anywhere with no backend.
      </P>

      <Callout type="warn">
        <strong>A taxonomy entry is not a detector.</strong> The package ships 193 event types the engine can{' '}
        <em>classify</em>. That is a catalog, not a count of things being detected — a detector is code wired to a real
        sensor on a real platform, and there are far fewer of those. Across mosADD&apos;s live collectors, 20 event
        types are actually emitted today. Read{' '}
        <code className="font-mono text-primary">THREAT_EVENT_COUNT</code> for the live catalog size, and see{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/threat-monitoring.md">
          docs/threat-monitoring.md
        </Anchor>{' '}
        for what fires.
      </Callout>

      <H2>Install</H2>
      <Pre lang="bash">{`npm i @mosadd/threat-engine@alpha`}</Pre>

      <H2>The taxonomy</H2>
      <P>
        Events are tagged with one of ten intelligence-discipline categories. Read{' '}
        <code className="font-mono text-primary">CATEGORY_EVENT_COUNTS</code> for live per-category numbers rather than
        trusting any table:
      </P>
      <Table
        headers={['Category', 'What it covers']}
        rows={[
          [<code key="spyware" className="font-mono text-primary">SPYWARE</code>, 'Mercenary-spyware IOC hits — C2 beacons, known implant processes/packages, rogue MDM profiles, exploit traces. The Pegasus-class category'],
          [<code key="sigint" className="font-mono text-primary">SIGINT</code>, 'Signals & device — radios, sensors, network transport, cell/baseband, device integrity. The largest category'],
          [<code key="cyber" className="font-mono text-primary">CYBER</code>, 'Runtime attack & anti-tamper — injection, hooking, rootkits, sandbox escape — plus desktop OS security posture'],
          [<code key="masint" className="font-mono text-primary">MASINT</code>, 'Measurement & signature — power, thermal, acoustic, EM emanation, side-channel, clock skew'],
          [<code key="behavioral" className="font-mono text-primary">BEHAVIORAL</code>, 'Behavioral anomalies — typing/gait/usage patterns, app lifecycle, session anomalies'],
          [<code key="comint" className="font-mono text-primary">COMINT</code>, 'Communications — RTP/SIP/VoIP anomalies, silent SMS, call forwarding, VoLTE downgrade'],
          [<code key="elint" className="font-mono text-primary">ELINT</code>, 'Electronic — RF spectrum, jamming, SDR sweeps, triangulation'],
          [<code key="privacy" className="font-mono text-primary">PRIVACY</code>, 'Tracking & leakage — fingerprinting, WebRTC leak, cross-app tracking, indicator bypass'],
          [<code key="mpost" className="font-mono text-primary">MPOST</code>, 'mAYL mail intelligence — delivery, open/click tracking, bounce, complaint, forward'],
          [<code key="osint" className="font-mono text-primary">OSINT</code>, 'Open-source exposure — breach databases, dark-web mentions, public data exposure'],
        ]}
      />

      <H2>Scoring API</H2>
      <P>
        The core is one deterministic function: hand it a <code className="font-mono text-primary">ThreatEvent</code>,
        get back a <code className="font-mono text-primary">ThreatDecision</code> with the recommended defensive
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

      <H2>Engine vs collectors</H2>
      <P>
        Be clear about what you get. This package is the classification <strong>engine</strong> — a pure function with
        no network, which you run client-side. A managed hosted service is not part of the free toolkit.
      </P>
      <P>
        The <strong>collectors</strong> are separate: in the mosADD app, mLIDAR observes the device and feeds events to
        this engine. The engine itself never phones home, but mLIDAR&apos;s findings <em>are</em> uploaded to your
        mosADD account — so &ldquo;nothing leaves the device&rdquo; is true of the package and false of the monitor.
        mLIDAR is opt-in, off by default, and signals only: it never blocks, disconnects, or wipes. The full
        breakdown of what fires on which platform is in{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/threat-monitoring.md">
          docs/threat-monitoring.md
        </Anchor>.
      </P>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
