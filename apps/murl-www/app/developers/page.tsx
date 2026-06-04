import type { Metadata } from 'next';
import Link from 'next/link';
import { GITHUB_URL, MOSADD_DEV } from '../../lib/site';

const REPO = `${GITHUB_URL}/tree/main/apps/channel0-ext`;

export const metadata: Metadata = {
  title: 'For developers',
  description:
    'mURL is a consumer app, not a developer platform. If you want to add chat to your own product or build chat for AI agents, use mIRC / the mosADD toolkit at mosadd.dev. mURL itself is open source.',
  openGraph: {
    title: 'mURL for developers → meet mIRC',
    description: 'mURL is for everyone. Building chat into your product? That’s mIRC on mosadd.dev. mURL is open source.',
    type: 'website',
  },
};

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-6">
      {/* Hero */}
      <section className="relative overflow-hidden border-x border-border px-6 py-16 md:py-20">
        <span className="hud-bracket hud-tl" />
        <span className="hud-bracket hud-tr" />
        <span className="hud-bracket hud-bl" />
        <span className="hud-bracket hud-br" />
        <div className="mb-4 text-xs uppercase tracking-[0.3em] text-primary/80">mURL · for developers</div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
          mURL is for <span className="text-primary text-glow">people</span>, not a platform.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          mURL is a consumer app — a free browser extension that drops anonymous chat onto any website. There’s nothing
          to integrate and no API to build on, on purpose. If you’re a developer or a team, the thing you actually want
          lives next door.
        </p>
      </section>

      {/* → mIRC funnel */}
      <section className="border-x border-b border-border px-6 py-14">
        <div className="border border-primary/30 bg-primary/[0.05] p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Building chat yourself?</div>
          <h2 className="font-display text-3xl font-semibold">
            Meet <span className="text-primary">mIRC</span> — chat for your product &amp; for AI agents
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            mIRC is the developer side of <span className="font-bold text-foreground/80">mos<span className="text-primary">ADD</span></span>:
            an embeddable, brandable, authenticated chat you put on your own site — plus encrypted DMs, channels, rooms,
            voice and a knowledge base, all through one MCP server for AI agents. Your keys or self-host. Apache-2.0.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <li>· Embed a branded chat on your site (a few lines of script)</li>
            <li>· One MCP server: DMs, channels, rooms, mail, voice, KB</li>
            <li>· End-to-end encryption in the kernel · BYOK or self-host</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={MOSADD_DEV} className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Go to mosadd.dev →
            </a>
            <a href={`${MOSADD_DEV}/embed`} className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50">
              Embed chat on your site ↗
            </a>
          </div>
        </div>
      </section>

      {/* mURL is open source (transparency, not a product pitch) */}
      <section className="grid gap-px border-x border-b border-border bg-border md:grid-cols-2">
        <div className="bg-background p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">Open source</div>
          <h3 className="font-display text-xl font-semibold">Curious how mURL works?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            mURL is fully open source (Apache-2.0) — the extension and its small backend live in the public mosADD-OS
            repo. Read the architecture, audit the privacy model, or self-host it. We just don’t productise it as a
            platform — for that, use mIRC above.
          </p>
          <a href={REPO} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary underline">
            mURL on GitHub ↗
          </a>
        </div>
        <div className="bg-background p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">Contribute</div>
          <h3 className="font-display text-xl font-semibold">Issues &amp; PRs welcome</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Fixes, new locales, new browsers. Privacy-first invariants apply (no fingerprinting, no reading the host
            page). Security issues: <span className="font-mono">security@mosadd.dev</span>.
          </p>
          <a href={`${GITHUB_URL}/blob/main/apps/channel0-ext/CONTRIBUTING.md`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-primary underline">
            Contributing guide ↗
          </a>
        </div>
      </section>

      <section className="border-x border-b border-border px-6 py-10 text-sm text-muted-foreground">
        Just here to chat? <Link className="text-primary underline" href="/">Get mURL</Link> — it’s free.
      </section>
    </div>
  );
}
