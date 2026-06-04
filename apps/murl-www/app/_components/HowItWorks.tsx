import { InstallCTA } from './InstallCTA';

const steps = [
  {
    n: '1',
    title: 'Add it to your browser',
    body: 'One click from the Chrome store. No sign-up, no email, no setup. A little chat bubble shows up in the corner.',
  },
  {
    n: '2',
    title: 'Open any website',
    body: 'A shop, a news article, a ticket site, your bank — anywhere. Tap the bubble and you are in that site’s room.',
  },
  {
    n: '3',
    title: 'Talk to whoever’s there now',
    body: 'Everyone using mURL on the same site shares one live room. Ask, warn, joke, compare notes — in real time.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-x border-b border-border px-6 py-16 md:py-20">
      <div className="mb-10">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">How it works</div>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">Three taps and you’re in the room.</h2>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="bg-card/40 p-6 backdrop-blur-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
              {s.n}
            </div>
            <div className="font-display text-lg font-semibold">{s.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      {/* domain = room diagram */}
      <div className="mt-10 border border-border bg-card/30 p-6">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          One room per website — every page lands in the same place
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="border border-border/60 px-3 py-1.5"><span className="font-mono">www.nike.com/men</span></span>
            <span className="border border-border/60 px-3 py-1.5"><span className="font-mono">m.nike.com</span></span>
            <span className="border border-border/60 px-3 py-1.5"><span className="font-mono">nike.com/air?x=1</span></span>
          </div>
          <div className="text-2xl text-primary md:rotate-0">→</div>
          <div className="border border-primary/50 bg-primary/[0.07] px-5 py-3 text-center">
            <div className="text-lg font-bold text-primary">#nike.com</div>
            <div className="text-xs text-muted-foreground">one shared room</div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <InstallCTA />
      </div>
    </section>
  );
}
