import type { Metadata } from 'next';
import Link from 'next/link';
import { Anchor, InlineCode } from '../_components/Prose';

export const metadata: Metadata = {
  title: 'Skin Shop — mosadd mIRC embeds',
  description:
    'Browse free skins for the mosadd mIRC embed widget. Community-contributed, Apache-2.0, no marketplace. Default = mosadd brand frame + retro mIRC chat.',
};

// Phase 1 — only the default + 4 stubs reserved. Real skins land via PR to
// `mosadd-os/skins/`. Once we have ≥5 community skins live, this becomes a
// dynamic grid pulling from GitHub. For now we keep it honest.
const skins = [
  {
    id: 'default',
    name: 'mosadd-mIRC',
    by: 'mosadd team',
    blurb: 'The OOTB look — pure black frame + neon green primary + JetBrains Mono, mIRC retro chat inside.',
    status: 'shipped',
    preview: 'bg-black border-primary/40',
  },
  {
    id: 'retro-irc-1990',
    name: 'Retro IRC 1990',
    by: '@strajkpolski',
    blurb: 'Pure 1990s mIRC vibe — pixel font, beige bg, red accent. Lifted from strajkpolski.pl.',
    status: 'soon',
    preview: 'bg-amber-50 border-red-700/40 text-red-900',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    by: 'mosadd team',
    blurb: 'Green-on-black hacker terminal. ASCII brackets, blink cursor, monospace everywhere.',
    status: 'soon',
    preview: 'bg-black border-green-400/40 text-green-400',
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    by: 'mosadd team',
    blurb: 'Modern dark, no scanlines, no brackets, soft borders. Reads like Linear/Notion.',
    status: 'soon',
    preview: 'bg-neutral-900 border-neutral-700 text-neutral-100',
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    by: 'mosadd team',
    blurb: 'Day-mode counterpart of Minimal Dark — soft white, slate accents.',
    status: 'soon',
    preview: 'bg-slate-100 border-slate-300 text-slate-800',
  },
];

export default function SkinShop() {
  return (
    <main className="min-h-[100svh] bg-background text-foreground">
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">SKIN SHOP · v0.1 alpha</div>
          <h1 className="font-mono text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Style every embed.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-8 leading-relaxed">
            Browse free skins for the mosadd mIRC embed widget. Community-contributed,
            Apache-2.0. Click apply → drop the snippet — done.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/skins/editor"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider rounded-none"
            >
              LIVE EDITOR →
            </Link>
            <Link
              href="https://github.com/Hei33enberg/mosADD-OS/tree/main/skins"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border font-mono font-bold uppercase tracking-wider rounded-none hover:border-primary hover:text-primary"
            >
              CONTRIBUTE A SKIN ↗
            </Link>
            <Link href="/embed" className="inline-flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider">
              ABOUT THE EMBED ↗
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skins.map((s) => (
              <article
                key={s.id}
                className="border border-border bg-card/30 rounded-none overflow-hidden flex flex-col"
              >
                <div className={`aspect-[4/3] flex items-center justify-center border-b ${s.preview}`}>
                  <div className="text-center px-4 font-mono text-xs">
                    <div className="opacity-50 mb-2">[ preview ]</div>
                    <div className="font-bold">{s.name}</div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">by {s.by}</div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${
                        s.status === 'shipped'
                          ? 'border-primary text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {s.status === 'shipped' ? 'LIVE' : 'SOON'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.blurb}</p>
                  <div className="flex gap-2 pt-2">
                    {s.status === 'shipped' ? (
                      <code className="font-mono text-xs px-2 py-1 bg-background border border-border text-primary">
                        data-skin=&quot;{s.id}&quot;
                      </code>
                    ) : (
                      <span className="font-mono text-xs px-2 py-1 text-muted-foreground border border-border bg-background">
                        coming soon
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 p-6 border border-border bg-card/30">
            <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">CONTRIBUTE</div>
            <h2 className="font-mono text-2xl font-bold mb-3">Bring your best skin.</h2>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              All skins are <strong>Apache-2.0</strong>, community-contributed via PR to{' '}
              <Anchor href="https://github.com/Hei33enberg/mosADD-OS/tree/main/skins">mosadd-os/skins/</Anchor>.
              No marketplace, no rev-share, no friction. Format = manifest.json + style.css + optional preview.png/assets.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Use <InlineCode>data-skin=&quot;your-skin-id&quot;</InlineCode> in any embed once your PR lands and the bundle ships.
              See the <Anchor href="https://github.com/Hei33enberg/mosADD-OS/blob/main/skins/README.md">README</Anchor> for the exact format.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
