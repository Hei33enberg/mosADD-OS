const cases = [
  {
    room: '#amazon.com',
    tag: 'Shops',
    title: 'Shop with backup',
    body: '“Is this seller legit? Does it run small? Anyone got a working code?” Get real answers from people buying the same thing right now.',
    hue: 'var(--room-1)',
  },
  {
    room: '#bbc.com',
    tag: 'News & articles',
    title: 'React to the story',
    body: 'Comment sections are slow and full of bots. mURL is the live reaction — talk to other readers on the story while it’s breaking.',
    hue: 'var(--room-3)',
  },
  {
    room: '#ticketmaster.com',
    tag: 'Drops & live events',
    title: 'Get through together',
    body: 'Stuck in a queue, hunting a code, racing a presale? Compare notes with everyone else on the exact same page, in real time.',
    hue: 'var(--room-2)',
  },
];

export function UseCaseGrid() {
  return (
    <section id="use-cases" className="scroll-mt-20 px-6 py-16 md:py-20">
      <div className="mb-10">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">Use cases</div>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          Every website is more fun with people in it.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          mURL works on every site on the web — these are just where people love it most.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
        {cases.map((c) => (
          <div key={c.room} className="bg-card/40 p-6 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5" style={{ background: `hsl(${c.hue})`, boxShadow: `0 0 8px hsl(${c.hue})` }} />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.tag}</span>
            </div>
            <div className="font-mono text-sm" style={{ color: `hsl(${c.hue})` }}>{c.room}</div>
            <div className="font-display mt-1 text-lg font-semibold">{c.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
