'use client';

import { useEffect, useState } from 'react';
import {
  applySkinToDocument,
  broadcastSkin,
  readSkinFromStorage,
  writeSkinToStorage,
} from '@mosadd/skins/runtime/site';
import { SKINS } from '@mosadd/skins/registry';

export function SkinPicker() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('mosadd-dark');

  useEffect(() => {
    setActive(readSkinFromStorage());
    function onChange(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === 'string') setActive(id);
    }
    window.addEventListener('murl-skin-change', onChange as EventListener);
    return () => window.removeEventListener('murl-skin-change', onChange as EventListener);
  }, []);

  function pick(id: string) {
    setActive(id);
    applySkinToDocument(id);
    writeSkinToStorage(id);
    broadcastSkin(id); // sync to the extension (if installed)
    window.dispatchEvent(new CustomEvent('murl-skin-change', { detail: id }));
  }

  return (
    <>
      <button
        type="button"
        aria-label="Change theme"
        title="Change theme"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-primary/60"
      >
        <span aria-hidden>✦</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="m-4 w-full max-w-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Theme</div>
                <h2 className="font-display text-lg font-semibold text-foreground">Pick a vibe</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SKINS.map((s) => {
                const isActive = s.id === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s.id)}
                    className={`group flex flex-col items-stretch gap-2 border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex h-9 overflow-hidden border border-border">
                      <span className="flex-1" style={{ background: s.preview.bg }} />
                      <span className="flex-1" style={{ background: s.preview.fg }} />
                      <span className="flex-1" style={{ background: s.preview.primary }} />
                    </div>
                    <div className="font-display text-sm font-semibold text-foreground">{s.label}</div>
                    <div className="text-[10px] leading-tight text-muted-foreground">{s.tagline}</div>
                    {isActive && (
                      <div className="text-[10px] uppercase tracking-[0.18em] text-primary">active</div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-muted-foreground/70">
              Your theme syncs with the mURL chat panel — same vibe on every site you open.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
