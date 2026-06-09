'use client';

import { useEffect, useState } from 'react';
import { useActiveSkin } from './useActiveSkin';

interface Msg { time: string; nick: string; text: string; me?: boolean }

// A believable shopping conversation on #nike.com — rendered in the REAL
// extension chat style (.c0-* classes). Global, English, anonymous nicks.
const SCRIPT: Msg[] = [
  { time: '14:01', nick: 'wise-heron-04',   text: 'anyone copped the new drop yet?' },
  { time: '14:01', nick: 'lucky-otter-77',  text: 'anyone got these on sale rn? 👀', me: true },
  { time: '14:02', nick: 'calm-fox-12',     text: 'code SPRING15 worked for me 2 min ago' },
  { time: '14:02', nick: 'lucky-otter-77',  text: 'legend, thank you 🙏', me: true },
  { time: '14:03', nick: 'wise-heron-04',   text: 'do they run small? thinking of sizing up' },
  { time: '14:03', nick: 'brave-lynx-58',   text: 'true to size for me, got the 43' },
  { time: '14:04', nick: 'calm-fox-12',     text: 'free returns anyway so just try both' },
  { time: '14:04', nick: 'quiet-wolf-31',   text: 'is checkout slow for anyone else or just me' },
  { time: '14:05', nick: 'wise-heron-04',   text: 'same, hung for a sec then went through' },
  { time: '14:05', nick: 'mellow-stork-46', text: 'just grabbed the last pair in 42, lets gooo' },
  { time: '14:06', nick: 'brave-lynx-58',   text: 'restock usually hits thursdays btw' },
  { time: '14:06', nick: 'lucky-otter-77',  text: 'ok added to cart, wish me luck 🤞', me: true },
];

const ONLINE = 47;
const WINDOW = 9; // visible rows — fixed; the feed rolls, the panel never resizes

export function LiveChatHero() {
  const skin = useActiveSkin();
  const [end, setEnd] = useState(WINDOW);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setEnd((e) => e + 1), 1900);
    return () => clearInterval(id);
  }, []);

  // Rolling window over an endlessly-cycling script — constant row count, so the
  // panel stays a fixed size; only the inside scrolls (newest in at the bottom).
  const visible = Array.from({ length: WINDOW }, (_, k) => {
    const idx = end - WINDOW + k;
    const m = SCRIPT[((idx % SCRIPT.length) + SCRIPT.length) % SCRIPT.length];
    return { ...m, k: idx };
  });

  return (
    <div className="m-root w-full max-w-md" data-murl-skin={skin}>
      <div
        className="c0-chat shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        style={{ height: 440, border: '1px solid var(--m-border, #1a1a1a)' }}
      >
        <div className="c0-bg" />
        <div className="c0-head">
          <span className="c0-head-title">
            <span className="c0-mirc">mURL</span>
            <span className="c0-domain">#nike.com</span>
            <span className="c0-head-live"><span className="c0-dot" />{ONLINE} online</span>
          </span>
          <span className="c0-head-spacer" />
          <span className="c0-head-btn" aria-hidden>—</span>
        </div>
        <div className="c0-notice">
          Independent chat — <b>nike.com</b> is not affiliated. Powered by <b>mosADD</b>.
        </div>
        <div className="c0-feed">
          {visible.map((m) => (
            <div key={m.k} className={`c0-row${m.k === end - 1 ? ' msg-in' : ''}`}>
              <span className="c0-time">[{m.time}]</span>
              <span className={`c0-nick${m.me ? ' is-me' : ''}`}>&lt;{m.nick}&gt;</span>
              <span className="c0-text">{m.text}</span>
            </div>
          ))}
        </div>
        <div className="c0-compose">
          <input type="text" placeholder="say something as lucky-otter-77" readOnly />
          <span className="c0-send">send</span>
        </div>
        <div className="c0-footer">
          <span className="c0-foot-you">you are <b>lucky-otter-77</b></span>
          <span className="c0-foot-brand">powered by mosADD</span>
        </div>
      </div>
    </div>
  );
}
