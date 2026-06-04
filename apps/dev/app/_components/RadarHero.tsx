import Link from 'next/link';
import { RadarField } from './RadarField';

const stats = [
  { v: '40', l: 'MCP tools' },
  { v: '7', l: 'm* channels' },
  { v: '4', l: 'SDK adapters' },
  { v: 'Apache-2.0', l: 'license' },
];

export function RadarHero() {
  return (
    <section className="relative overflow-hidden border-x border-border">
      {/* grid backdrop */}
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* descending scan line */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="radar-scanline absolute left-0 top-0 h-px w-full bg-primary/20" />
      </div>

      {/* full-bleed threat radar, anchored right */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{ width: '118vmax', height: '118vmax', top: '50%', left: '80%', transform: 'translate(-50%,-50%)' }}
        >
          <RadarField />
        </div>
        <div className="absolute right-0 top-1/2 h-[620px] w-[760px] -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
      </div>

      {/* left-to-right fade keeps copy legible over the radar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />

      <span className="hud-bracket hud-tl" />
      <span className="hud-bracket hud-tr" />
      <span className="hud-bracket hud-bl" />
      <span className="hud-bracket hud-br" />

      <div className="relative z-10 px-6 py-24 md:py-32">
        <div className="mb-5 text-xs uppercase tracking-[0.35em] text-primary/80">mosadd.dev · MCP · Apache-2.0</div>
        <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-[0.03em] text-foreground md:text-6xl">
          IRONDOME
          <br />
          MULTI-CHANNEL MESSENGER <span className="text-primary text-glow">· MCP</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Threat-aware, zero-knowledge comms for AI agents. One MCP server covers direct messages, channels,
          rooms, encrypted mail and voice — with the{' '}
          <span className="text-foreground">Iron Dome threat radar in the kernel</span>. Your keys or self-host.
          Apache-2.0.
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-primary/70">
          40 tools · 7 channels · zero vendor lock-in · TRUST NO TRACE
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs/quickstart"
            className="rounded-none bg-primary px-5 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start free →
          </Link>
          <a
            href="https://github.com/Hei33enberg/mosadd-os"
            target="_blank"
            rel="noreferrer"
            className="rounded-none border border-border px-5 py-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-primary/50"
          >
            Read the code ↗
          </a>
          <Link
            href="/pricing"
            className="rounded-none border border-border px-5 py-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-primary/50"
          >
            Pricing →
          </Link>
        </div>

        <div className="mt-12 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="font-display text-xl text-primary md:text-2xl">{s.v}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
