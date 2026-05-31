import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Threat model, hardening posture, and coordinated disclosure for mosadd.',
};

export default function SecurityPage() {
  return (
    <Prose>
      <H1>Security</H1>
      <Lead>Threat model, hardening posture, and coordinated disclosure for mosadd.</Lead>

      <Callout type="warn">
        mosadd is <strong>pre-alpha</strong>. Do not use it for safety-critical communications yet. Bridges and PSTN have legal review pending.
      </Callout>

      <H2>Reporting a vulnerability</H2>
      <P>
        Please <strong>do not</strong> open a public GitHub issue. Instead:
      </P>
      <Ul>
        <li>Email <code className="font-mono text-radar-green">security@mosadd.com</code> with the report</li>
        <li>Or use GitHub's <Anchor href="https://github.com/Hei33enberg/mosadd-os/security/advisories/new">private vulnerability reporting</Anchor></li>
        <li>Expect an acknowledgement within <strong>72 hours</strong></li>
        <li>Coordinated disclosure window: <strong>90 days</strong> (negotiable for actively-exploited issues)</li>
      </Ul>
      <P>See the full policy in <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/SECURITY.md">SECURITY.md</Anchor>.</P>

      <H2>Threat model</H2>
      <P>
        We use a STRIDE-derived model with module-specific extensions for voice (mTALK), PSTN (mCALL), and bridges. Full document in{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/security/threat-model.md">
          <code className="font-mono">docs/security/threat-model.md</code>
        </Anchor>.
      </P>

      <H3>Attack surface</H3>
      <Ul>
        <li>MCP server (stdio + future HTTP/SSE) — prompt injection, tool poisoning, BYOK exfiltration</li>
        <li>Edge functions — auth bypass, replay, IDOR on tenant scoping</li>
        <li>Bridges — credential theft from federation links, bidirectional content laundering</li>
        <li>Voice — deepfake injection, prompt-injection-via-TTS, floor-control abuse</li>
        <li>Identity recovery — passphrase phishing, seed-phrase social engineering</li>
      </Ul>

      <H3>Defenses</H3>
      <Ul>
        <li>Threat radar — 167 event types, every tool call emits structured events with severity + actor + subject</li>
        <li>Rate limits — per-user, per-tool, with backoff on radar score</li>
        <li>RLS — every table enforces row-level security; coverage verified in CI</li>
        <li>Supply chain — SBOM (SPDX 2.3) per package, CodeQL, gitleaks, license-check on every PR</li>
        <li>E2E — X3DH + Double Ratchet via <code className="font-mono text-radar-green">@mosadd/crypto</code> on opt-in</li>
      </Ul>

      <H2>Hardening guide for operators</H2>
      <Pre lang="bash">{`# minimum env hygiene
export MOSADD_LOG_LEVEL=warn
export MOSADD_RATE_LIMIT_MODE=strict
export MOSADD_AUDIT_RETENTION_DAYS=2555  # NIS2 7-year minimum

# disable bridges you don't use
export MOSADD_DISABLE_BRIDGES=whatsapp,imessage`}</Pre>

      <H2>Compliance posture</H2>
      <Ul>
        <li><strong>GDPR</strong> — DSR endpoints + 72h breach notification process (see incident-response.md)</li>
        <li><strong>NIS2</strong> — 7-year audit log retention for sensitive events</li>
        <li><strong>SOC 2 Type I</strong> — target Phase 2</li>
        <li><strong>Common Criteria EAL2+</strong> — SBOM supply-chain attestation pipeline already shipping</li>
      </Ul>
    </Prose>
  );
}
