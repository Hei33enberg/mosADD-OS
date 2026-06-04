'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase, HUB_KEYS_ENDPOINT, SUPABASE_CONFIGURED } from './supabaseClient';

type Key = { id: string; name: string; key_prefix: string; plan: string; created_at: string };

const CHECKOUT = {
  pro: 'https://buy.stripe.com/cNidR862hdwG9QxboQ3VC00',
  team: 'https://buy.stripe.com/5kQ00ieyN50a2o5gJa3VC01',
};

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
  async function google() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
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
        <h1 className="font-display text-3xl font-semibold">Sign in to the hosted hub</h1>
        <p className="mt-2 mb-8 text-muted-foreground">Get a key, paste it into your agent, done. No backend to run.</p>
        <button
          onClick={google}
          className="w-full max-w-sm rounded-none border border-border px-4 py-3 text-foreground transition-colors hover:border-primary/50"
        >
          Continue with Google
        </button>
        <div className="my-5 max-w-sm text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">or</div>
        {sent ? (
          <p className="max-w-sm text-sm text-primary">✓ Check your inbox for a magic link.</p>
        ) : (
          <form onSubmit={magicLink} className="flex max-w-sm flex-col gap-2">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@company.com"
              className="rounded-none border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
            <button className="rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Email me a magic link →
            </button>
          </form>
        )}
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
        <a href={CHECKOUT.pro} className="rounded-none border border-primary/50 px-4 py-2 text-sm text-primary hover:bg-primary/10">Upgrade to Pro — $9/mo →</a>
        <a href="/pricing" className="rounded-none border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50">Team — $29/mo →</a>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Free tier active by default. Your key works with <code className="font-mono">npx -y @mosadd/mcp@alpha</code> —
        no server to run, no Supabase creds, no expiring tokens.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-6 py-14">{children}</div>;
}
