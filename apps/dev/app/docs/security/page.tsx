import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security posture for mosADD — E2EE, zero-knowledge, RLS-everywhere, threat radar, and radical honesty about what is and is not encrypted.',
};

export default function SecurityPage() {
  return (
    <Prose>
      <H1>Security</H1>
      <Lead>
        Security is the kernel, not a feature. Encryption, zero-knowledge storage and threat detection ship by
        default — and we tell you, plainly, exactly what is and isn&apos;t covered.
      </Lead>

      <H2>What ships by default</H2>
      <Ul>
        <li><strong>E2EE for 1:1 (mDM).</strong> X3DH + Double Ratchet with forward secrecy via <code className="font-mono text-radar-green">@mosadd/crypto</code> — enforced before any payload leaves the process.</li>
        <li><strong>Zero-knowledge storage.</strong> The hosted layer stores opaque ciphertext for encrypted surfaces; it can&apos;t be compelled to produce plaintext it never holds.</li>
        <li><strong>RLS on every table.</strong> Row-level security is enforced per-tenant across the whole schema, with coverage verified in CI.</li>
        <li><strong>Cryptographic identity.</strong> Ed25519, not email/phone — no PII at the identity layer.</li>
        <li><strong>Threat radar (DECK).</strong> The same ~160-event detection layer that flags Pegasus-class implants on <strong>mosadd.com</strong> backs the platform; the dev toolkit is comms-only by design and inherits the encrypted backbone.</li>
        <li><strong>Hardened supply chain.</strong> SBOM (SPDX 2.3) per package, CodeQL, gitleaks and license-check on every PR. Apache-2.0 — audit the source yourself.</li>
      </Ul>

      <H2>Encryption posture — exactly what is and isn&apos;t E2EE</H2>
      <P>
        We state this plainly on purpose: alpha software should never imply a guarantee it doesn&apos;t deliver.
        Radical honesty about crypto <em>is</em> the trust model. Full detail in{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/security/e2ee-posture.md">
          <code className="font-mono">docs/security/e2ee-posture.md</code>
        </Anchor>.
      </P>
      <Ul>
        <li><strong>mDM (1:1) — end-to-end encrypted.</strong> X3DH + Double Ratchet. Requires the recipient to have published prekeys (<code className="font-mono">mDM_publish_keys</code>); otherwise <code className="font-mono">mDM_send_unencrypted</code> is a clearly-labelled plaintext fallback.</li>
        <li><strong>mIRC / mROOM — transport-encrypted, group-key E2EE in progress.</strong> Messages travel over TLS/WSS; the toolkit currently persists a server-readable payload (the tool descriptions say so). Per-channel group-key encryption (parity with the mosadd.com app) is the next crypto milestone.</li>
        <li><strong>mKB / RAG — plaintext server-side by design.</strong> Vector search must read content to index it; anything searchable is, by construction, outside the zero-knowledge guarantee. Opt-in, off by default.</li>
        <li><strong>Independent audit — not yet.</strong> mosADD is in active alpha and has not completed a third-party cryptographic audit. We&apos;d rather say so than imply otherwise — responsible disclosure welcome.</li>
      </Ul>

      <H2>Threat model</H2>
      <P>
        STRIDE-derived, with module-specific extensions for voice (mTALK), PSTN (mCALL) and bridges. Full document in{' '}
        <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/security/threat-model.md">
          <code className="font-mono">docs/security/threat-model.md</code>
        </Anchor>.
      </P>
      <H3>Attack surface we design against</H3>
      <Ul>
        <li>MCP server (stdio + hosted) — prompt injection, tool poisoning, BYOK exfiltration</li>
        <li>Edge functions — auth bypass, replay, IDOR on tenant scoping</li>
        <li>Bridges — credential theft from federation links, bidirectional content laundering</li>
        <li>Voice — deepfake injection, prompt-injection-via-TTS, floor-control abuse</li>
        <li>Identity recovery — passphrase phishing, seed-phrase social engineering</li>
      </Ul>
      <H3>Defenses</H3>
      <Ul>
        <li>Rate limits — per-user, per-key, per-tool, with backoff and hard quota stops</li>
        <li>RLS — every table, CI-verified</li>
        <li>Supply chain — SBOM, CodeQL, gitleaks, license-check on every PR</li>
        <li>Tenant isolation — scoped keys; one creator&apos;s data is never reachable by another</li>
      </Ul>

      <H2>Compliance posture</H2>
      <Ul>
        <li><strong>GDPR</strong> — data-subject erasure endpoints + a 72h breach-notification process</li>
        <li><strong>NIS2</strong> — 7-year audit-log retention for sensitive events</li>
        <li><strong>SOC 2 Type I</strong> — targeted as the platform exits alpha</li>
        <li><strong>Supply-chain attestation</strong> — SBOM pipeline shipping today</li>
      </Ul>

      <H2>Hardening guide for operators</H2>
      <Pre lang="bash">{`# minimum env hygiene
export MOSADD_LOG_LEVEL=warn
export MOSADD_RATE_LIMIT_MODE=strict
export MOSADD_AUDIT_RETENTION_DAYS=2555  # NIS2 7-year minimum

# disable bridges you don't use
export MOSADD_DISABLE_BRIDGES=whatsapp,imessage`}</Pre>

      <H2>Reporting a vulnerability</H2>
      <P>Please <strong>do not</strong> open a public GitHub issue. Instead:</P>
      <Ul>
        <li>Email <code className="font-mono text-radar-green">security@mosadd.com</code></li>
        <li>Or use GitHub&apos;s <Anchor href="https://github.com/Hei33enberg/mosadd-os/security/advisories/new">private vulnerability reporting</Anchor></li>
        <li>Acknowledgement within <strong>72 hours</strong></li>
        <li>Coordinated disclosure window: <strong>90 days</strong> (negotiable for actively-exploited issues)</li>
      </Ul>
      <P>Full policy in <Anchor href="https://github.com/Hei33enberg/mosadd-os/blob/main/SECURITY.md">SECURITY.md</Anchor>.</P>

      <Callout type="info">
        <strong>Status:</strong> mosADD is in active alpha — encryption surfaces and bridges are still hardening, and
        PSTN has carrier/legal review pending. Run it, audit it, break it, tell us. That&apos;s the point of open source.
      </Callout>
    </Prose>
  );
}
