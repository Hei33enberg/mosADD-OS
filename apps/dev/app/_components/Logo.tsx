'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

const products = [
  { href: '/', label: 'DEV', description: 'Developer hub' },
  { href: 'https://murl.mosadd.com', label: 'mURL', description: 'Domain chat', external: true },
  { href: 'https://mosadd.com', label: 'APP', description: 'mosadd.com', external: true },
];

export function Logo({
  size = 'base',
  suffix,
  dropdown = false,
}: {
  size?: 'sm' | 'base' | 'lg';
  suffix?: string;
  dropdown?: boolean;
}) {
  const sizes: Record<string, string> = {
    sm: 'text-xs tracking-[0.2em]',
    base: 'text-base sm:text-lg tracking-[0.25em]',
    lg: 'text-2xl sm:text-3xl tracking-[0.18em]',
  };

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  const wordmark = (
    <span className={`font-bold leading-none text-foreground ${sizes[size]}`}>
      mos<span className="text-primary">ADD</span>
      <span className="align-super ml-0.5 text-[0.55em] font-bold text-primary">™</span>
    </span>
  );

  if (!dropdown || !suffix) {
    return (
      <span className={`font-bold leading-none text-foreground ${sizes[size]}`}>
        mos<span className="text-primary">ADD</span>
        {suffix ? (
          <span className="ml-1.5 align-middle text-[0.6em] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {suffix}
          </span>
        ) : null}
        <span className="align-super ml-0.5 text-[0.55em] font-bold text-primary">™</span>
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-flex items-center">
      {wordmark}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="ml-1.5 inline-flex items-center gap-1 align-middle text-[0.6em] font-medium uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {suffix}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M1 1 L4 4 L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full mt-2 z-50 min-w-[180px] border border-border bg-background/95 backdrop-blur py-1">
          {products.map((p) => {
            const inner = (
              <div className="flex items-center justify-between px-3 py-2 hover:bg-card/60 transition-colors">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-[0.2em] ${p.label === suffix?.toUpperCase() ? 'text-primary' : 'text-foreground'}`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{p.description}</div>
                </div>
                {p.external ? (
                  <span className="text-[10px] text-muted-foreground">↗</span>
                ) : p.label === suffix?.toUpperCase() ? (
                  <span className="text-[10px] text-primary">·</span>
                ) : null}
              </div>
            );
            if (p.external) {
              return (
                <a key={p.label} href={p.href} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
                  {inner}
                </a>
              );
            }
            return (
              <Link key={p.label} href={p.href} onClick={() => setOpen(false)}>
                {inner}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
