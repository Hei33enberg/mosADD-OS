'use client';

import { useEffect, useState } from 'react';
import { TRENDING_URL } from '../../lib/site';
import { nickColor } from '../../lib/rooms';

interface Item { slug: string; domain: string; messages: number; last_ts: string; status: string }
type State = { kind: 'loading' } | { kind: 'ok'; items: Item[] } | { kind: 'error' };

// Hide internal/test rooms so the public board only shows real consumer domains.
function isRealRoom(it: Item): boolean {
  if (!it.domain || it.status === 'blocked') return false;
  if (it.messages < 1) return false;
  if (it.slug.includes('smoke') || it.slug.includes('test')) return false;
  if (it.domain.endsWith('.test') || it.domain.endsWith('.local')) return false;
  if (/^[0-9a-f]{8}[.-]/.test(it.domain)) return false; // UUID-style hub channels
  if (!it.domain.includes('.')) return false;
  return true;
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function TrendingRooms() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch(`${TRENDING_URL}?minutes=120`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items?: Item[] }) => {
        if (!alive) return;
        const items = (data.items ?? []).filter(isRealRoom).slice(0, 8);
        setState({ kind: 'ok', items });
      })
      .catch(() => { if (alive) setState({ kind: 'error' }); });
    return () => { alive = false; };
  }, []);

  return (
    <section id="trending" className="scroll-mt-20 border-x border-b border-border px-6 py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80">
            <span className="live-dot" /> Live right now
          </div>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Rooms with people in them</h2>
        </div>
      </div>

      {state.kind === 'loading' && (
        <div className="border border-border bg-card/30 px-5 py-8 text-sm text-muted-foreground">checking who’s around…</div>
      )}

      {(state.kind === 'error' || (state.kind === 'ok' && state.items.length === 0)) && (
        <div className="border border-border bg-card/30 px-5 py-8 text-sm text-muted-foreground">
          It’s quiet this minute — <span className="text-foreground">be the first</span> on whatever site you open next.
        </div>
      )}

      {state.kind === 'ok' && state.items.length > 0 && (
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {state.items.map((it) => (
            <div key={it.slug} className="flex items-center justify-between gap-4 bg-card/40 px-5 py-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 min-w-0">
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

      <p className="mt-4 text-xs text-muted-foreground/70">
        Live counts from the last 2 hours. Internal test rooms hidden.
      </p>
    </section>
  );
}
