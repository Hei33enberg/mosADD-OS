'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const STATS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/channel0-owner-stats` : '';

interface Stats {
  domain: string;
  slug: string;
  range: { since_7d: string; since_24h: string };
  last_7d:  { messages: number; unique_senders: number };
  last_24h: { messages: number; unique_senders: number; hourly: number[] };
}

export default function OwnerStatsPage() {
  const params = useParams() as { domain: string };
  const rawDomain = decodeURIComponent(params.domain ?? '').toLowerCase();

  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(STATS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: rawDomain }),
        });
        const body = await r.json();
        if (!alive) return;
        if (!r.ok) { setErr(body?.reason ?? body?.error ?? `HTTP ${r.status}`); setLoading(false); return; }
        setData(body as Stats);
        setLoading(false);
      } catch (e) {
        if (alive) { setErr(String(e)); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [rawDomain]);

  const maxHourly = data ? Math.max(1, ...data.last_24h.hourly) : 1;

  // C2 / 3154: download the on-screen numbers as CSV (no PII — aggregates only).
  function downloadCsv() {
    if (!data) return;
    const now = new Date();
    const hours = data.last_24h.hourly.map((v, i) => {
      const hr = new Date(now.getTime() - (data.last_24h.hourly.length - 1 - i) * 3600_000);
      return `${hr.toISOString()},${v}`;
    });
    const csv = [
      `# mURL stats for ${data.domain}`,
      `# generated_at,${now.toISOString()}`,
      `# slug,${data.slug}`,
      '',
      'window,messages,unique_senders',
      `last_24h,${data.last_24h.messages},${data.last_24h.unique_senders}`,
      `last_7d,${data.last_7d.messages},${data.last_7d.unique_senders}`,
      '',
      'hour_iso,messages',
      ...hours,
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mosadd-murl-${data.domain}-${now.toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · mURL owner analytics · free</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">
        Stats for <span className="text-primary">#{rawDomain}</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Aggregate activity for the channel on your domain. Ownership re-verified
        against your <span className="font-mono">_mosadd-murl</span> TXT at every load — remove the
        record to revoke access.
      </p>

      {loading && <div className="mt-10 text-sm text-muted-foreground">loading…</div>}

      {err && (
        <div className="mt-10 rounded-none border border-destructive p-6">
          <div className="text-sm text-destructive">{err === 'verify_first' || err === 'not_verified'
            ? <>This domain isn&apos;t verified yet. <Link className="text-primary underline" href="/domains">Verify ownership first →</Link></>
            : err === 'verification_lost' || err === 'txt_record_missing'
            ? <>The DNS TXT record is no longer present. Add it back at <Link className="text-primary underline" href="/domains">/domains</Link> to re-enable analytics.</>
            : err}</div>
        </div>
      )}

      {data && (
        <div className="mt-10 space-y-8">
          {/* Last 24h */}
          <div className="rounded-none border border-border p-6">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">last 24 hours</div>
            <div className="flex items-end gap-8 flex-wrap">
              <div>
                <div className="font-display text-4xl text-primary">{data.last_24h.messages}</div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">messages</div>
              </div>
              <div>
                <div className="font-display text-4xl text-foreground">{data.last_24h.unique_senders}</div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">unique senders</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">hourly distribution</div>
              <div className="mt-2 flex items-end gap-[2px] h-24 border-b border-border">
                {data.last_24h.hourly.map((v, i) => (
                  <div
                    key={i}
                    title={`${v} msg`}
                    className="flex-1 bg-primary/50 transition-colors hover:bg-primary"
                    style={{ height: `${(v / maxHourly) * 100}%`, minHeight: v > 0 ? '2px' : 0 }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>-23h</span><span>now</span>
              </div>
            </div>
          </div>

          {/* Last 7d */}
          <div className="rounded-none border border-border p-6">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">last 7 days</div>
            <div className="flex items-end gap-8 flex-wrap">
              <div>
                <div className="font-display text-4xl text-primary">{data.last_7d.messages}</div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">messages</div>
              </div>
              <div>
                <div className="font-display text-4xl text-foreground">{data.last_7d.unique_senders}</div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">unique senders</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Link className="underline" href="/domains">← Back to /domains</Link>
            <span>·</span>
            <Link className="underline" href={`/c/${rawDomain}`}>landing</Link>
            <span>·</span>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-none border border-border px-2 py-1 text-[11px] uppercase tracking-[0.15em] hover:border-primary/60 hover:text-primary"
            >
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
