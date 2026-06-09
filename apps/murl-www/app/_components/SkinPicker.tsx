'use client';

import { useEffect, useRef, useState } from 'react';
import { broadcastSkin, writeSkinToStorage } from '../../lib/skins/runtime/site';
import { SKINS } from '../../lib/skins/registry';
import { useActiveSkin } from './useActiveSkin';

/**
 * Theme picker — a clean anchored dropdown. Skins apply to the mURL CHAT panel
 * (the demos here + the installed extension), NOT the marketing site, so the
 * picker itself never re-themes / disappears. Outside-click + Escape close it.
 */
export function SkinPicker() {
  const active = useActiveSkin();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  function pick(id: string) {
    writeSkinToStorage(id);
    broadcastSkin(id); // sync to the extension if installed
    window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: id }));
    // keep the menu open so you can preview a few; close via × / outside / Esc
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Change chat theme"
        title="Change chat theme"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 w-9 items-center justify-center border text-foreground transition-colors ${
          open ? 'border-primary text-primary' : 'border-border hover:border-primary/60'
        }`}
      >
        <span aria-hidden>✦</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat theme"
          className="absolute right-0 top-11 z-50 w-[min(92vw,420px)] border border-border bg-card p-3 shadow-[0_18px_60px_rgba(0,0,0,0.7)]"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Chat theme</div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="px-1 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {SKINS.map((s) => {
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.id)}
                  className={`flex flex-col gap-1.5 border p-2 text-left transition-colors ${
                    isActive ? 'border-primary bg-primary/[0.08]' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="flex h-7 overflow-hidden border border-border">
                    <span className="flex-1" style={{ background: s.preview.bg }} />
                    <span className="flex-1" style={{ background: s.preview.fg }} />
                    <span className="flex-1" style={{ background: s.preview.primary }} />
                  </span>
                  <span className="flex items-center justify-between gap-1">
                    <span className="font-display text-xs font-semibold text-foreground">{s.label}</span>
                    {isActive && <span className="text-[9px] uppercase tracking-wider text-primary">on</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-2 px-1 text-[10px] leading-tight text-muted-foreground/70">
            Skins the mURL chat panel + the demos here — same vibe on every site you open.
          </p>
        </div>
      )}
    </div>
  );
}
