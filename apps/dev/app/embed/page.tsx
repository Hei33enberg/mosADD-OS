import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'mIRC embed — drop a live chat on your site in 6 lines | mosadd',
  description:
    'The mosadd mIRC embed widget: paste a 6-line snippet and any website gets a live, branded chat. WordPress, Webflow, Ghost, or raw HTML. Free up to 1,000 monthly chatters, your keys, Apache-2.0 kernel.',
  openGraph: {
    title: 'mIRC embed · mosadd',
    description: 'Drop a live chat on any site in 6 lines. Free tier, 5 skins, never lose money.',
    type: 'website',
  },
};

const SNIPPET = `<div id="mosadd-mirc"
     data-channel="my-channel"
     data-mode="launcher"
     data-launcher-position="br">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="m_pk_live_…">
</script>`;

const SKINS = [
  ['default', 'mosadd-mIRC — black frame, neon-green, retro chat inside'],
  ['retro-irc-1990', 'full old-school mIRC look'],
  ['terminal', 'green-on-black hacker'],
  ['minimal-dark', 'modern minimal, dark'],
  ['minimal-light', 'modern minimal, light'],
];

const steps = [
  {
    n: '1',
    title: 'Get a publishable key',
    body: 'Sign in at mosadd.dev/embed/new, add your site domain to the allow-list, copy the m_pk_live_… key once.',
  },
  {
    n: '2',
    title: 'Paste 6 lines',
    body: 'Drop the snippet into your theme, a Webflow embed, a Ghost code card, or raw HTML. The key is browser-safe — it only mints short-lived channel tokens.',
  },
  {
    n: '3',
    title: 'You have a live chat',
    body: 'A launcher pill in the corner expands into a branded mIRC channel. Visitors talk in real time over the same Cloudflare + Supabase backbone the toolkit runs.',
  },
];

export default function EmbedLandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="px-6 py-24 md:py-28">
          <div className="mb-5 text-xs uppercase tracking-[0.35em] text-primary/80">mosadd.dev · embed</div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-6xl">
            A live chat on your site,
            <br />
            in <span className="text-primary text-glow">6 lines</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            The mIRC embed turns any page into a real-time room — mosadd-branded frame, retro mIRC chat
            inside. Free up to 1,000 monthly chatters, hard cap so you{' '}
            <span className="text-foreground">never lose money</span>, your keys, Apache-2.0 kernel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://mosadd.dev/embed/new"
              className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get your key →
            </a>
            <Link
              href="/embed/install"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              Install guide
            </Link>
            <Link
              href="/pricing"
              className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
            >
              Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Snippet ── */}
      <section className="px-6 py-16">
        <div className="mb-6">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">The snippet</div>
          <h2 className="font-display text-3xl font-semibold">This is the entire integration</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Replace <span className="font-mono text-primary">my-channel</span> and the{' '}
            <span className="font-mono text-primary">m_pk_live_…</span> key. That&apos;s it.
          </p>
        </div>
        <pre className="overflow-x-auto border border-border bg-card px-4 py-4 font-mono text-sm text-foreground">{SNIPPET}</pre>
      </section>

      {/* ── 3 steps ── */}
      <section className="grid gap-4 px-6 py-16 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-none border border-border p-5">
            <div className="mb-2 font-display text-sm text-primary">{s.n}.</div>
            <div className="font-display text-lg">{s.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </section>

      {/* ── Where to install ── */}
      <section className="px-6 py-16">
        <div className="mb-6">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Install anywhere</div>
          <h2 className="font-display text-3xl font-semibold">Same snippet, every platform</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/embed/wordpress" className="rounded-none border border-primary/50 px-4 py-2 text-sm text-primary hover:bg-primary/10">
            WordPress plugin →
          </Link>
          <Link href="/embed/install" className="rounded-none border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50">
            Webflow · Ghost · Notion · raw HTML →
          </Link>
        </div>
      </section>

      {/* ── Skins ── */}
      <section className="px-6 py-16">
        <div className="mb-6">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Skins</div>
          <h2 className="font-display text-3xl font-semibold">Five skins ship in the bundle</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Set one with the <span className="font-mono text-primary">data-skin</span> attribute — zero config, all
            bundled in <span className="font-mono">v1.js</span>.
          </p>
        </div>
        <div className="grid gap-px bg-border">
          {SKINS.map(([id, desc]) => (
            <div key={id} className="grid grid-cols-[200px_1fr] gap-6 bg-background px-5 py-3">
              <code className="font-mono text-sm text-primary">data-skin=&quot;{id}&quot;</code>
              <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold">
              Free to start. <span className="text-primary">$9/mo</span> when you grow.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Free = 1,000 monthly chatters. Pro = 10,000 + full CSS. Team = 100,000 + white-label. One plan
              unlocks every mosadd.dev product.
            </p>
          </div>
          <a
            href="https://mosadd.dev/embed/new"
            className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create an embed →
          </a>
        </div>
      </section>
    </div>
  );
}
