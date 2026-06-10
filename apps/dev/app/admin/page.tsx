'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase, SUPABASE_CONFIGURED } from '../hub/supabaseClient';

// Founder admin dashboard for the mosadd.dev BUSINESS (embed/hub): creators,
// embed keys, plan mix, MAT usage, PAYG overage revenue, estimated MRR.
// Admin-gated server-side by dev-admin-stats (user_roles role='admin').

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const STATS_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/dev-admin-stats` : '';

interface Stats {
  generated_at: string;
  creators_total: number;
  embed_keys_active: number;
  embed_keys_used_24h: number;
  plan_mix: Record<string, number>;
  active_dev_subs: Record<string, number>;
  mrr_estimate_usd: number;
  overage_revenue_usd_month: number;
  mat_total_month: number;
  payg_enabled_count: number;
  billing?: { account_id?: string; charges_enabled?: boolean; payouts_enabled?: boolean; details_submitted?: boolean; error?: string } | null;
  customers: { user_id: string; email: string | null; tier: string; mat_used_month: number; payg_enabled: boolean; keys_active: number; products: string[]; last_active: string | null }[];
  recent_creators: { user_id: string; email?: string | null; product: string; created_at: string; last_used_at: string | null }[];
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-6 py-14">{children}</div>;
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="border border-border bg-card/30 p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setToken(data.session?.access_token ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr('');
    try {
      const r = await fetch(STATS_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (r.status === 403) throw new Error('Your account is not an admin. Ask the owner to grant the admin role.');
      if (!r.ok) throw new Error(data?.error ?? 'failed to load');
      setStats(data as Stats);
    } catch (e: any) {
      setErr(e?.message ?? 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const revokeUser = useCallback(async (userId: string, label: string) => {
    if (!token) return;
    if (!window.confirm(`Revoke all embed keys for ${label}? Their integrations stop working immediately.`)) return;
    try {
      const r = await fetch(STATS_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_user_keys', user_id: userId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? 'revoke failed');
      await load();
    } catch (e: any) {
      setErr(e?.message ?? 'revoke failed');
    }
  }, [token, load]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const github = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  }, [supabase]);

  const magicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supabase) return;
      await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setSent(true);
    },
    [supabase, loginEmail],
  );

  if (!ready) return <Shell><div className="text-muted-foreground">Loading…</div></Shell>;

  if (!SUPABASE_CONFIGURED || !supabase) {
    return (
      <Shell>
        <h1 className="font-mono text-2xl font-bold uppercase mb-2">Admin</h1>
        <p className="text-sm text-muted-foreground">Auth is not configured in this environment.</p>
      </Shell>
    );
  }

  if (!token) {
    return (
      <Shell>
        <h1 className="font-mono text-2xl font-bold uppercase mb-1">mosADD admin</h1>
        <p className="text-sm text-muted-foreground mb-6">Owner-only dashboard. Sign in to continue.</p>
        <button
          onClick={github}
          className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-4 py-2 mb-4"
        >
          Continue with GitHub
        </button>
        {sent ? (
          <p className="text-sm text-primary">Magic link sent — check your inbox.</p>
        ) : (
          <form onSubmit={magicLink} className="flex gap-2 max-w-sm">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 bg-background border border-border px-3 py-2 text-sm"
            />
            <button className="border border-border text-xs uppercase tracking-widest font-bold px-4 py-2 hover:border-primary hover:text-primary">
              Email link
            </button>
          </form>
        )}
      </Shell>
    );
  }

  const pm = stats?.plan_mix ?? {};
  const subs = stats?.active_dev_subs ?? {};

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-2xl font-bold uppercase">mosADD admin</h1>
          <p className="text-xs text-muted-foreground">{email} · the mosadd.dev business</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
          <button onClick={() => supabase?.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </div>
      </div>

      {err && (
        <div className="border-l-2 border-destructive bg-destructive/5 p-3 mb-4 text-sm text-destructive">{err}</div>
      )}

      {loading && !stats && <div className="text-muted-foreground">Loading stats…</div>}

      {stats && (
        <>
          {stats.billing && (
            <div className={`mb-4 flex flex-wrap items-center gap-2 border-l-2 p-3 text-sm ${stats.billing.charges_enabled ? 'border-primary bg-primary/5 text-primary' : 'border-destructive bg-destructive/5 text-destructive'}`}>
              <span className="font-bold uppercase tracking-widest text-xs">Stripe</span>
              {stats.billing.charges_enabled ? (
                <span>LIVE — taking payments{stats.billing.payouts_enabled ? ' · payouts on' : ' · payouts pending'}{stats.billing.account_id ? ` · ${stats.billing.account_id}` : ''}</span>
              ) : (
                <span>NOT taking payments — {stats.billing.error ?? (stats.billing.details_submitted ? 'charges disabled' : 'account not activated')}</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Creators" value={stats.creators_total} sub="distinct active keys" />
            <Stat label="Embed keys" value={stats.embed_keys_active} sub={`${stats.embed_keys_used_24h} used 24h`} />
            <Stat label="Est. MRR" value={`$${stats.mrr_estimate_usd.toLocaleString()}`} sub="active dev subs" />
            <Stat label="Overage rev." value={`$${stats.overage_revenue_usd_month.toFixed(2)}`} sub="PAYG, this month" />
            <Stat label="MAT this month" value={stats.mat_total_month.toLocaleString()} sub="across all accounts" />
            <Stat label="PAYG on" value={stats.payg_enabled_count} sub="accounts opted in" />
            <Stat label="Pro subs" value={subs.pro ?? 0} sub="$9/mo each" />
            <Stat label="Team subs" value={subs.team ?? 0} sub="$29/mo each" />
          </div>

          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Plan mix</h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {(['free', 'pro', 'team', 'enterprise'] as const).map((t) => (
              <div key={t} className="border border-border bg-card/30 p-3 text-center">
                <div className="font-mono text-xl font-bold">{pm[t] ?? 0}</div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t}</div>
              </div>
            ))}
          </div>

          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Customers <span className="text-muted-foreground/60">({stats.customers?.length ?? 0})</span>
          </h2>
          <div className="border border-border divide-y divide-border mb-6">
            {(!stats.customers || stats.customers.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No customers yet.</div>
            )}
            {(stats.customers ?? []).map((c) => (
              <div key={c.user_id} className="flex items-center justify-between gap-3 p-3 text-xs">
                <span className="font-mono truncate max-w-[220px]" title={c.user_id}>{c.email ?? `${c.user_id.slice(0, 8)}…`}</span>
                <span className={`uppercase tracking-widest ${c.tier === 'free' ? 'text-muted-foreground' : 'text-primary'}`}>{c.tier}</span>
                <span className="text-muted-foreground whitespace-nowrap">{c.keys_active} key{c.keys_active === 1 ? '' : 's'}</span>
                <span className="text-muted-foreground whitespace-nowrap">{c.mat_used_month.toLocaleString()} MAT{c.payg_enabled ? ' · PAYG' : ''}</span>
                <span className="text-muted-foreground whitespace-nowrap">{c.last_active ? new Date(c.last_active).toLocaleDateString() : '—'}</span>
                {c.keys_active > 0 ? (
                  <button onClick={() => revokeUser(c.user_id, c.email ?? c.user_id)} className="text-destructive/70 hover:text-destructive whitespace-nowrap">revoke</button>
                ) : (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Recent creators</h2>
          <div className="border border-border divide-y divide-border">
            {stats.recent_creators.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No embed keys yet.</div>
            )}
            {stats.recent_creators.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 text-xs">
                <span className="font-mono text-muted-foreground">{c.user_id.slice(0, 8)}…</span>
                <span className="uppercase tracking-widest">{c.product}</span>
                <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                <span className="text-muted-foreground">
                  {c.last_used_at ? `used ${new Date(c.last_used_at).toLocaleDateString()}` : 'never used'}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground mt-4">
            Generated {new Date(stats.generated_at).toLocaleString()} ·{' '}
            <button onClick={load} className="underline hover:text-foreground">refresh</button>
          </p>
        </>
      )}
    </Shell>
  );
}
