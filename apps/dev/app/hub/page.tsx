'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase, HUB_KEYS_ENDPOINT, SUPABASE_CONFIGURED } from './supabaseClient';

type Key = { id: string; name: string; key_prefix: string; plan: string; created_at: string };

// Checkout goes through create-checkout-session (injects supabase_user_id into the
// Stripe session metadata so the webhook can apply the plan) — NOT a raw Payment
// Link, which can't link the purchase back to the buyer.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const CHECKOUT_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/create-checkout-session` : '';

function snippet(key: string) {
  return `claude mcp add mosadd \\
  --env MOSADD_API_KEY=${key} \\
  -- npx -y @mosadd/mcp@alpha`;
}

export default function HubPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [keys, setKeys] = useState<Key[]>([]);
  const [fresh, setFresh] = useState<string | null>(null); // plaintext shown once
  const [busy, setBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

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

  const [keysLoaded, setKeysLoaded] = useState(false);
  const autoIssued = useRef(false);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    const res = await fetch(HUB_KEYS_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setKeys((await res.json()).keys ?? []);
    setKeysLoaded(true);
  }, [token]);

  useEffect(() => {
    if (token) loadKeys();
  }, [token, loadKeys]);

  // Zero-friction onboarding: the moment a signed-in dev has NO key, mint one for
  // them automatically and show it once. No "Create key" step to hunt for.
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
    if (!token) return;
    await fetch(`${HUB_KEYS_ENDPOINT}?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadKeys();
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: { emailRedirectTo: `${window.location.origin}/hub` },
    });
    setSent(true);
  }
  async function github() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/hub` },
    });
  }

  if (!ready) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;

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

  if (!email) {
    return (
      <Shell>
        <div className="mx-auto mt-8 w-full max-w-sm border border-border bg-card/30 p-7">
          <h1 className="font-display text-2xl font-semibold">Sign in to the hosted hub</h1>
          <p className="mt-2 mb-7 text-sm text-muted-foreground">Get a key, paste it into your agent, done. No backend to run.</p>
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
            <p className="text-sm text-primary">✓ Check your inbox for a magic link.</p>
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
                Email me a magic link →
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

  return (
    <Shell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your hub</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <button onClick={() => supabase?.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </div>

      {fresh ? (
        <div className="mb-8 border border-primary/40 bg-primary/[0.05] p-5">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">Your new key — copied once, never shown again</div>
          <code className="block overflow-x-auto break-all border border-border bg-card px-3 py-2 font-mono text-sm text-primary">{fresh}</code>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Paste into Claude Code</div>
          <pre className="mt-1 overflow-x-auto border border-border bg-card px-3 py-2 font-mono text-xs text-foreground">{snippet(fresh)}</pre>
          <button
            onClick={() => navigator.clipboard?.writeText(snippet(fresh))}
            className="mt-3 rounded-none bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Copy install command
          </button>
          <button onClick={() => setFresh(null)} className="ml-3 text-xs text-muted-foreground hover:text-foreground">dismiss</button>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">API keys</h2>
        <button
          onClick={createKey}
          disabled={busy}
          className="rounded-none bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? '…' : '+ Create key'}
        </button>
      </div>
      <div className="border border-border divide-y divide-border">
        {keys.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No keys yet — create one to connect your agent.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <code className="font-mono text-sm text-foreground">{k.key_prefix}…</code>
                <span className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">{k.plan}</span>
              </div>
              <button onClick={() => revoke(k.id)} className="text-xs text-destructive/80 hover:text-destructive">revoke</button>
            </div>
          ))
        )}
      </div>

      <h2 className="font-display mt-12 mb-3 text-lg font-semibold">Plan</h2>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => upgrade('pro')} disabled={busy} className="rounded-none border border-primary/50 px-4 py-2 text-sm text-primary hover:bg-primary/10 disabled:opacity-60">Upgrade to Pro — $9/mo →</button>
        <button onClick={() => upgrade('team')} disabled={busy} className="rounded-none border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50 disabled:opacity-60">Team — $29/mo →</button>
      </div>
      {checkoutErr && <p className="mt-2 text-xs text-destructive">{checkoutErr}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Free tier active by default — 1,000 outbound msg/mo via MCP, then it stops (no surprise bill, no card on file).
        Your key works with <code className="font-mono">npx -y @mosadd/mcp@alpha</code> — no server to run, no Supabase
        creds, no expiring tokens. See <a href="/pricing" className="underline hover:text-primary">/pricing</a> for the
        full tier breakdown.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-6 py-14">{children}</div>;
}
