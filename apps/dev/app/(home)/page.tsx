import Link from 'next/link';

const modules = [
  { name: 'mDM', desc: 'Direct messages', status: 'alpha', url: '/docs/modules/mdm' },
  { name: 'mTALK', desc: 'Push-to-talk', status: 'design', url: '/docs/modules/mtalk' },
  { name: 'mAIL', desc: 'Email', status: 'design', url: '/docs/modules/mail' },
  { name: 'mCALL', desc: 'PSTN calls', status: 'design', url: '/docs/modules' },
  { name: 'mIRC', desc: 'Channels', status: 'design', url: '/docs/modules/mirc' },
  { name: 'mIRL', desc: 'Live-stream after-party', status: 'design', url: '/docs/modules' },
  { name: 'mROOM', desc: 'Ephemeral rooms', status: 'design', url: '/docs/modules/mroom' },
];

const bridges = ['mMATRIX', 'mDISCORD', 'mTELEGRAM', 'mSLACK', 'mSIGNAL'];

const stats: { value: string; label: string }[] = [
  { value: '29', label: 'MCP tools' },
  { value: '4', label: 'SDK adapters' },
  { value: '6', label: 'example apps' },
  { value: '7', label: 'm* channels' },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="text-xs uppercase tracking-widest text-radar-green/80 mb-4">
          mosadd.dev · pre-alpha · Apache-2.0
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-neutral-50 mb-6">
          A human OS.<br />
          <span className="text-radar-green">Add.</span>
        </h1>
        <p className="text-xl text-neutral-300 max-w-2xl leading-relaxed mb-10">
          Operating system for human communications. Add DM, PTT, calls, mail, channels, rooms — your stack, your way.
          Open source. Vendor-agnostic. Agent-native.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/quickstart"
            className="px-5 py-3 rounded bg-radar-green text-black font-medium hover:bg-radar-green/90 transition"
          >
            Quickstart →
          </Link>
          <Link
            href="/docs/mcp"
            className="px-5 py-3 rounded border border-neutral-700 text-neutral-200 hover:border-neutral-500 transition"
          >
            MCP server
          </Link>
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded border border-neutral-700 text-neutral-200 hover:border-neutral-500 transition"
          >
            GitHub ↗
          </a>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4 max-w-xl">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl text-radar-green">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Install line */}
      <section className="pb-16">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Install in Claude Code</div>
          <pre className="text-radar-green font-mono text-sm overflow-x-auto">
            <code>{`claude mcp add mosadd npx -- -y @m0ssad/mcp`}</code>
          </pre>
        </div>
      </section>

      {/* Modules grid */}
      <section className="py-16 border-t border-neutral-800">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold">OS modules</h2>
          <a
            href="https://github.com/Hei33enberg/mosadd-os/blob/main/docs/rfcs/0001-module-naming.md"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-neutral-400 hover:text-neutral-100"
          >
            RFC 0001 · m* naming →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((m) => (
            <Link
              key={m.name}
              href={m.url}
              className="border border-neutral-800 rounded-lg p-4 hover:border-radar-green/40 hover:bg-neutral-900/50 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg text-radar-green">{m.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-600">{m.status}</span>
              </div>
              <div className="text-sm text-neutral-400">{m.desc}</div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Bridges</div>
          <div className="flex flex-wrap gap-2">
            {bridges.map((b) => (
              <span
                key={b}
                className="font-mono text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-16 border-t border-neutral-800 grid md:grid-cols-3 gap-8">
        <div>
          <div className="text-radar-green text-xs uppercase tracking-widest mb-2">OS, not SDK</div>
          <h3 className="font-display text-xl font-semibold mb-3">Semantic primitives</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            <code className="text-neutral-200">mROOM.create_with_link</code> instead of stitching LiveKit + Twilio + Resend +
            Matrix yourself. Vendor-agnostic, one syscall.
          </p>
        </div>
        <div>
          <div className="text-radar-green text-xs uppercase tracking-widest mb-2">Agent-native</div>
          <h3 className="font-display text-xl font-semibold mb-3">MCP first</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            One MCP server, every channel. Works in Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, Manus.
          </p>
        </div>
        <div>
          <div className="text-radar-green text-xs uppercase tracking-widest mb-2">Security in the kernel</div>
          <h3 className="font-display text-xl font-semibold mb-3">167-event threat radar</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Every operation emits events. Hub middleware blocks abuse, deepfakes, prompt-injection across every channel —
            cross-platform, including bridges.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-neutral-800">
        <h2 className="font-display text-3xl font-semibold mb-3">Build with us.</h2>
        <p className="text-neutral-400 mb-6 max-w-2xl">
          mosadd-os is pre-alpha. We&apos;re shipping the public OS layer first (6–7 mo), then the commercial hub. RFCs welcome.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            className="px-4 py-2 rounded bg-neutral-100 text-black font-medium hover:bg-white transition"
          >
            Star on GitHub
          </a>
          <a
            href="https://mosadd.com"
            className="px-4 py-2 rounded border border-neutral-700 hover:border-neutral-500 transition"
          >
            mosadd.com
          </a>
          <a
            href="https://github.com/Hei33enberg/mosadd-os/issues/new"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded border border-neutral-700 hover:border-neutral-500 transition"
          >
            Open an issue
          </a>
        </div>
      </section>
    </div>
  );
}
