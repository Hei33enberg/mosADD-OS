'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase, SUPABASE_CONFIGURED } from '../../hub/supabaseClient';

// Creator console, served on mosadd.dev (apps/dev) instead of the undeployed
// hub.mosadd.com. Same browser Supabase client as /hub. One self-contained page:
// login -> create key + list/revoke existing keys (embed-keys edge function).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const EMBED_KEYS_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/embed-keys` : '';

type Created = {
  id: string;
  pk_prefix: string;
  name: string;
  key: string;
  allowed_origins: string[];
  allowed_channels: string[];
};

type Key = {
  id: string;
  pk_prefix: string;
  name: string | null;
  allowed_channels: string[];
  allowed_origins: string[];
  created_at: string;
  last_used_at: string | null;
};

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6 py-14">{children}</div>;
}

export default function NewEmbedKeyPage() {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // login
  const [loginEmail, setLoginEmail] = useState('');
  const [sent, setSent] = useState(false);

  // create form
  const [name, setName] = useState('My site');
  const [channel, setChannel] = useState('default');
  const [originsRaw, setOriginsRaw] = useState('');
  const [mode, setMode] = useState<'live' | 'test'>('live');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<Created | null>(null);

  // existing keys
  const [keys, setKeys] = useState<Key[]>([]);

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

  const loadKeys = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(EMBED_KEYS_ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setKeys((await r.json()).keys ?? []);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadKeys();
  }, [token, loadKeys]);

  async function revoke(id: string) {
    if (!token) return;
    await fetch(`${EMBED_KEYS_ENDPOINT}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadKeys();
  }

  const google = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/embed/new` },
    });
  }, [supabase]);

  const magicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supabase) return;
      await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { emailRedirectTo: `${window.location.origin}/embed/new` },
      });
      setSent(true);
    },
    [supabase, loginEmail],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      const allowed_origins = originsRaw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      const r = await fetch(EMBED_KEYS_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, channel, allowed_origins, mode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? 'create failed');
      setCreated(data as Created);
      void loadKeys();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'create failed');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;

  if (!SUPABASE_CONFIGURED) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold">Create an embed</h1>
        <p className="mt-3 text-muted-foreground">
          Signups open shortly. Self-host is free today —{' '}
          <a href="/docs/quickstart" className="text-primary hover:underline">quickstart →</a>
        </p>
      </Shell>
    );
  }

  // ── Not signed in ──
  if (!email) {
    return (
      <Shell>
        <div className="mb-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">mosadd.dev · embed</div>
        <h1 className="font-display text-3xl font-semibold">Sign in to create your embed</h1>
        <p className="mb-8 mt-2 text-muted-foreground">
          One key, paste 6 lines, you have a live chat. Free up to 1,000 monthly chatters.
        </p>
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

  // ── Created ──
  if (created) {
    const ch = created.allowed_channels[0] ?? 'default';
    const snippet = `<div id="mosadd-mirc"
     data-channel="${ch}"
     data-mode="launcher"
     data-launcher-position="br">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="${created.key}">
</script>`;
    return (
      <Shell>
        <div className="mb-6 border border-primary/40 bg-primary/[0.05] p-5">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">✓ Embed created — copy your key now</div>
          <p className="mb-3 text-xs text-muted-foreground">
            The full key is shown only once. Store it where you keep secrets. You can issue a new one later, but
            can&apos;t retrieve this one again.
          </p>
          <code className="block overflow-x-auto break-all border border-border bg-card px-3 py-2 font-mono text-sm text-primary">{created.key}</code>
          <button
            onClick={() => navigator.clipboard?.writeText(created.key)}
            className="mt-3 rounded-none bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Copy key
          </button>
        </div>
        <div className="border border-border p-5">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Paste this on {created.allowed_origins.join(' / ') || 'your site'}
          </div>
          <pre className="overflow-x-auto whitespace-pre border border-border bg-card px-3 py-2 font-mono text-xs text-foreground">{snippet}</pre>
          <button
            onClick={() => navigator.clipboard?.writeText(snippet)}
            className="mt-3 rounded-none border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/50"
          >
            Copy snippet
          </button>
        </div>
        <div className="mt-6 flex gap-3 text-sm">
          <button onClick={() => setCreated(null)} className="text-primary hover:underline">← Back to my embeds</button>
          <Link href="/embed/install" className="text-muted-foreground hover:text-foreground">Install guide →</Link>
        </div>
      </Shell>
    );
  }

  // ── Console: existing keys + create form ──
  return (
    <Shell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your embeds</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <button onClick={() => supabase?.auth.signOut()} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
      </div>

      {keys.length > 0 && (
        <div className="mb-10">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Active keys</div>
          <div className="divide-y divide-border border border-border">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{k.name || '(unnamed)'}</div>
                  <code className="font-mono text-xs text-muted-foreground">{k.pk_prefix}… · #{k.allowed_channels.join(', ') || '—'}</code>
                </div>
                <button onClick={() => revoke(k.id)} className="ml-3 shrink-0 text-xs text-destructive/80 hover:text-destructive">revoke</button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Free tier: 1,000 monthly chatters. <Link href="/pricing" className="text-primary hover:underline">Upgrade →</Link>
          </p>
        </div>
      )}

      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {keys.length > 0 ? 'New embed' : 'Create your first embed'}
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Name (only you see this)</label>
          <input
            type="text" value={name} maxLength={64} onChange={(e) => setName(e.target.value)}
            placeholder="strajkpolski.pl"
            className="w-full rounded-none border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Channel ID</label>
          <input
            type="text" value={channel} maxLength={128} pattern="[A-Za-z0-9_-]{1,128}" required
            onChange={(e) => setChannel(e.target.value)} placeholder="default"
            className="w-full rounded-none border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary/60 focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">Letters, numbers, _ , -. Visitors land in this channel. One channel per key.</p>
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Allowed domains</label>
          <textarea
            value={originsRaw} rows={3} required onChange={(e) => setOriginsRaw(e.target.value)}
            placeholder={'strajkpolski.pl\nwww.strajkpolski.pl\n*.strajkpolski.pl'}
            className="w-full rounded-none border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary/60 focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">One per line (or comma-separated). The embed only works on these. Use *.example.com for subdomains. Max 10.</p>
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Mode</label>
          <div className="flex gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'live'} onChange={() => setMode('live')} />
              <span>Live <code className="text-xs text-muted-foreground">m_pk_live_…</code></span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'test'} onChange={() => setMode('test')} />
              <span>Test <code className="text-xs text-muted-foreground">m_pk_test_…</code></span>
            </label>
          </div>
        </div>
        {err && <div className="border-l-2 border-destructive bg-destructive/5 p-3 text-xs text-destructive">{err}</div>}
        <button
          type="submit" disabled={busy}
          className="rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create embed key'}
        </button>
      </form>
    </Shell>
  );
}
