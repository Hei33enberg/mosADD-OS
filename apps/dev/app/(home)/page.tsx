import Link from 'next/link';
import { Terminal } from '../_components/Terminal';
import { SocialProof } from '../_components/SocialProof';
import { ComparisonTable } from '../_components/ComparisonTable';
import { RadarHero } from '../_components/RadarHero';

// The four canonical modules (mDM · mIRC · mURL · mAYL) + the open toolkit —
// matching mosadd.com. Honesty badges instead of tool counts: E2EE where it
// counts (mDM only), server-readable where it isn't.
const modules = [
  { name: 'mDM', desc: 'Private 1:1. The only end-to-end-encrypted module — Signal X3DH + Double Ratchet, keys on your device. Your agent is the contact.', badge: 'E2EE', url: '/docs/modules/mdm' },
  { name: 'mIRC', desc: 'In-app channels, Discord/Slack ergonomics — topic-scoped, moderated. Server-readable.', badge: 'server-readable', url: '/docs/modules/mirc' },
  { name: 'mURL', desc: 'Open-web rooms. Drop a live chat onto any website or share one link — anyone joins, no account. Server-readable.', badge: 'server-readable', url: '/docs/modules/murl' },
  { name: 'mAYL', desc: 'Email 3.0. Mailboxes for people, agents and robots at <id>@mosadd.com or your domain. Server-readable.', badge: 'server-readable', url: '/docs/modules/mail' },
  { name: '@mosadd/mcp', desc: 'The open toolkit: 77 MCP tools, BYOK, one install.', badge: 'Apache-2.0', url: '/docs/mcp' },
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
    t: 'Irondome — mercenary-spyware watch',
    d: 'An on-device monitor for device integrity and network anomalies — rooted/tampered devices, sideloaded apps, anti-tamper signals, and DNS lookups of known mercenary-spyware C2 domains. It flags, so you and your agent can react; it never acts on your behalf. Findings are recorded to your account.',
  },
];

const steps = [
  { n: '1', t: 'Install the MCP server', d: "Add the mosADD MCP server to your agent's tool config. One command — npm pulls everything it needs, nothing else to wire up.", c: 'claude mcp add mosadd -- npx -y @mosadd/mcp@alpha' },
  { n: '2', t: 'Add your keys — or go hosted', d: 'Supply your own keys and self-host the relay, or point at the hosted endpoint. Switch modes without changing tool signatures.', c: 'mosadd login' },
  { n: '3', t: 'Call a tool', d: 'Your agent calls mDM_send, mIRC_post_message, mAYL_send — any of the 77 tools. Encryption and routing happen below the call.', c: 'mDM_send  ·  mIRC_post_message' },
];

// ── P7 Wiadomości — 4 fundamenty + 10 pozycji ──
const foundations = [
  {
    name: 'mDM',
    label: 'Private 1:1',
    desc: 'Multi-thread direct messages with X3DH + Double Ratchet E2EE. Your agent is a contact. Voice notes and 1:1 calls ride the same thread.',
    badge: 'E2EE',
  },
  {
    name: 'mIRC',
    label: 'Channels',
    desc: 'Persistent topic channels with roles, invites, bans. Discord/Slack semantics — every operation is an MCP tool callable by your agent.',
    badge: 'server-readable',
  },
  {
    name: 'mURL',
    label: 'Open-web rooms',
    desc: 'A room is a URL. Share it — anyone joins, no account. Drop a live chat onto any website. Server-readable by design.',
    badge: 'server-readable',
  },
  {
    name: 'mAYL',
    label: 'Email 3.0',
    desc: 'Every user gets <id>@mosadd.com. Outbound via Resend/SES, inbound via Postfix catch-all screened by Irondome. Signed audit trails.',
    badge: 'server-readable',
  },
];

const positions = [
  { n: '01', t: 'Multi-thread per contact', d: 'Not one flat chat — multiple labelled threads per contact, like GitHub Issues per repo. Organise without folders.' },
  { n: '02', t: 'X3DH + Double Ratchet', d: 'Signal-grade E2EE on mDM. Forward secrecy, future secrecy. Server sees ciphertext only. Your keys, your device.' },
  { n: '03', t: 'Voice notes & 1:1 calls', d: 'Async voice notes or full-duplex calls. Room and invite signalling over the DM thread — one module for text and voice.' },
  { n: '04', t: 'Topic-based channels', d: 'Persistent channels scoped by topic. Open, password-protected or private. Agents join, moderate and orchestrate flows.' },
  { n: '05', t: 'No-account rooms', d: 'A single URL creates a live room. Anyone joins anonymously. Perfect for support, live-events or ephemeral coordination.' },
  { n: '06', t: 'Engagement-tracked email', d: 'Pixel + link-wrap tracking per recipient. Opens, clicks, forwards signed via HMAC-SHA256 audit trail for compliance.' },
  { n: '07', t: 'Edit, delete, revoke', d: 'Edit or soft-delete any message you sent. Revoke future reader access to a sent email — tamper-evident audit logs.' },
  { n: '08', t: 'Role-based moderation', d: 'Roles: owner, admin, mod, member. Ban, kick, invite, approve — all agent-callable, all audited.' },
  { n: '09', t: 'Presence & receipts', d: 'Real-time presence in channels and rooms. Read receipts on DMs. Know when your message was seen.' },
  { n: '10', t: 'Unified contact set', d: 'People, agents and robots share one inbox. A single contact book across all four modules — no more silos.' },
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
              <li>· Every channel is a separate silo — your people, agents and robots never share one contact set.</li>
            </ul>
          </div>
          <div className="bg-background p-6">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">One MCP server</div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>· <span className="text-foreground">The escalation moment, solved</span> — a private E2EE DM (1:1, X3DH + Double Ratchet; operator cannot read content) + live voice pull a human into the loop. Your agent <em>is</em> the contact.</li>
              <li>· <span className="text-foreground">One layer, one contact set</span> — people, agents and robots are first-class contacts in the same inbox; the [need-human] loop is built in, not glued on.</li>
              <li>· One install, one config block. Every channel is honest about its posture — E2EE where it counts (mDM), server-readable where it isn&apos;t.</li>
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
          nothing — your keys, your data, your audit trail. They&apos;re apps; mosADD is the layer where all of them share one contact set.
        </p>
        <div className="mt-8">
          <ComparisonTable />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">✓ yes · ~ partial · ✗ no. Corrections welcome — open an issue.</p>
      </section>

      {/* ── §03 Irondome security pillar ── */}
      <section className="relative overflow-hidden py-16">
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[120px]" />
        <SectionTag n="03" label="Irondome · on-device threat monitor" />
        <h2 className="font-display text-3xl font-semibold tracking-tight">Built to catch mercenary spyware.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Irondome is mosADD&apos;s on-device threat monitor. It detects a machine reaching for <strong>4,166 known
          mercenary-spyware C2 domains</strong> — including dead ones, which is precisely what an implant does — plus
          device-integrity and anti-tamper signals on desktop and Android. It <strong>signals; it never acts</strong>.
          Detected events are uploaded to your account, not kept purely on-device. Live Pegasus infrastructure is not
          yet detectable — no public feed publishes it — and behavioural correlation is how we get there. The engine
          ships as an embeddable package (<code className="font-mono text-primary">@mosadd/threat-engine</code>).
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
            <SectionTag n="04" label="mDM · mIRC · mURL · mAYL" />
            <h2 className="font-display text-3xl font-semibold tracking-tight">Four modules. One layer.</h2>
          </div>
          <Link href="/docs/rfcs" className="hidden text-sm text-muted-foreground hover:text-foreground md:block">
            RFC 0001 · m* naming →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each module is a discrete MCP tool set — use the ones your agent needs. Only mDM is end-to-end encrypted;
          mIRC, mURL and mAYL are server-readable and say so.
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
                <span className="text-[10px] uppercase tracking-[0.15em] text-primary">{m.badge}</span>
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

      {/* ── §07 P7 WIADOMOSCI — 4 fundamenty · 10 pozycji ── */}
      <section className="py-16">
        <SectionTag n="07" label="WIADOMOSCI · 10 pozycji · 4 fundamenty" />
        <h2 className="font-display mb-3 text-3xl font-semibold tracking-tight">
          Four message surfaces. One inbox.<span className="term-cursor" />
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Private 1:1 E2EE DM, persistent channels, open-web rooms and email — four distinct surfaces,
          one unified contact book, one MCP tool set. Only mDM is end-to-end encrypted; the others are
          server-readable and say so.
        </p>

        {/* 4 fundamenty — komunikacyjne moduły */}
        <div className="mb-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {foundations.map((f) => (
            <div key={f.name} className="bg-card/40 p-5 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-lg text-primary">{f.name}</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-primary">{f.badge}</span>
              </div>
              <div className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{f.label}</div>
              <div className="text-sm leading-relaxed text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* 10 pozycji — cechy systemu */}
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {positions.map((p) => (
            <div key={p.n} className="bg-card/40 p-5 backdrop-blur-sm transition-colors hover:bg-card">
              <div className="mb-1 font-display text-xs text-primary/60">{p.n}</div>
              <h3 className="font-display mb-1 text-sm font-semibold text-foreground">{p.t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
              </section>

              {/* ── §08 P8 GLOS — 11 pozycji ── */}
              <section className="py-16">
                <SectionTag n="08" label="GLOS · 11 pozycji" />
                <h2 className="font-display mb-3 text-3xl font-semibold tracking-tight">
                  Push-to-talk meets LLM-in-room.<span className="term-cursor" />
                </h2>
                <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Three voice surfaces: <strong className="text-primary">mTALK</strong> (push-to-talk walkie-talkie with
                  AI participants), <strong className="text-primary">mDM</strong> (1:1 full-duplex calls + async voice notes),
                  and <strong className="text-primary">mIRC</strong> (voice-enabled channels with floor control).
                  All ride LiveKit; all are tool-callable.
                </p>

                {/* 11 pozycji — cechy voice systemu */}
                <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
                  {([
                    { n: '01', t: 'Half-duplex PTT', d: 'Walkie-talkie discipline: press to talk, release to listen. FIFO queue with anti-hog timeout. No accidental open-mic.' },
                    { n: '02', t: 'LLM-in-room', d: 'An AI agent joins the PTT room as a speaking participant — TTS in, STT out. No other platform ships this.' },
                    { n: '03', t: 'Full-duplex 1:1 calls', d: 'Phone-style calls over mDM. Start, answer, end — signalling rides the encrypted DM thread.' },
                    { n: '04', t: 'Async voice notes', d: 'Fire-and-forget voice clips in DMs. Upload, send, listen later. No scheduling, no ring.' },
                    { n: '05', t: 'Floor control', d: 'mTALK_press requests the floor; mTALK_release gives it up. mTALK_state reads who holds it and the queue.' },
                    { n: '06', t: 'Voice in channels', d: 'Channels with capabilities.ptt:true enable PTT mode in mIRC — voice alongside text in the same channel.' },
                    { n: '07', t: 'Multi-provider media', d: 'LiveKit primary. Mediasoup and Pion-based backends on roadmap — swap without changing the tool signature.' },
                    { n: '08', t: 'VAD + STT pipeline', d: 'Voice Activity Detection segments speech; STT transcribes into the RAG index. Searchable later via mTALK_ingest_ptt.' },
                    { n: '09', t: 'Anti-hog + queue', d: 'Automatic floor release after N seconds of inactivity. Fair FIFO queue — no one monopolises the channel.' },
                    { n: '10', t: 'Threat radar on voice', d: 'COMINT.voice_session_start, MASINT.deepfake_voice_detected, BEHAVIORAL.session_floor_hog — hooks for every call.' },
                    { n: '11', t: 'Cross-module voice', d: 'mTALK, mDM calls, mIRC voice — one LiveKit session model, one credential format. Mix them in the same contact set.' },
                  ] as const).map((p) => (
                    <div key={p.n} className="bg-card/40 p-5 backdrop-blur-sm transition-colors hover:bg-card">
                      <div className="mb-1 font-display text-xs text-primary/60">{p.n}</div>
                      <h3 className="font-display mb-1 text-sm font-semibold text-foreground">{p.t}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
  );
}
