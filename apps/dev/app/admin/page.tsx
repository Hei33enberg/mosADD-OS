'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase, SUPABASE_CONFIGURED } from '../hub/supabaseClient';

// Founder admin dashboard for the mosadd.dev BUSINESS.
// Tabs: Overview | Customers | Ops | Moderation. Admin-gated server-side
// (user_roles role='admin') by dev-admin-stats (Overview/Customers) and
// admin-ops (Ops/Moderation).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const STATS_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/dev-admin-stats` : '';
const OPS_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/admin-ops` : '';

interface Customer {
  user_id: string;
  email: string | null;
  tier: string;
  mat_used_month: number;
  msg_used_month?: number;
  search_used_month?: number;
  payg_enabled: boolean;
  paid_usd_month?: number;
  spend_cap_usd_month?: number | null;
  brand_removal_paid?: boolean;
  stripe_customer_id?: string | null;
  keys_active: number;
  products: string[];
  last_active: string | null;
}

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
  customers: Customer[];
  recent_creators: { user_id: string; email?: string | null; product: string; created_at: string; last_used_at: string | null }[];
}

interface Ops {
  generated_at: string;
  alerts: Array<{ id: string; source: string; severity: string; subject: string; body?: string; created_at: string; resolved_at?: string | null }>;
  health_checks: Array<{ name: string; url: string; status?: string | null; latency_ms?: number | null; consecutive_failures?: number; last_checked_at?: string | null; last_ok_at?: string | null; enabled?: boolean }>;
  provider_status: Array<{ provider: string; balance_usd_cents?: number | null; threshold_warn_cents?: number | null; threshold_critical_cents?: number | null; last_alert_level?: string | null; last_checked_at?: string | null }>;
  worker_metrics_1h: Record<string, { count: number; sum: number; avg: number; max: number; latest: number; latest_ts: string }>;
  ops_digests: Array<{ ts: string; summary?: Record<string, unknown> | null; body?: string | null }>;
  moderation: {
    reports_queue: Array<{ message_id: string; channel_slug: string; reasons: string[]; first: string; latest: string; count: number }>;
    device_bans: Array<{ device_hash: string; reason?: string | null; created_at: string; expires_at?: string | null }>;
  };
}

type TabId = 'overview' | 'customers' | 'ops' | 'moderation';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'customers', label: 'Customers' },
  { id: 'ops', label: 'Ops' },
  { id: 'moderation', label: 'Moderation' },
];

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>;
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

function fmtAgo(iso?: string | null): string {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function fmtDollars(usd?: number | null): string {
  if (usd == null) return '—';
  return `$${usd.toFixed(2)}`;
}

export default function AdminPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ops, setOps] = useState<Ops | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>('overview');
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);

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
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadOps = useCallback(async () => {
    if (!token || !OPS_ENDPOINT) return;
    try {
      const r = await fetch(OPS_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      setOps(await r.json());
    } catch {
      /* admin-ops may not be deployed in this env — silent */
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'revoke failed');
    }
  }, [token, load]);

  useEffect(() => {
    if (token) {
      void load();
      void loadOps();
    }
  }, [token, load, loadOps]);

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
  const openAlerts = ops?.alerts?.length ?? 0;
  const failingChecks = ops?.health_checks?.filter((h) => h.status && h.status.toLowerCase() !== 'ok' && h.status.toLowerCase() !== 'healthy').length ?? 0;
  const queueDepth = ops?.moderation?.reports_queue?.length ?? 0;

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

      {/* tabs */}
      <div className="flex items-end gap-1 mb-6 border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.id;
          let badge: React.ReactNode = null;
          if (t.id === 'ops' && (openAlerts + failingChecks) > 0)
            badge = <span className="ml-1.5 text-[10px] text-destructive">●</span>;
          if (t.id === 'moderation' && queueDepth > 0)
            badge = <span className="ml-1.5 text-[10px] text-destructive">{queueDepth}</span>;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'px-3 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors ' +
                (active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')
              }
            >
              {t.label}
              {badge}
            </button>
          );
        })}
      </div>

      {err && (
        <div className="border-l-2 border-destructive bg-destructive/5 p-3 mb-4 text-sm text-destructive">{err}</div>
      )}

      {loading && !stats && <div className="text-muted-foreground">Loading stats…</div>}

      {tab === 'overview' && stats && (
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

          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Recent creators</h2>
          <div className="border border-border divide-y divide-border mb-4">
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
            <button onClick={() => { void load(); void loadOps(); }} className="underline hover:text-foreground">refresh</button>
          </p>
        </>
      )}

      {tab === 'customers' && stats && (
        <>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Customers <span className="text-muted-foreground/60">({stats.customers?.length ?? 0})</span>
          </h2>
          <div className="border border-border divide-y divide-border">
            {(!stats.customers || stats.customers.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No customers yet.</div>
            )}
            {(stats.customers ?? []).map((c) => {
              const open = openCustomer === c.user_id;
              return (
                <div key={c.user_id} className="text-xs">
                  <button
                    type="button"
                    onClick={() => setOpenCustomer(open ? null : c.user_id)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-card/40"
                  >
                    <span className="font-mono truncate max-w-[220px]" title={c.user_id}>{c.email ?? `${c.user_id.slice(0, 8)}…`}</span>
                    <span className={`uppercase tracking-widest ${c.tier === 'free' ? 'text-muted-foreground' : 'text-primary'}`}>{c.tier}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{c.keys_active} key{c.keys_active === 1 ? '' : 's'}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{c.mat_used_month.toLocaleString()} MAT{c.payg_enabled ? ' · PAYG' : ''}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{c.last_active ? new Date(c.last_active).toLocaleDateString() : '—'}</span>
                    <span className="text-muted-foreground">{open ? '▾' : '▸'}</span>
                  </button>
                  {open && (
                    <div className="bg-card/30 px-3 pb-3 pt-1 grid gap-3 md:grid-cols-3 text-[11px]">
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest mb-1">Usage</div>
                        <div>MAT: <span className="font-mono">{c.mat_used_month.toLocaleString()}</span></div>
                        <div>Messages: <span className="font-mono">{(c.msg_used_month ?? 0).toLocaleString()}</span></div>
                        <div>RAG: <span className="font-mono">{(c.search_used_month ?? 0).toLocaleString()}</span></div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest mb-1">Billing</div>
                        <div>PAYG: {c.payg_enabled ? 'on' : 'off'}</div>
                        <div>Paid this mo: <span className="font-mono">{fmtDollars(c.paid_usd_month)}</span></div>
                        <div>Spend cap: <span className="font-mono">{c.spend_cap_usd_month != null ? fmtDollars(c.spend_cap_usd_month) : 'default (2× plan)'}</span></div>
                        <div>Brand removal: {c.brand_removal_paid ? 'paid' : '—'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase tracking-widest mb-1">Account</div>
                        <div className="break-all">user_id: <span className="font-mono">{c.user_id}</span></div>
                        <div>Products: {c.products.length ? c.products.join(', ') : '—'}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.stripe_customer_id ? (
                            <a
                              href={`https://dashboard.stripe.com/customers/${c.stripe_customer_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="border border-border px-2 py-1 hover:border-primary/60 hover:text-primary"
                            >
                              Stripe customer ↗
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60">no Stripe customer</span>
                          )}
                          {c.keys_active > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void revokeUser(c.user_id, c.email ?? c.user_id); }}
                              className="border border-destructive/30 text-destructive/80 px-2 py-1 hover:bg-destructive/5"
                            >
                              Revoke {c.keys_active} key{c.keys_active === 1 ? '' : 's'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'ops' && (
        <>
          {!ops ? (
            <div className="text-sm text-muted-foreground">Loading ops…</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Open alerts" value={ops.alerts.length} sub={`${ops.alerts.filter((a) => a.severity === 'critical').length} critical`} />
                <Stat label="Health checks" value={ops.health_checks.length} sub={`${failingChecks} failing`} />
                <Stat label="Providers" value={ops.provider_status.length} sub={`${ops.provider_status.filter((p) => p.last_alert_level && p.last_alert_level !== 'ok').length} alerting`} />
                <Stat label="Worker metrics 1h" value={Object.keys(ops.worker_metrics_1h).length} sub="distinct series" />
              </div>

              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Open alerts</h2>
                {ops.alerts.length === 0 ? (
                  <div className="border border-border p-3 text-sm text-muted-foreground">No open alerts.</div>
                ) : (
                  <div className="border border-border divide-y divide-border">
                    {ops.alerts.map((a) => (
                      <div key={a.id} className="p-3 text-xs">
                        <div className="flex items-baseline gap-3">
                          <span className={`uppercase tracking-widest text-[10px] ${a.severity === 'critical' ? 'text-destructive' : a.severity === 'warn' ? 'text-primary' : 'text-muted-foreground'}`}>{a.severity}</span>
                          <span className="text-muted-foreground">{a.source}</span>
                          <span className="ml-auto text-muted-foreground">{fmtAgo(a.created_at)}</span>
                        </div>
                        <div className="mt-1 text-foreground">{a.subject}</div>
                        {a.body && <div className="mt-1 text-muted-foreground whitespace-pre-wrap break-words">{a.body.slice(0, 280)}{a.body.length > 280 ? '…' : ''}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Health checks</h2>
                <div className="border border-border divide-y divide-border">
                  {ops.health_checks.map((h) => {
                    const ok = (h.status ?? '').toLowerCase() === 'ok' || (h.status ?? '').toLowerCase() === 'healthy';
                    return (
                      <div key={h.name} className="flex items-center gap-3 p-3 text-xs">
                        <span className={`text-[10px] ${ok ? 'text-primary' : 'text-destructive'}`}>{ok ? '●' : '●'}</span>
                        <span className="font-mono w-48 truncate" title={h.name}>{h.name}</span>
                        <span className="text-muted-foreground w-20 text-right">{h.latency_ms != null ? `${h.latency_ms} ms` : '—'}</span>
                        <span className="text-muted-foreground">{h.consecutive_failures ? `${h.consecutive_failures} fail` : 'ok'}</span>
                        <span className="ml-auto text-muted-foreground">checked {fmtAgo(h.last_checked_at)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Provider status</h2>
                <div className="border border-border divide-y divide-border">
                  {ops.provider_status.map((p) => (
                    <div key={p.provider} className="flex items-center gap-3 p-3 text-xs">
                      <span className="font-mono w-32 uppercase">{p.provider}</span>
                      <span className="text-muted-foreground">
                        {p.balance_usd_cents != null ? `$${(p.balance_usd_cents / 100).toFixed(2)}` : '—'}
                      </span>
                      <span className={`uppercase tracking-widest text-[10px] ${p.last_alert_level === 'critical' ? 'text-destructive' : p.last_alert_level === 'warn' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {p.last_alert_level ?? '—'}
                      </span>
                      <span className="ml-auto text-muted-foreground">checked {fmtAgo(p.last_checked_at)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(ops.worker_metrics_1h).length > 0 && (
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Worker metrics — last hour</h2>
                  <div className="border border-border divide-y divide-border">
                    {Object.entries(ops.worker_metrics_1h).map(([metric, v]) => (
                      <div key={metric} className="flex items-center gap-3 p-3 text-xs">
                        <span className="font-mono w-56 truncate" title={metric}>{metric}</span>
                        <span className="text-muted-foreground w-24 text-right">latest <span className="text-foreground font-mono">{v.latest.toLocaleString()}</span></span>
                        <span className="text-muted-foreground w-24 text-right">avg <span className="text-foreground font-mono">{v.avg.toFixed(2)}</span></span>
                        <span className="text-muted-foreground w-24 text-right">max <span className="text-foreground font-mono">{v.max.toLocaleString()}</span></span>
                        <span className="ml-auto text-muted-foreground">{fmtAgo(v.latest_ts)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Generated {new Date(ops.generated_at).toLocaleString()} ·{' '}
                <button onClick={loadOps} className="underline hover:text-foreground">refresh</button>
              </p>
            </div>
          )}
        </>
      )}

      {tab === 'moderation' && (
        <>
          {!ops ? (
            <div className="text-sm text-muted-foreground">Loading moderation queue…</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Reports queue <span className="text-muted-foreground/60">({ops.moderation.reports_queue.length})</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Messages auto-hide at 3 reports (DB trigger). Admin unhide / device ban actions land in B4.
                </p>
                {ops.moderation.reports_queue.length === 0 ? (
                  <div className="border border-border p-3 text-sm text-muted-foreground">Queue empty.</div>
                ) : (
                  <div className="border border-border divide-y divide-border">
                    {ops.moderation.reports_queue.map((r) => (
                      <div key={r.message_id} className="flex items-center gap-3 p-3 text-xs">
                        <span className={`font-mono ${r.count >= 3 ? 'text-destructive' : 'text-foreground'}`}>{r.count}×</span>
                        <span className="text-muted-foreground">#{r.channel_slug}</span>
                        <span className="font-mono text-muted-foreground truncate max-w-[220px]" title={r.message_id}>{r.message_id.slice(0, 12)}…</span>
                        <span className="text-muted-foreground truncate max-w-[260px]" title={r.reasons.join(', ')}>{r.reasons.join(', ') || '—'}</span>
                        <span className="ml-auto text-muted-foreground">latest {fmtAgo(r.latest)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Device bans <span className="text-muted-foreground/60">({ops.moderation.device_bans.length})</span>
                </h2>
                {ops.moderation.device_bans.length === 0 ? (
                  <div className="border border-border p-3 text-sm text-muted-foreground">No active device bans.</div>
                ) : (
                  <div className="border border-border divide-y divide-border">
                    {ops.moderation.device_bans.map((b) => (
                      <div key={b.device_hash} className="flex items-center gap-3 p-3 text-xs">
                        <span className="font-mono text-muted-foreground truncate max-w-[260px]" title={b.device_hash}>{b.device_hash.slice(0, 18)}…</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">{b.reason ?? '—'}</span>
                        <span className="text-muted-foreground">{b.expires_at ? `expires ${fmtAgo(b.expires_at)}` : 'permanent'}</span>
                        <span className="ml-auto text-muted-foreground">banned {fmtAgo(b.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
