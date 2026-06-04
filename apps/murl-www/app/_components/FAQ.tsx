const qa = [
  {
    q: 'Is it really free?',
    a: 'Yes. mURL is free for everyone, forever. No account, no trial, no card. (Website owners can optionally pay to claim or brand their room — that’s the only thing that ever costs money, and it’s their choice, not yours.)',
  },
  {
    q: 'Who can see my messages?',
    a: 'Only people who are using mURL on the same website at the same time. Messages aren’t tied to your name, your email, or your identity — you pick a nickname and that’s it.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. You get a random nickname the moment you open a room. No sign-up, no email, no phone number.',
  },
  {
    q: 'Is this the website’s official chat?',
    a: 'No. mURL is completely independent — it’s not run by the sites it appears on, and they’re not affiliated with it. Every room shows that clearly.',
  },
  {
    q: 'How do I turn it off or leave?',
    a: 'Hide the bubble in one tap, or remove the extension entirely whenever you like. Removing it wipes everything stored on your device.',
  },
  {
    q: 'Is it safe?',
    a: 'Chat is human, so it can get messy — but every message has a one-tap report button and auto-hides once a few people flag it, there’s anti-spam protection built in, and it’s for ages 16+. We never track your browsing or read the pages you visit.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-x border-b border-border px-6 py-16 md:py-20">
      <div className="mb-10">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">FAQ</div>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">The honest answers</h2>
      </div>
      <div className="divide-y divide-border border border-border">
        {qa.map((item) => (
          <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-foreground">
              <span className="font-medium">{item.q}</span>
              <span className="text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
