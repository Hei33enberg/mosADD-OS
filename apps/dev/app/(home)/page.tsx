import Link from 'next/link';
import { Terminal } from '../_components/Terminal';
import { SocialProof } from '../_components/SocialProof';
import { ComparisonTable } from '../_components/ComparisonTable';
import { RadarHero } from '../_components/RadarHero';

// Grouped by the job, not the channel. HUDDLE (get a human in the loop) leads —
// it's the one thing only mosADD does. REACH (email the outside world) and
// REMEMBER (agent memory) support it.
const modules = [
  // ── HUDDLE: agent ↔ human, live ──
  { name: 'mROOM', desc: 'Your agent spins an ephemeral room and drops a no-signup guest link to a human. They huddle, decide, the room tears down to zero residual state. The human-in-the-loop moment.', tools: 9, url: '/docs/modules/mroom', tag: 'huddle' },
  { name: 'mTALK', desc: 'Live push-to-talk voice with half-duplex floor control — your agent and a human in the same call, in real time. Anomaly detection on the media path.', tools: 5, url: '/docs/modules/mtalk', tag: 'huddle' },
  { name: 'mDM', desc: 'Private 1:1 thread your agent owns — text + voice, end-to-end encrypted (X3DH + Double Ratchet) with forward secrecy. The server sees ciphertext only.', tools: 12, url: '/docs/modules/mdm', tag: 'huddle' },
  // ── REACH: agent ↔ the outside world ──
  { name: 'mp0st', desc: 'A real inbox your agent can be reached at — <id>@mosadd.com or your own domain. Send, receive and parse email from anyone; open / click tracking. Standard mail transport (not E2EE).', tools: 12, url: '/docs/modules/mail', tag: 'reach' },
  // ── REMEMBER: agent memory ──
  { name: 'mRAG', desc: 'Per-tenant agent memory — semantic recall over your own data, isolated per key and encrypted at rest. Server-side by design (it must read to embed). Your agents remember.', tools: 4, url: '/docs/modules/mrag', tag: 'remember' },
  // ── Channels + embeddable widget ──
  { name: 'mIRC', desc: 'Persistent channels with Discord/Slack ergonomics — topic-scoped, invite-only, moderated. Also the engine behind the embeddable website chat widget. Your key, not vendor lock-in.', tools: 20, url: '/docs/modules/mirc', tag: 'channels' },
];

const threats = [
  {
    t: 'E2EE on the private DM',
    d: 'The private 1:1 thread (mDM) is end-to-end encrypted with forward secrecy — X3DH + Double Ratchet, server sees ciphertext only. Rooms, channels and mail are encrypted in transit and at rest, with self-destruct and zero-retention options. We do not claim E2EE where we cannot deliver it.',
  },
  {
    t: 'Your keys, not ours',
    d: 'BYOK or self-host: bring your own provider keys (LiveKit, Resend, OpenAI, Supabase) or run the whole Apache-2.0 stack yourself. The operator is not a black box you have to trust — the source is auditable.',
  },
  {
    t: 'Threat radar — Iron Dome',
    d: 'A 166-event detection taxonomy informed by the same Amnesty International / Citizen Lab research that documents mobile spyware — it flags device-integrity and network anomalies: rooted / tampered devices, sideloaded apps, stalkerware-style abuse and MITM. Every message is scored. The same engine shipping in @mosadd/threat-engine.',
  },
];

const steps = [
  { n: '1', t: 'Install the MCP server', d: "Add the mosADD MCP server to your agent's tool config. One command — npm pulls everything it needs, nothing else to wire up.", c: 'claude mcp add mosadd -- npx -y @mosadd/mcp@alpha' },
  { n: '2', t: 'Add your keys — or go hosted', d: 'Supply your own keys and self-host the relay, or point at the hosted endpoint. Switch modes without changing tool signatures.', c: 'mosadd login' },
  { n: '3', t: 'Call a tool', d: 'Your agent calls mDM_send, mROOM_create_guest_link, mp0st_send — any of the 71 tools. Encryption, routing and threat monitoring happen below the call.', c: 'mDM_send  ·  mROOM_create_guest_link' },
];

/** Tiny monospace section index, e.g. §01. */
function SectionTag({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-primary/80">
      <span className="font-display">§{n}</span>
      <span className="h-px w-8 bg-primary/30" />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Hero (threat radar) ── */}
      <RadarHero />

      {/* ── Social proof ── */}
      <SocialProof />

      {/* ── §01 Problem → solution ── */}
      <section className="py-16">
        <SectionTag n="01" label="The glue-code tax" />
        <h2 className="font-display mb-8 text-3xl font-semibold tracking-tight">You should not be writing glue code.</h2>
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          <div className="bg-background p-6">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">The stack you inherit</div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>· LiveKit for voice. Twilio for SMS. Resend for mail. Matrix for rooms. Four SDKs, four bills, four failure modes.</li>
              <li>· Every channel is a separate integration, key-rotation schedule and rate-limit to manage.</li>
              <li>· Vendor lock-in is structural — swap one provider and the glue dissolves.</li>
              <li>· None of it ships with security. Threat detection is your problem.</li>
            </ul>
          </div>
          <div className="bg-background p-6">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">One MCP server</div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>· <span className="text-foreground">The escalation moment, solved</span> — guest-link rooms + voice + a private E2EE DM pull a human into the loop, in one link.</li>
              <li>· <span className="text-foreground">A 166-event threat radar in the kernel</span> — not a bolt-on. Every message scored before it moves.</li>
              <li>· One install, one config block. Reach, huddle and memory in the same tool namespace.</li>
              <li>· BYOK or go hosted; Apache-2.0 if you want to self-host and audit the source.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── §02 Comparison ── */}
      <section id="comparison" className="py-16 scroll-mt-20">
        <SectionTag n="02" label="vs single-vendor stacks" />
        <h2 className="font-display text-3xl font-semibold tracking-tight">Single-vendor is not a security posture.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Twilio Agent Connect owns your channel. Composio owns your integration. LiveKit owns your call. mosADD owns
          nothing — your keys, your data, your audit trail. And none of them ship with a threat radar.
        </p>
        <div className="mt-8">
          <ComparisonTable />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">✓ yes · ~ partial · ✗ no. Corrections welcome — open an issue.</p>
      </section>

      {/* ── §03 Threat-aware (Iron Dome differentiator) ── */}
      <section className="relative overflow-hidden py-16">
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[120px]" />
        <SectionTag n="03" label="Iron Dome" />
        <h2 className="font-display text-3xl font-semibold tracking-tight">Iron Dome is not a feature. It is the kernel.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          mosadd ships the same 166-event threat engine (<code className="font-mono text-primary">@mosadd/threat-engine</code>) that powers
          mosadd.com as a package you embed in your own app — the radar is a primitive you get, not a hosted service watching your traffic.
        </p>
        <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {threats.map((c) => (
            <div key={c.t} className="bg-card/40 p-6 backdrop-blur-sm transition-colors hover:bg-card">
              <h3 className="font-display mb-3 text-sm uppercase tracking-[0.15em] text-primary">{c.t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── §04 Modules ── */}
      <section className="py-16">
        <div className="flex items-end justify-between">
          <div>
            <SectionTag n="04" label="reach · huddle · remember" />
            <h2 className="font-display text-3xl font-semibold tracking-tight">Six channels. One job: get a human in the loop.</h2>
          </div>
          <Link href="/docs/rfcs" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">
            RFC 0001 · m* naming →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each module is a discrete MCP tool set — use the ones your agent needs. All share the same auth context, key
          material and threat surface.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.name}
              href={m.url}
              className="group bg-card/40 p-5 backdrop-blur-sm transition-colors hover:bg-card"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-lg text-primary">{m.name}</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-primary">{m.tools} tools</span>
              </div>
              <div className="text-sm leading-relaxed text-muted-foreground">{m.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── §05 How it works ── */}
      <section className="py-16">
        <SectionTag n="05" label="Setup" />
        <h2 className="font-display mb-8 text-3xl font-semibold tracking-tight">Three commands to operational.</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="border border-border bg-card/40 p-5 backdrop-blur-sm">
              <div className="mb-3 font-display text-3xl text-primary/60">{s.n}</div>
              <h3 className="font-display mb-2 text-lg font-semibold text-foreground">{s.t}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              <code className="block overflow-x-auto border border-border bg-card px-3 py-2 font-mono text-xs text-primary">{s.c}</code>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-xl">
          <Terminal label="claude code">claude mcp add mosadd -- npx -y @mosadd/mcp@alpha</Terminal>
        </div>
      </section>

      {/* ── §06 CTA ── */}
      <section className="py-20">
        <SectionTag n="06" label="Open source" />
        <h2 className="font-display mb-3 text-3xl font-semibold tracking-tight">
          Open source. Audit it yourself.<span className="term-cursor" />
        </h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">Apache-2.0 licensed. The source is the documentation.</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="rounded-none bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Star on GitHub
          </a>
          <Link href="/examples" className="rounded-none border border-border px-4 py-2 transition-colors hover:border-primary/50">
            Browse examples
          </Link>
          <a
            href="https://github.com/Hei33enberg/mosadd-os/issues/new"
            target="_blank"
            rel="noreferrer"
            className="rounded-none border border-border px-4 py-2 transition-colors hover:border-primary/50"
          >
            Open an issue
          </a>
        </div>
      </section>
    </div>
  );
}
