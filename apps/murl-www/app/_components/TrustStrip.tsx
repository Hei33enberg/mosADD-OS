import { MOSADD_DEV } from '../../lib/site';

const points = [
  { k: 'Free', v: 'No price, no trial, no upsell. Really.' },
  { k: 'Anonymous', v: 'No account, no email. You get a random nickname.' },
  { k: 'One click', v: 'Add it once. It just works on every site.' },
  { k: 'You’re in control', v: 'Hide the bubble or remove it anytime, in a tap.' },
];

export function TrustStrip() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => (
          <div key={p.k} className="bg-card/40 p-6 backdrop-blur-sm">
            <div className="font-display text-lg font-semibold text-primary">{p.k}</div>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.v}</p>
          </div>
        ))}
      </div>

      {/* honesty + safety + energizer */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="border border-border bg-card/30 p-6">
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Straight up</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            mURL is an <span className="text-foreground">independent</span> chat — it’s not run by the websites it
            appears on, and they’re not affiliated with it. Every room says so. Chat is human, so we keep it safer with a
            one-tap <span className="text-foreground">report</span> button (messages auto-hide once a few people flag
            them) and it’s <span className="text-foreground">16+</span>. See our{' '}
            <a className="text-primary underline" href="/privacy">privacy policy</a> and{' '}
            <a className="text-primary underline" href="/abuse">how to report abuse</a>.
          </p>
        </div>
        <div className="flex flex-col justify-center border border-primary/30 bg-primary/[0.05] p-6">
          <div className="mb-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">from the makers of</div>
          <a href={MOSADD_DEV} className="font-display text-2xl font-bold tracking-[0.12em]">
            mos<span className="text-primary">ADD</span><span className="align-super text-base text-primary">™</span>
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            mURL runs on the same real-time backbone as the mosADD toolkit — the encrypted comms stack devs and teams
            already trust.
          </p>
        </div>
      </div>
    </section>
  );
}
