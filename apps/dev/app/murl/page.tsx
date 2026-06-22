import type { Metadata } from 'next';
import Link from 'next/link';
import { Terminal } from '../_components/Terminal';

export const metadata: Metadata = {
  title: 'mURL — anonymous live chat on every domain | mosadd',
  description:
    'A browser extension that drops you into a live, anonymous chat for the domain you are on. Open it on zalando.pl and talk to every other shopper there right now. Powered by the same Cloudflare + Supabase backbone that runs the mosADD toolkit.',
  openGraph: {
    title: 'mURL — anonymous IRC for every URL · mosadd',
    description: 'Anonymous live chat scoped to the domain you are on. Every site on the web becomes a room.',
    type: 'website',
  },
};

const stats = [
  { value: '1', label: 'click to join' },
  { value: '0', label: 'accounts needed' },
  { value: '∞', label: 'domains supported' },
  { value: 'apache-2.0', label: 'license' },
];

const why = [
  {
    kicker: 'Auto-create',
    title: 'Every domain is a room',
    body: 'The first person to open the extension on a domain creates the channel. The next ten million join the same one. Sub-pages collapse — www.zalando.pl/men and m.zalando.pl meet in #zalando.pl.',
  },
  {
    kicker: 'No accounts',
    title: 'Anonymous from second one',
    body: 'A deterministic nick generates from your install (happy-fox-42, lucky-otter-77). No email, no signup, no funnel. A draggable bubble on the page, a side panel on click — that is the whole UX.',
  },
  {
    kicker: 'Same backbone',
    title: 'Cloudflare Workers + Durable Objects',
    body: 'One Durable Object per channel name, hibernatable WebSocket fan-out, ring-buffered history, async flush to Supabase as the durable system-of-record. The same architecture mosadd-edge uses for mIRC.',
  },
];

const stack = [
  ['Real-time', 'Cloudflare Workers + Durable Objects (one DO per domain)'],
  ['Auth', 'HS256 channel-scoped JWTs (5-min, browser-safe, never the hub key)'],
  ['Persistence', 'Supabase messages_meta (thread_id=chat:<slug>)'],
  ['Rate limit', 'Per-device + per-IP bucket in increment_rate_limit_bucket'],
  ['Identity', 'Deterministic adjective-noun-NN nick + chrome.storage.sync'],
  ['Languages', 'chrome.i18n (en, pl shipped; add a JSON file for more)'],
];

export default function Channel0Page() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="scan-sweep" />
        <div className="py-24 md:py-32">
          <div className="mb-5 text-xs uppercase tracking-[0.35em] text-primary/80">
            mosadd.dev · energizer · v0.2.0-alpha
          </div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-7xl">
            mURL{' '}
            <span className="text-primary text-glow">[mIRC]</span>
            <br />
            with mosadd inside.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A browser extension. The moment you open it on any website, you join a live,
            anonymous chat <span className="text-foreground">scoped to that site&apos;s domain</span>.
            Walk onto zalando.pl → instantly in #zalando.pl with every other shopper live.
            Channels auto-create on the first user. Every channel is a free{' '}
            <span className="text-primary">&ldquo;powered by mosadd&rdquo;</span> billboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/Hei33enberg/mosadd-os/tree/main/apps/channel0-ext"
              target="_blank"
              rel="noreferrer"
              className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Install (Chrome) →
            </a>
            <a
              href="https://github.com/Hei33enberg/mosadd-os/tree/main/apps/channel0-ext"
              target="_blank"
              rel="noreferrer"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              Read the code ↗
            </a>
            <Link
              href="#own-a-domain"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              I own a domain →
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

      {/* ── Install in 3 steps ── */}
      <section className="py-16">
        <div className="mb-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Install</div>
          <h2 className="font-display text-3xl font-semibold">Live on any site in three steps</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Chrome Web Store submission lands once the proof-of-work + report flow ships. Until then,
            sideload the unpacked extension — same code, same speed.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-none border border-border p-5">
            <div className="mb-2 font-display text-sm text-primary">1.</div>
            <div className="font-display text-lg">Grab the build</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Clone the repo and run <span className="font-mono text-primary">npm run build</span> in
              <span className="font-mono"> apps/channel0-ext/</span>, or download the zipped <span className="font-mono">dist/</span> from releases.
            </p>
          </div>
          <div className="rounded-none border border-border p-5">
            <div className="mb-2 font-display text-sm text-primary">2.</div>
            <div className="font-display text-lg">Load unpacked</div>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-mono">chrome://extensions</span> → enable Developer mode → Load unpacked →
              point at the <span className="font-mono">dist/</span> folder.
            </p>
          </div>
          <div className="rounded-none border border-border p-5">
            <div className="mb-2 font-display text-sm text-primary">3.</div>
            <div className="font-display text-lg">Open any website</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the green <span className="text-primary">0</span> in the toolbar (or the draggable bubble in the
              corner) and you are in the channel for that domain. Open the same site in another window to see
              yourself join.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why it works ── */}
      <section className="grid gap-8 py-16 md:grid-cols-3">
        {why.map((w) => (
          <div key={w.title}>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">{w.kicker}</div>
            <h3 className="font-display mb-3 text-xl font-semibold">{w.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{w.body}</p>
          </div>
        ))}
      </section>

      {/* ── Stack ── */}
      <section className="py-16">
        <div className="mb-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Stack</div>
          <h2 className="font-display text-3xl font-semibold">
            What runs <span className="text-primary">underneath</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            mURL is not a separate stack. It rides the same backbone that mosadd uses for mIRC —
            proving it at internet scale, for free, on every domain a user opens.
          </p>
        </div>
        <div className="grid gap-px bg-border">
          {stack.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[160px_1fr] gap-6 bg-background px-5 py-3 md:grid-cols-[200px_1fr]">
              <div className="font-display text-sm text-primary">{k}</div>
              <div className="text-sm text-muted-foreground">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For domain owners ── */}
      <section id="own-a-domain" className="py-16 scroll-mt-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Own a domain?</div>
            <h2 className="font-display mb-4 text-3xl font-semibold">Claim, brand, or disable your channel</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              mURL always carries a non-affiliation banner — &ldquo;Independent chat — domain is not affiliated&rdquo;.
              If you verify ownership of a domain (DNS TXT), you get three options:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                · <span className="text-foreground">Open</span> — default. Anyone joins. Free.
              </li>
              <li>
                · <span className="text-foreground">Claim &amp; brand</span> — theme, pinned message, &ldquo;official&rdquo; badge, owner moderation, analytics.
              </li>
              <li>
                · <span className="text-foreground">Disable</span> — the channel returns HTTP 451 to every joiner on your domain. Free for verified owners.
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Verification flow lives at <a className="font-mono text-primary underline" href="/domains">mosadd.dev/domains</a> — live now.
              
            </p>
          </div>
          <div className="rounded-none border border-border p-5">
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">DNS verification</div>
            <Terminal label="bind">{`# add this TXT record to prove you own the domain
_mosadd-murl.zalando.pl.  IN  TXT  "v=0; key=<your-token>"`}</Terminal>
            <p className="mt-3 text-xs text-muted-foreground">
              We re-check every 24h. Remove the record to relinquish ownership.
            </p>
          </div>
        </div>
      </section>

      {/* ── Energizer note ── */}
      <section className="py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">Why we built it</div>
            <h2 className="font-display mb-4 text-3xl font-semibold">
              Every channel is a <span className="text-primary">brand impression</span>
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              mURL is mosadd&apos;s viral wedge. It runs the same Cloudflare Worker, the same
              Durable Object per channel, the same Supabase ingest as the rest of the toolkit. Every
              join is a free demonstration that the kernel scales — and every &ldquo;powered by
              mosadd&rdquo; tag a hundred-million-impression-per-month billboard for the dev platform.
            </p>
          </div>
          <div className="self-end">
            <Link
              href="/docs/quickstart"
              className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Use the same kernel →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Legal posture ── */}
      <section className="py-12">
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="font-display text-sm text-primary">Legal posture</div>
          <div className="text-sm text-muted-foreground">
            Every panel renders a non-affiliation banner. Reports + auto-hide moderation,
            proof-of-work anti-spam, per-domain and global kill switches, and a free verified opt-out
            for domain owners are baked into the design. Full counsel review pre-Web-Store launch.
            See <Link className="text-primary underline" href="/docs/security">/docs/security</Link>.
          </div>
        </div>
      </section>
    </div>
  );
}
