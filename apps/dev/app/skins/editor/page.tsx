import type { Metadata } from 'next';
import Link from 'next/link';
import { Anchor, InlineCode } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Skin Editor — mosadd mIRC embeds',
  description:
    'Live editor for mosadd mIRC embed skins. Tweak colors, fonts, scanlines — export .mosaddskin. Coming in Phase 1.5.',
};

export default function SkinEditor() {
  return (
    <main className="min-h-[100svh] bg-background text-foreground">
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">SKIN EDITOR · v0.0 pre-alpha</div>
          <h1 className="font-mono text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Live editor coming next.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            We&apos;re wiring the live preview + properties panel + export-to-<InlineCode>.mosaddskin</InlineCode>{' '}
            flow now. In the meantime — the format is final and editable by hand.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Want to ship a skin today? Override the default CSS variables in a
            <InlineCode>style.css</InlineCode>, drop it in{' '}
            <Anchor href="https://github.com/Hei33enberg/mosADD-OS/tree/main/skins">mosadd-os/skins/&lt;your-skin&gt;/</Anchor>{' '}
            with a <InlineCode>manifest.json</InlineCode>, open a PR. See the{' '}
            <Anchor href="https://github.com/Hei33enberg/mosADD-OS/blob/main/skins/README.md">README</Anchor>{' '}
            and the <Anchor href="https://github.com/Hei33enberg/mosADD-OS/blob/main/apps/embed/src/skins/default.css">default skin source</Anchor>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/skins"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border font-mono font-bold uppercase tracking-wider rounded-none hover:border-primary hover:text-primary text-sm"
            >
              ← BACK TO SKIN SHOP
            </Link>
            <Link
              href="/embed"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider text-sm"
            >
              ABOUT THE EMBED ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
