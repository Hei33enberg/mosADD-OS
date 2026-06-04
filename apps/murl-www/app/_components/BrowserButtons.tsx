'use client';

import posthog from 'posthog-js';
import { BROWSERS, type BrowserTarget } from '../../lib/site';
import { BROWSER_LOGOS } from './browser-logos';

function track(id: string, live: boolean) {
  try { posthog.capture?.('install_click', { browser: id, live }); } catch { /* */ }
}

const primary = BROWSERS.find((b) => b.id === 'chrome')!;
const others = BROWSERS.filter((b) => b.id !== 'chrome');

function PrimaryButton() {
  const live = primary.live && !!primary.url;
  const inner = (
    <>
      <span className="h-5 w-5 shrink-0">{BROWSER_LOGOS.chrome}</span>
      <span>Add to Chrome — free</span>
      {!live && (
        <span className="ml-1 rounded-none bg-black/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          soon
        </span>
      )}
      <span aria-hidden>→</span>
    </>
  );
  const cls =
    'inline-flex items-center gap-2.5 rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90';
  return live ? (
    <a href={primary.url} target="_blank" rel="noreferrer" onClick={() => track('chrome', true)} className={cls}>
      {inner}
    </a>
  ) : (
    <button
      type="button"
      title="Launching on the Chrome Web Store shortly"
      onClick={() => track('chrome', false)}
      className={cls}
    >
      {inner}
    </button>
  );
}

function Chip({ b }: { b: BrowserTarget }) {
  const live = b.live && !!b.url;
  const inner = (
    <>
      <span className="h-4 w-4 shrink-0">{BROWSER_LOGOS[b.id]}</span>
      <span>{b.label}</span>
      {!live && <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">soon</span>}
    </>
  );
  const cls =
    'inline-flex items-center gap-1.5 rounded-none border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/50';
  return live ? (
    <a href={b.url} target="_blank" rel="noreferrer" onClick={() => track(b.id, true)} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" title={`${b.label} — launching soon`} onClick={() => track(b.id, false)} className={`${cls} opacity-80`}>
      {inner}
    </button>
  );
}

/**
 * variant 'hero'    → primary Chrome button + a row of browser chips.
 * variant 'compact' → just the primary Chrome button (header / mobile / inline CTAs).
 */
export function BrowserButtons({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  if (variant === 'compact') {
    return <PrimaryButton />;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">also on</span>
        {others.map((b) => (
          <Chip key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
}
