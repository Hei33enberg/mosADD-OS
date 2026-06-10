import Link from 'next/link';
import { RadarField } from './RadarField';

const stats = [
  { v: '61', l: 'live MCP tools' },
  { v: '6', l: 'live m* channels' },
  { v: '4', l: 'SDK adapters' },
  { v: 'Apache-2.0', l: 'license' },
];

export function RadarHero() {
  return (
    <section className="relative overflow-hidden">
      {/* faint engineering grid */}
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

      {/* descending scan line */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="radar-scanline absolute left-0 top-0 h-px w-full bg-primary/15" />
      </div>

      {/* radar — right half, subtle, centered; on mobile it sits faint behind */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[90%] overflow-hidden sm:w-[70%] md:w-[60%]">
        <div
          className="absolute opacity-70 md:opacity-100"
          style={{ width: '92vmax', height: '92vmax', top: '50%', left: '72%', transform: 'translate(-50%,-50%)' }}
        >
          <RadarField />
        </div>
        <div className="absolute right-0 top-1/2 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[150px]" />
      </div>

      {/* left→right fade keeps the copy crisp over the radar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/92 to-transparent sm:via-background/75" />

      <div className="relative z-10 py-24 sm:py-28 md:py-36 lg:py-44">
        <div className="mb-6 text-[11px] uppercase tracking-[0.35em] text-primary/80">
          mosadd.dev · MCP · Apache-2.0
        </div>

        <h1
          className="max-w-4xl text-balance font-display font-bold uppercase text-foreground"
          style={{ fontSize: 'clamp(2.1rem, 5.4vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '0.045em' }}
        >
          <span className="whitespace-nowrap">Iron Dome</span>{' '}
          <span className="whitespace-nowrap">Multi-Channel</span>{' '}
          Messenger{' '}
          <span className="whitespace-nowrap text-primary text-glow">· MCP</span>
        </h1>

        <p className="mt-7 max-w-xl text-balance text-lg text-foreground/90 sm:text-xl">
          Threat-aware, zero-knowledge comms for AI agents.
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          One MCP server — direct messages, channels, rooms, encrypted mail and voice, plus the{' '}
          <span className="text-foreground">Iron Dome threat engine as an embeddable kernel primitive</span>. Your keys or self-host.
          Apache-2.0.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/hub"
            className="rounded-none bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            [ Get your free key ]
          </Link>
          <Link
            href="/docs/quickstart"
            className="rounded-none border border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            [ Docs ]
          </Link>
          <Link
            href="/pricing"
            className="rounded-none border border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            [ Pricing ]
          </Link>
        </div>

        <div className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l}>
              <div className="font-display text-2xl text-primary">{s.v}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
