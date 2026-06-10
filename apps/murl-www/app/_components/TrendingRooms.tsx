'use client';

import { useEffect, useState } from 'react';
import { DEMO_MODE, TRENDING_URL } from '../../lib/site';
import { TOP_ROOMS, jitter, type MockRoom } from '../../lib/trending-mock';
import { nickColor } from '../../lib/rooms';

interface LiveItem { slug: string; domain: string; messages: number; last_ts: string; status: string }

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Demo (mock) board ──────────────────────────────────────────────────────
function DemoBoard() {
  const [rooms, setRooms] = useState<MockRoom[]>(TOP_ROOMS.slice(0, 12));

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      setRooms((prev) => prev.map((r) => ({ ...r, online: jitter(r.online) })));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const total = rooms.reduce((s, r) => s + r.online, 0);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80">
            <span className="live-dot" /> Live right now
          </div>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Rooms with people in them</h2>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-primary md:text-3xl">{fmt(total)}</div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">online in the top rooms</div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r, i) => (
          <div key={r.domain} className="flex items-center justify-between gap-4 bg-card/40 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground/60">{i + 1}</span>
              <span className="h-2.5 w-2.5 shrink-0" style={{ background: nickColor(r.domain), boxShadow: `0 0 8px ${nickColor(r.domain)}` }} />
              <span className="truncate font-mono text-sm text-foreground">#{r.domain}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs">
              <span className="live-dot" />
              <span className="tabular-nums text-primary">{fmt(r.online)}</span>
              <span className="text-muted-foreground">online</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground/70">Live demo data — the world’s busiest sites, right now.</p>
    </>
  );
}

// ── Live board (real channel0-trending) ────────────────────────────────────
function isReal(it: LiveItem): boolean {
  if (!it.domain || it.status === 'blocked' || it.messages < 1) return false;
  if (it.slug.includes('smoke') || it.slug.includes('test')) return false;
  if (it.domain.endsWith('.test') || it.domain.endsWith('.local')) return false;
  if (/^[0-9a-f]{8}[.-]/.test(it.domain)) return false;
  return it.domain.includes('.');
}
function ago(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
function LiveBoard() {
  const [state, setState] = useState<{ k: 'loading' } | { k: 'ok'; items: LiveItem[] } | { k: 'err' }>({ k: 'loading' });
  useEffect(() => {
    let alive = true;
    fetch(`${TRENDING_URL}?minutes=120`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { items?: LiveItem[] }) => alive && setState({ k: 'ok', items: (d.items ?? []).filter(isReal).slice(0, 9) }))
      .catch(() => alive && setState({ k: 'err' }));
    return () => { alive = false; };
  }, []);
  return (
    <>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80">
          <span className="live-dot" /> Live right now
        </div>
        <h2 className="font-display text-3xl font-semibold md:text-4xl">Rooms with people in them</h2>
      </div>
      {state.k === 'loading' && <div className="border border-border bg-card/30 px-5 py-8 text-sm text-muted-foreground">checking who’s around…</div>}
      {(state.k === 'err' || (state.k === 'ok' && state.items.length === 0)) && (
        <div className="border border-border bg-card/30 px-5 py-8 text-sm text-muted-foreground">
          It’s quiet this minute — <span className="text-foreground">be the first</span> on whatever site you open next.
        </div>
      )}
      {state.k === 'ok' && state.items.length > 0 && (
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {state.items.map((it) => (
            <div key={it.slug} className="flex items-center justify-between gap-4 bg-card/40 px-5 py-3.5 backdrop-blur-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0" style={{ background: nickColor(it.domain), boxShadow: `0 0 8px ${nickColor(it.domain)}` }} />
                <span className="truncate font-mono text-sm text-foreground">#{it.domain}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-primary">{it.messages}</span> msgs</span>
                <span className="text-muted-foreground/60">{ago(it.last_ts)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function TrendingRooms() {
  return (
    <section id="trending" className="scroll-mt-20 px-6 py-16 md:py-20">
      {DEMO_MODE ? <DemoBoard /> : <LiveBoard />}
    </section>
  );
}
