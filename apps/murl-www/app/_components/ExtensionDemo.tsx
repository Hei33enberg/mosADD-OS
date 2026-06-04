'use client';

import { useEffect, useState } from 'react';
import { DEMO_SCRIPT, DEMO_CHANNEL, DEMO_ONLINE } from '../../lib/demo-script';

const SEED = 4;

export function ExtensionDemo() {
  const [count, setCount] = useState(SEED);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(DEMO_SCRIPT.length);
      return;
    }
    let i = SEED;
    const id = setInterval(() => {
      i = i >= DEMO_SCRIPT.length ? SEED : i + 1;
      setCount(i);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const shown = DEMO_SCRIPT.slice(0, count);

  return (
    <section id="demo" className="scroll-mt-20 border-x border-b border-border px-6 py-16 md:py-20">
      <div className="mb-10 max-w-2xl">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-primary/80">See it in action</div>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          This is the actual extension — nothing to learn.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A little bubble sits in the corner of every site. Tap it and the room for that site slides in —
          here’s a live one on a Polish news portal during a strike. Same chat, every website.
        </p>
      </div>

      {/* Browser frame mock */}
      <div className="overflow-hidden border border-border bg-card/40">
        {/* fake browser chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-background/80 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-none border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="text-primary">🔒</span> {DEMO_CHANNEL}
            </div>
          </div>
        </div>

        {/* page body: faint placeholder + docked side panel + floating bubble */}
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_360px]">
          {/* faux page content (hidden on mobile to give the panel full width) */}
          <div aria-hidden className="relative hidden min-h-[560px] grid-bg p-8 md:block">
            <div className="h-7 w-2/3 bg-muted/40" />
            <div className="mt-3 h-3 w-1/2 bg-muted/25" />
            <div className="mt-8 h-44 w-full bg-muted/15" />
            <div className="mt-6 h-3 w-full bg-muted/20" />
            <div className="mt-2 h-3 w-11/12 bg-muted/20" />
            <div className="mt-2 h-3 w-4/5 bg-muted/20" />
            <div className="mt-8 h-3 w-full bg-muted/15" />
            <div className="mt-2 h-3 w-10/12 bg-muted/15" />
            {/* floating bubble — the launcher */}
            <div className="absolute bottom-6 right-6">
              <div className="c0-bubble has-people" title="open the room for this site">
                <span className="c0-bubble-dot" />317
              </div>
            </div>
          </div>

          {/* the real side panel (c0-chat) */}
          <div className="c0-chat min-h-[480px] border-l border-[#1a1a1a] md:min-h-[560px]">
            <div className="c0-bg" />
            <div className="c0-head">
              <span className="c0-head-title">
                <span className="c0-mirc">mURL</span>
                <span className="c0-domain">#{DEMO_CHANNEL}</span>
                <span className="c0-head-live"><span className="c0-dot" />{DEMO_ONLINE} online</span>
              </span>
              <span className="c0-head-spacer" />
              <span className="c0-head-btn" aria-hidden>⚙</span>
              <span className="c0-head-btn" aria-hidden>—</span>
            </div>
            <div className="c0-notice">
              Independent chat — <b>{DEMO_CHANNEL}</b> is not affiliated. Powered by <b>mosADD</b>.
            </div>
            <div className="c0-feed">
              {shown.map((m, idx) => (
                <div key={idx} className={`c0-row${idx >= SEED ? ' msg-in' : ''}`}>
                  <span className="c0-time">[{m.time}]</span>
                  <span className={`c0-nick${m.host ? ' is-host' : ''}`}>&lt;{m.nick}&gt;</span>
                  <span className="c0-text">{m.text}</span>
                </div>
              ))}
            </div>
            <div className="c0-compose">
              <input type="text" placeholder="say something as ziom_Wwa" readOnly />
              <span className="c0-send">send</span>
            </div>
            <div className="c0-footer">
              <span className="c0-foot-you">you are <b>ziom_Wwa</b></span>
              <span className="c0-foot-brand">powered by mosADD</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        Demo conversation. mURL is independent — not affiliated with the sites it appears on.
      </p>
    </section>
  );
}
