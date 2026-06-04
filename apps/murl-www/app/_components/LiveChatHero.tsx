'use client';

import { useEffect, useState } from 'react';

interface Msg { time: string; nick: string; text: string; me?: boolean }

// A believable shopping conversation on #nike.com — rendered in the REAL
// extension chat style (.c0-* classes ported from the shipped side panel).
const SCRIPT: Msg[] = [
  { time: '14:02', nick: 'lucky-otter-77', text: 'anyone got these on sale rn? 👀' },
  { time: '14:02', nick: 'calm-fox-12',    text: 'code SPRING15 worked for me 2 min ago' },
  { time: '14:03', nick: 'lucky-otter-77', text: 'legend, thank you 🙏' },
  { time: '14:03', nick: 'wise-heron-04',  text: 'do they run small? thinking of sizing up' },
  { time: '14:04', nick: 'brave-lynx-58',  text: 'true to size for me, got the 43' },
  { time: '14:04', nick: 'calm-fox-12',    text: 'free returns anyway so just try both' },
  { time: '14:05', nick: 'quiet-wolf-31',  text: 'is checkout slow for anyone else or just me' },
  { time: '14:05', nick: 'wise-heron-04',  text: 'same, hung for a sec then went through' },
];

const ONLINE = 42;
const SEED = 3;

export function LiveChatHero() {
  const [count, setCount] = useState(SEED);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(SCRIPT.length);
      return;
    }
    let i = SEED;
    const id = setInterval(() => {
      i = i >= SCRIPT.length ? SEED : i + 1;
      setCount(i);
    }, 1700);
    return () => clearInterval(id);
  }, []);

  const shown = SCRIPT.slice(0, count);

  return (
    <div className="c0-chat w-full max-w-md border border-[#1a1a1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" style={{ height: 420 }}>
      <div className="c0-bg" />
      {/* header */}
      <div className="c0-head">
        <span className="c0-head-title">
          <span className="c0-mirc">mURL</span>
          <span className="c0-domain">#nike.com</span>
          <span className="c0-head-live"><span className="c0-dot" />{ONLINE} online</span>
        </span>
        <span className="c0-head-spacer" />
        <span className="c0-head-btn" aria-hidden>—</span>
      </div>
      {/* non-affiliation notice */}
      <div className="c0-notice">
        Independent chat — <b>nike.com</b> is not affiliated. Powered by <b>mosADD</b>.
      </div>
      {/* feed */}
      <div className="c0-feed">
        {shown.map((m, idx) => (
          <div key={idx} className={`c0-row${idx >= SEED ? ' msg-in' : ''}`}>
            <span className="c0-time">[{m.time}]</span>
            <span className={`c0-nick${m.me ? ' is-me' : ''}`}>&lt;{m.nick}&gt;</span>
            <span className="c0-text">{m.text}</span>
          </div>
        ))}
      </div>
      {/* compose */}
      <div className="c0-compose">
        <input type="text" placeholder="say something as lucky-otter-77" readOnly />
        <span className="c0-send">send</span>
      </div>
      {/* footer */}
      <div className="c0-footer">
        <span className="c0-foot-you">you are <b>lucky-otter-77</b></span>
        <span className="c0-foot-brand">powered by mosADD</span>
      </div>
    </div>
  );
}
