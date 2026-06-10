import Link from 'next/link';
import { LiveChatHero } from './_components/LiveChatHero';
import { ExtensionDemo } from './_components/ExtensionDemo';
import { HowItWorks } from './_components/HowItWorks';
import { UseCaseGrid } from './_components/UseCaseGrid';
import { TrendingRooms } from './_components/TrendingRooms';
import { TrustStrip } from './_components/TrustStrip';
import { FAQ } from './_components/FAQ';
import { BrowserButtons } from './_components/BrowserButtons';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ── Hero ── */}
      <section className="hero-glow relative overflow-hidden">
        <div className="grid items-center gap-10 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          {/* copy */}
          <div className="fade-up min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 border border-border bg-card/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="live-dot" /> live · anonymous · free
            </div>
            <h1 className="font-display text-[2.1rem] font-bold leading-[1.06] tracking-tight text-foreground [overflow-wrap:break-word] sm:text-5xl lg:text-6xl">
              Talk to the people{' '}
              <span className="text-primary text-glow">on this website</span>{' '}
              right now.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              mURL drops a live chat onto every website you visit — a shop, an article, a ticket page —
              so you can talk to everyone else who’s there at the same time.{' '}
              <span className="text-foreground">No account. No email. One click.</span>
            </p>

            <div className="mt-8">
              <BrowserButtons />
            </div>
            <div className="mt-5">
              <Link href="#demo" className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
                See how it works ↓
              </Link>
            </div>

            <div className="mt-6 text-xs text-muted-foreground/70">
              Works on every site on the web · powered by{' '}
              <span className="font-bold text-foreground/80">mos<span className="text-primary">ADD</span></span>
            </div>
          </div>

          {/* live demo panel */}
          <div className="fade-up flex justify-center md:justify-end" style={{ animationDelay: '0.12s' }}>
            <LiveChatHero />
          </div>
        </div>
      </section>

      <ExtensionDemo />
      <HowItWorks />
      <UseCaseGrid />
      <TrendingRooms />
      <TrustStrip />
      <FAQ />

      {/* ── Final CTA ── */}
      <section className="py-20 text-center">
        <h2 className="font-display mx-auto max-w-2xl text-2xl font-semibold sm:text-3xl md:text-4xl">
          Every website is better with people in it.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Add mURL once. The next site you open already has a room.
        </p>
        <div className="mt-8 flex justify-center">
          <BrowserButtons variant="compact" />
        </div>
      </section>
    </div>
  );
}
