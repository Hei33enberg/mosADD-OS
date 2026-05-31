import Link from 'next/link';
import { Terminal } from '../_components/Terminal';
import { SocialProof } from '../_components/SocialProof';
import { ComparisonTable } from '../_components/ComparisonTable';

const modules = [
  { name: 'mDM', desc: 'Direct messages · E2EE', status: 'alpha', tools: 6, url: '/docs/modules/mdm' },
  { name: 'mIRC', desc: 'Persistent channels', status: 'alpha', tools: 15, url: '/docs/modules/mirc' },
  { name: 'mROOM', desc: 'Ephemeral rooms + links', status: 'alpha', tools: 8, url: '/docs/modules/mroom' },
  { name: 'mAIL', desc: 'Email', status: 'alpha', tools: 2, url: '/docs/modules/mail' },
  { name: 'mTALK', desc: 'Push-to-talk', status: 'design', tools: 0, url: '/docs/modules/mtalk' },
  { name: 'mCALL', desc: 'PSTN calls', status: 'design', tools: 0, url: '/docs/modules' },
  { name: 'mIRL', desc: 'Live-stream after-party', status: 'design', tools: 0, url: '/docs/modules' },
];

const bridges = ['mMATRIX', 'mDISCORD', 'mTELEGRAM', 'mSLACK', 'mSIGNAL'];

const stats = [
  { value: '32', label: 'MCP tools' },
  { value: '4', label: 'SDK adapters' },
  { value: '6', label: 'example apps' },
  { value: '7', label: 'm* channels' },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-x border-border">
        <span className="hud-bracket hud-tl" />
        <span className="hud-bracket hud-tr" />
        <span className="hud-bracket hud-bl" />
        <span className="hud-bracket hud-br" />
        <div className="scan-sweep" />
        <div className="px-6 py-24 md:py-32">
          <div className="mb-5 text-xs uppercase tracking-[0.35em] text-primary/80">
            mosadd.dev · v3.0.0-alpha.0 · Apache-2.0
          </div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-7xl">
            A human OS.
            <br />
            <span className="text-primary text-glow">Add.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            One MCP server gives any agent direct messages, channels, rooms and mail.{' '}
            <span className="text-foreground">Your keys, or self-host — no vendor lock-in.</span>{' '}
            The open, Apache-2.0 alternative to single-vendor stacks like Twilio Agent Connect.
          </p>

          <div className="mt-8 max-w-xl">
            <Terminal label="claude code">claude mcp add mosadd npx -- -y @mosadd/mcp</Terminal>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/docs/quickstart"
              className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free →
            </Link>
            <a
              href="https://github.com/Hei33enberg/mosadd-os"
              target="_blank"
              rel="noreferrer"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              Read the code ↗
            </a>
            <Link
              href="/pricing"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              Pricing →
            </Link>
          </div>

          <div className="mt-12 grid max-w-xl grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl text-primary">{s.value}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <SocialProof />

      {/* ── Problem → solution ── */}
      <section className="grid gap-8 border-x border-b border-border px-6 py-16 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">The old way</div>
          <h2 className="font-display mb-4 text-2xl font-semibold text-foreground">
            Stitch LiveKit + Twilio + Resend + Matrix by hand
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>· Four SDKs, four billing relationships, four sets of webhooks</li>
            <li>· Weeks of brittle glue code for sessions, identity, turn-taking</li>
            <li>· Locked into each vendor&apos;s network and pricing</li>
            <li>· Encryption, threat-scoring, anti-abuse — all on you</li>
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">The mosadd way</div>
          <h2 className="font-display mb-4 text-2xl font-semibold text-foreground">
            One MCP server. One call. Your keys.
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              · <span className="font-mono text-primary">mROOM_create_guest_link</span> — one tool, every provider
            </li>
            <li>· Bring your own Telnyx / Resend / LiveKit / Supabase — or self-host for $0</li>
            <li>· E2EE (X3DH + Double Ratchet) and threat radar in the kernel</li>
            <li>· 32 tools, works in every MCP client, Apache-2.0 forever</li>
          </ul>
        </div>
      </section>

      {/* ── Comparison (RTB) ── */}
      <section className="border-x border-b border-border px-6 py-16">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-semibold">
            Why <span className="text-primary">mosadd</span> over a single-vendor stack
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Twilio Agent Connect and Composio lock you into one network behind a closed SDK. mosadd is the
            open OS underneath — honest comparison:
          </p>
        </div>
        <ComparisonTable />
        <p className="mt-3 text-xs text-muted-foreground">
          ✓ yes · ~ partial · ✗ no. Corrections welcome — open an issue.
        </p>
      </section>

      {/* ── OS modules ── */}
      <section className="border-x border-b border-border px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold">
            OS modules <span className="text-primary">m*</span>
          </h2>
          <Link href="/docs/rfcs" className="text-sm text-muted-foreground hover:text-foreground">
            RFC 0001 · m* naming →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {modules.map((m) => {
            const live = m.status === 'alpha';
            return (
              <Link
                key={m.name}
                href={m.url}
                className="group rounded-none border border-border p-4 transition-colors hover:border-primary/50 hover:bg-card"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-lg text-primary">{m.name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.15em] ${
                      live ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {live ? `${m.tools} tools` : m.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{m.desc}</div>
              </Link>
            );
          })}
          {/* filler cell to balance the 7-item grid */}
          <div className="hidden rounded-none border border-dashed border-border/60 p-4 text-sm text-muted-foreground md:flex md:items-center">
            + bridges
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">Bridges (design)</div>
          <div className="flex flex-wrap gap-2">
            {bridges.map((b) => (
              <span
                key={b}
                className="rounded-none border border-border bg-card px-2 py-1 font-display text-xs text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="grid gap-8 border-x border-b border-border px-6 py-16 md:grid-cols-3">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">OS, not SDK</div>
          <h3 className="font-display mb-3 text-xl font-semibold">Semantic primitives</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground">mROOM_create_guest_link</span> instead of stitching LiveKit + Twilio +
            Resend + Matrix yourself. One call, vendor-agnostic.
          </p>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Agent-native</div>
          <h3 className="font-display mb-3 text-xl font-semibold">MCP first</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One MCP server, every channel. Works in Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, Manus —
            and on off-grid radio hardware.
          </p>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Security in the kernel</div>
          <h3 className="font-display mb-3 text-xl font-semibold">E2EE + threat radar</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            mDM ships X3DH + Double Ratchet end-to-end encryption. The hub threat-engine scores every operation —
            cross-platform, including bridges.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-x border-b border-border px-6 py-20">
        <h2 className="font-display mb-3 text-3xl font-semibold">
          Build with us<span className="term-cursor" />
        </h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          mosadd-os is the open Apache-2.0 layer — 32 tools live today, more channels landing. RFCs and contributions
          welcome.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            className="rounded-none bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Star on GitHub
          </a>
          <Link
            href="/examples"
            className="rounded-none border border-border px-4 py-2 transition-colors hover:border-primary/50"
          >
            Examples
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
