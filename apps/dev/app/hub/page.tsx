'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getSupabase, HUB_KEYS_ENDPOINT, SUPABASE_CONFIGURED } from './supabaseClient';
import { getPlan, fmtLimit, defaultSpendCapUsd, OVERAGE_RATE_USD, type Plan } from '../_lib/plans';

type Key = {
  id: string;
  name: string;
  key_prefix: string;
  plan: string;
  created_at: string;
  last_used_at: string | null;
};

type Usage = {
  tier: string;
  mat_count_month: number;
  msg_count_month: number;
  search_count_month: number;
  spend_cap_usd_month: number | null;
  paid_usd_month: number;
  payg_enabled: boolean;
  period?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const CHECKOUT_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/create-checkout-session` : '';
const PORTAL_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/create-portal-session` : '';
const USAGE_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/hub-usage` : '';

function snippet(key: string) {
  return `claude mcp add mosadd \\
  --env MOSADD_API_KEY=${key} \\
  -- npx -y @mosadd/mcp@alpha`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

export default function HubPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [keys, setKeys] = useState<Key[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  async function manageBilling() {
    if (!token || !PORTAL_ENDPOINT) return;
    setPortalBusy(true);
    setCheckoutErr(null);
    try {
      const res = await fetch(PORTAL_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_path: '/hub' }),
      });
      const d = await res.json();
      if (!res.ok || !d.url) throw new Error(d?.error ?? 'Could not open billing portal.');
      window.location.href = d.url;
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : 'Could not open billing portal.');
      setPortalBusy(false);
    }
  }

  async function upgrade(plan: 'pro' | 'team') {
    if (!token || !CHECKOUT_ENDPOINT) return;
    setBusy(true);
    setCheckoutErr(null);
    try {
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'checkout failed');
      if (d.url) { window.location.href = d.url; return; }
      setCheckoutErr(d.updated ? 'Your plan was updated.' : 'Checkout could not start.');
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : 'checkout failed');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setEmail(u?.email ?? null);
      setAvatar(u?.user_metadata?.avatar_url ?? null);
      setToken(data.session?.access_token ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setEmail(u?.email ?? null);
      setAvatar(u?.user_metadata?.avatar_url ?? null);
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const [keysLoaded, setKeysLoaded] = useState(false);
  const autoIssued = useRef(false);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    const res = await fetch(HUB_KEYS_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setKeys((await res.json()).keys ?? []);
    setKeysLoaded(true);
  }, [token]);

  const loadUsage = useCallback(async () => {
    if (!token || !USAGE_ENDPOINT) return;
    try {
      const res = await fetch(USAGE_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsage(await res.json());
    } catch {
      /* hub-usage not deployed yet — card stays hidden */
    }
  }, [token]);

  useEffect(() => { if (token) { loadKeys(); loadUsage(); } }, [token, loadKeys, loadUsage]);

  useEffect(() => {
    if (token && keysLoaded && keys.length === 0 && !fresh && !busy && !autoIssued.current) {
      autoIssued.current = true;
      void createKey();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, keysLoaded, keys.length, fresh, busy]);

  async function createKey() {
    if (!token) return;
    setBusy(true);
    const res = await fetch(HUB_KEYS_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'default' }),
    });
    if (res.ok) {
      const d = await res.json();
      setFresh(d.key);
      await loadKeys();
    }
    setBusy(false);
  }

  async function revoke(id: string) {
    if (!token || !confirm('Revoke this key? Any agent using it will stop working.')) return;
    await fetch(`${HUB_KEYS_ENDPOINT}?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadKeys();
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  // Anchor the magic-link + OAuth redirect to the canonical hub URL (A4 /
  // LINEAR-3140). Using `window.location.origin` previously meant a user who
  // followed a stale hub.mosadd.com link or a preview deployment could end up
  // back on the wrong host after auth. Override with NEXT_PUBLIC_HUB_URL when
  // testing in non-prod (defaults to https://mosadd.dev/hub).
  const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? 'https://mosadd.dev/hub';

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: { emailRedirectTo: HUB_URL },
    });
    setSent(true);
  }
  async function github() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: HUB_URL },
    });
  }

  if (!ready) return <Shell><p className="text-muted-foreground">loading…</p></Shell>;

  if (!SUPABASE_CONFIGURED) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold">Hosted hub</h1>
        <p className="mt-3 text-muted-foreground">
          The hosted hub opens shortly. Self-host is free today —{' '}
          <a href="/docs/quickstart" className="text-primary hover:underline">quickstart →</a>
        </p>
      </Shell>
    );
  }

  /* ── sign-in gate ────────────────────────────────────────────────── */
  if (!email) {
    return (
      <Shell>
        <div className="mx-auto mt-8 w-full max-w-sm border border-border bg-card/30 p-7">
          <h1 className="font-display text-2xl font-semibold">Sign in to the hub</h1>
          <p className="mt-2 mb-7 text-sm text-muted-foreground">Get a key, paste it into your agent, done.</p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={github}
              className="flex items-center justify-center gap-2.5 rounded-none border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-card"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Continue with GitHub
            </button>
          </div>
          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
          </div>
          {sent ? (
            <p className="text-sm text-primary">Check your inbox for a magic link.</p>
          ) : (
            <form onSubmit={magicLink} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                className="rounded-none border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
              <button className="rounded-none bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Email me a magic link
              </button>
            </form>
          )}
          <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
            By continuing you agree to our <a href="/legal/terms" className="underline hover:text-foreground">Terms</a> and{' '}
            <a href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </Shell>
    );
  }

  /* ── dashboard ───────────────────────────────────────────────────── */
  const currentPlan = usage?.tier ?? (keys.length > 0 ? keys[0].plan : 'free');
  const planInfo = getPlan(currentPlan);

  return (
    <Shell>
      {/* ── header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full border border-border" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-lg font-bold uppercase text-primary">
              {(email ?? '?')[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <button onClick={() => supabase?.auth.signOut()} className="text-xs text-muted-foreground hover:text-foreground mt-2">
          Sign out
        </button>
      </div>

      {/* ── stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="Plan" value={planInfo.label} sub={planInfo.price} accent />
        <StatCard label="API keys" value={String(keys.length)} sub={keys.length === 1 ? 'active key' : 'active keys'} />
        <StatCard
          label="MAT used"
          value={usage ? usage.mat_count_month.toLocaleString() : fmtLimit(planInfo.mat)}
          sub={usage ? `of ${fmtLimit(planInfo.mat)} / mo` : 'MAT / month'}
        />
        <StatCard label="Last active" value={keys.length > 0 ? timeAgo(keys[0].last_used_at) : '—'} sub="most recent key use" />
      </div>

      {/* ── usage ───────────────────────────────────────────────────── */}
      {usage ? (
        <UsageCard usage={usage} plan={planInfo} onManageBilling={manageBilling} portalBusy={portalBusy} />
      ) : null}

      {/* ── new key banner ──────────────────────────────────────────── */}
      {fresh ? (
        <div className="mb-8 border border-primary/40 bg-primary/[0.05] p-5">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">Your new key — copy it now, never shown again</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto break-all border border-border bg-card px-3 py-2 font-mono text-sm text-primary">{fresh}</code>
            <button
              onClick={() => copyToClipboard(fresh, 'key')}
              className="shrink-0 rounded-none border border-primary/40 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10"
            >
              {copied === 'key' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Install in Claude Code</div>
          <div className="mt-1 flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto border border-border bg-card px-3 py-2 font-mono text-xs text-foreground">{snippet(fresh)}</pre>
            <button
              onClick={() => copyToClipboard(snippet(fresh), 'snippet')}
              className="shrink-0 rounded-none border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              {copied === 'snippet' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setFresh(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      ) : null}

      {/* ── two-column layout ───────────────────────────────────────── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        {/* left: keys */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">API keys</h2>
            <button
              onClick={createKey}
              disabled={busy}
              className="rounded-none bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? '…' : '+ New key'}
            </button>
          </div>
          <div className="border border-border divide-y divide-border">
            {keys.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">No keys yet — one is being created for you.</p>
            ) : (
              keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm text-foreground truncate">{k.key_prefix}…</code>
                      <span className="shrink-0 border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">{k.plan}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      Created {new Date(k.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      {k.last_used_at ? ` · last used ${timeAgo(k.last_used_at)}` : ' · never used'}
                    </div>
                  </div>
                  <button
                    onClick={() => revoke(k.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-xs text-destructive/70 hover:text-destructive transition-opacity"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* right: sidebar */}
        <div className="space-y-6">
          {/* plan */}
          <div className="border border-border p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Current plan</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-2xl font-bold text-foreground">{planInfo.label}</span>
              <span className="text-sm text-muted-foreground">{planInfo.price}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {fmtLimit(planInfo.mat)} MAT / mo · hard cap at 2× plan price
            </div>
            {currentPlan === 'free' ? (
              <div className="space-y-2">
                <button onClick={() => upgrade('pro')} disabled={busy} className="w-full rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  Upgrade to Pro — $9/mo
                </button>
                <button onClick={() => upgrade('team')} disabled={busy} className="w-full rounded-none border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50 disabled:opacity-60">
                  Team — $29/mo
                </button>
              </div>
            ) : currentPlan === 'pro' ? (
              <button onClick={() => upgrade('team')} disabled={busy} className="w-full rounded-none border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50 disabled:opacity-60">
                Upgrade to Team — $29/mo
              </button>
            ) : null}
            {checkoutErr && <p className="mt-2 text-xs text-destructive">{checkoutErr}</p>}
          </div>

          {/* quick links */}
          <div className="border border-border p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Quick links</div>
            <div className="space-y-2 text-sm">
              <QuickLink href="/docs/quickstart" label="Quickstart" desc="Connect your first agent" />
              <QuickLink href="/embed/new" label="Embed widget" desc="Add chat to your site" />
              <QuickLink href="/domains" label="Domain verification" desc="mURL owner analytics" />
              <QuickLink href="/docs/mcp" label="MCP reference" desc="65 live tools" />
              <QuickLink href="/pricing" label="Pricing" desc="Plans and limits" />
            </div>
          </div>

          {/* products */}
          <div className="border border-border p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Products</div>
            <div className="space-y-2 text-sm">
              <QuickLink href="/docs/mcp" label="MCP toolkit" desc="65 tools, one server" />
              <QuickLink href="/embed" label="mIRC embed" desc="Chat widget for any site" />
              <QuickLink href="https://murl.mosadd.com" label="mURL" desc="Domain chat rooms" external />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-6 py-14">{children}</div>;
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = limit != null && used > limit;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground">
          {used.toLocaleString()}<span className="text-muted-foreground"> / {fmtLimit(limit)}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden border border-border bg-card">
        <div className={`h-full ${over ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${limit == null ? 4 : pct}%` }} />
      </div>
    </div>
  );
}

function UsageCard({ usage, plan, onManageBilling, portalBusy }: { usage: Usage; plan: Plan; onManageBilling: () => void; portalBusy: boolean }) {
  const isPaid = plan.id === 'pro' || plan.id === 'team';
  const cap = usage.spend_cap_usd_month ?? defaultSpendCapUsd(plan.id);
  return (
    <div className="mb-10 border border-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Usage this month{usage.period ? ` · ${usage.period}` : ''}
        </h2>
        {isPaid ? (
          <button
            onClick={onManageBilling}
            disabled={portalBusy}
            className="rounded-none border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/50 disabled:opacity-60"
          >
            {portalBusy ? '…' : 'Manage billing'}
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Meter label="MAT" used={usage.mat_count_month} limit={plan.mat} />
        <Meter label="Messages" used={usage.msg_count_month} limit={plan.messages} />
        <Meter label="RAG searches" used={usage.search_count_month} limit={plan.ragSearches} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
        <span>Overage: {usage.payg_enabled ? `$${OVERAGE_RATE_USD.toFixed(3)} / extra MAT` : 'off — hard stop at cap'}</span>
        {usage.payg_enabled ? (
          <span>This month: ${usage.paid_usd_month.toFixed(2)}{cap ? ` / $${cap.toFixed(2)} cap` : ''}</span>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border border-border p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, label, desc, external }: { href: string; label: string; desc: string; external?: boolean }) {
  const cls = "flex items-center justify-between py-1.5 group";
  const inner = (
    <>
      <div>
        <div className="text-foreground group-hover:text-primary transition-colors">{label}</div>
        <div className="text-[10px] text-muted-foreground">{desc}</div>
      </div>
      <span className="text-muted-foreground group-hover:text-primary transition-colors text-xs">{external ? '↗' : '→'}</span>
    </>
  );
  if (external) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  return <Link href={href} className={cls}>{inner}</Link>;
}
