'use client';

import { useEffect, useState } from 'react';
import { nickColor, initials } from '../../lib/rooms';

interface Msg { nick: string; text: string }

// A believable little shopping conversation on #nike.com.
const SCRIPT: Msg[] = [
  { nick: 'lucky-otter-77', text: 'anyone got these on sale rn? 👀' },
  { nick: 'calm-fox-12', text: 'code SPRING15 worked for me 2 min ago' },
  { nick: 'lucky-otter-77', text: 'legend, thank you 🙏' },
  { nick: 'wise-heron-04', text: 'do they run small? thinking of sizing up' },
  { nick: 'brave-lynx-58', text: 'true to size for me, got the 43' },
  { nick: 'calm-fox-12', text: 'free returns anyway so just try both' },
  { nick: 'quiet-wolf-31', text: 'is the checkout slow for anyone else or just me' },
  { nick: 'wise-heron-04', text: 'same, hung for a sec then went through' },
];

const ONLINE = 42;
const SEED = 3; // messages shown immediately (server + first paint)

export function LiveChatHero() {
  const [count, setCount] = useState(SEED);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) { setReduced(true); setCount(SCRIPT.length); return; }
    let i = SEED;
    const id = setInterval(() => {
      i += 1;
      if (i > SCRIPT.length) {
        // brief pause on full, then restart the loop
        setTimeout(() => { i = SEED; setCount(SEED); }, 2600);
        i = SCRIPT.length; // hold until the reset fires
        return;
      }
      setCount(i);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const shown = SCRIPT.slice(0, count);

  return (
    <div className="relative w-full max-w-sm overflow-hidden border border-border bg-card/70 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2">
        <span className="font-bold tracking-wide text-foreground">
          m<span className="text-primary">URL</span>
        </span>
        <span className="text-primary">#nike.com</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span className="live-dot" />
          {ONLINE} online
        </span>
      </div>

      {/* non-affiliation strip */}
      <div className="border-b border-border/60 bg-background/40 px-3 py-1.5 text-[10px] leading-tight text-muted-foreground">
        Independent chat — <span className="text-foreground/70">nike.com</span> is not affiliated. Powered by{' '}
        <span className="font-bold text-primary">mosADD</span>.
      </div>

      {/* feed */}
      <div className="flex min-h-[268px] flex-col justify-end gap-2.5 p-3 text-[13px] leading-snug">
        {shown.map((m, idx) => (
          <div key={`${idx}-${m.nick}`} className={idx >= SEED && !reduced ? 'msg-in flex gap-2' : 'flex gap-2'}>
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-[9px] font-bold text-background"
              style={{ background: nickColor(m.nick) }}
            >
              {initials(m.nick)}
            </span>
            <div className="min-w-0">
              <span className="font-bold" style={{ color: nickColor(m.nick) }}>{m.nick}</span>{' '}
              <span className="text-foreground/90">{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div className="flex items-center gap-2 border-t border-border bg-background/80 px-3 py-2 text-[13px]">
        <span className="text-muted-foreground">you</span>
        <span className="text-muted-foreground/50 caret">say something…</span>
        <span className="ml-auto bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground">
          send
        </span>
      </div>
    </div>
  );
}
