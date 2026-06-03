'use client';

import { useState } from 'react';
import Link from 'next/link';

const VERIFY_URL = 'https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/domain-verify';

interface ChallengeResponse {
  domain: string;
  status: 'challenge' | 'verify_failed' | 'verified' | 'not_verified' | 'verification_lost' | 'blocked' | 'open';
  hostname: string;
  txt_value: string;
  record: string;
  reason?: string;
  dns_found?: string[];
  verified_at?: string | null;
}

async function postVerify(body: { domain: string; action: 'challenge' | 'verify' | 'disable' | 'open'; owner_email?: string }): Promise<{ res: Response; data: ChallengeResponse }> {
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ChallengeResponse;
  return { res, data };
}

function normalizeDomainInput(s: string): string {
  let t = s.trim().toLowerCase();
  t = t.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  return t;
}

export default function DomainsPage() {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'challenge' | 'verified' | 'blocked' | 'open' | 'err'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function startChallenge() {
    setErr(null);
    const d = normalizeDomainInput(domain);
    if (!d.includes('.')) { setErr('Enter a valid domain (e.g. zalando.pl)'); return; }
    setDomain(d);
    setPhase('loading');
    try {
      const { res, data } = await postVerify({ domain: d, action: 'challenge' });
      if (!res.ok) { setErr(data?.reason ?? `HTTP ${res.status}`); setPhase('err'); return; }
      setData(data);
      setPhase('challenge');
    } catch (e) {
      setErr(String(e)); setPhase('err');
    }
  }

  async function runVerify() {
    if (!data) return;
    setErr(null);
    setPhase('loading');
    try {
      const { res, data: nd } = await postVerify({ domain: data.domain, action: 'verify', owner_email: email || undefined });
      setData(nd);
      if (res.ok && nd.status === 'verified') {
        setPhase('verified');
      } else if (nd.dns_found && nd.dns_found.length === 0) {
        setErr('No TXT record found yet. DNS propagation can take a few minutes — try again shortly.');
        setPhase('challenge');
      } else {
        setErr(nd.reason ?? `Unexpected status: ${nd.status}`);
        setPhase('challenge');
      }
    } catch (e) {
      setErr(String(e)); setPhase('err');
    }
  }

  async function mutate(action: 'disable' | 'open') {
    if (!data) return;
    setErr(null);
    setPhase('loading');
    try {
      const { res, data: nd } = await postVerify({ domain: data.domain, action });
      setData(nd);
      if (res.ok) setPhase(nd.status === 'blocked' ? 'blocked' : 'open');
      else { setErr(nd.reason ?? `HTTP ${res.status}`); setPhase('verified'); }
    } catch (e) {
      setErr(String(e)); setPhase('err');
    }
  }

  function reset() {
    setData(null); setPhase('idle'); setErr(null); setDomain(''); setEmail('');
  }

  function copyRecord() {
    if (!data) return;
    navigator.clipboard.writeText(data.record).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">channel 0 [mIRC] · domains</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Claim your domain</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
        Prove ownership of a domain via DNS TXT and you can disable the channel 0 chat on it for free,
        or claim it for branding (coming soon). Verification is at the apex —{' '}
        <span className="font-mono">_mosadd-channel0.&lt;domain&gt;</span>.
      </p>

      {phase === 'idle' && (
        <div className="mt-10 rounded-none border border-border p-6">
          <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">Your domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') startChallenge(); }}
            placeholder="e.g. zalando.pl"
            className="mt-2 w-full rounded-none border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            onClick={startChallenge}
            disabled={!domain.trim()}
            className="mt-4 rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Get DNS record →
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className="mt-10 text-sm text-muted-foreground">working…</div>
      )}

      {(phase === 'challenge' || phase === 'verified' || phase === 'blocked' || phase === 'open') && data && (
        <div className="mt-10 space-y-6">
          <div className="rounded-none border border-border p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">domain</div>
            <div className="font-mono text-lg text-foreground">{data.domain}</div>
            {data.verified_at && (
              <div className="mt-2 text-xs uppercase tracking-[0.15em] text-primary">
                ✓ Verified · {new Date(data.verified_at).toISOString().slice(0, 10)} · status: {data.status}
              </div>
            )}
          </div>

          <div className="rounded-none border border-border p-6">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">1. Add this DNS TXT record</div>
            <pre className="overflow-x-auto rounded-none border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground">
{data.record}
            </pre>
            <button
              onClick={copyRecord}
              className="mt-3 rounded-none border border-border px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-foreground hover:border-primary/50"
            >
              {copied ? 'copied ✓' : 'copy record'}
            </button>
            <div className="mt-4 text-xs text-muted-foreground">
              Host: <span className="font-mono text-foreground">{data.hostname}</span><br />
              Type: <span className="font-mono text-foreground">TXT</span><br />
              Value: <span className="font-mono text-foreground">{data.txt_value}</span>
            </div>
          </div>

          {!data.verified_at && (
            <div className="rounded-none border border-border p-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">2. Verify</div>
              <p className="text-sm text-muted-foreground">
                After adding the record above, click verify. DNS propagation usually takes &lt;5 min.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email (optional — for abuse contact)"
                className="mt-3 w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                onClick={runVerify}
                className="mt-3 rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Verify ownership →
              </button>
              {err && <div className="mt-3 text-xs text-destructive">{err}</div>}
            </div>
          )}

          {data.verified_at && (
            <div className="rounded-none border border-primary/40 p-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">3. Channel state</div>
              {data.status === 'blocked' ? (
                <>
                  <p className="text-sm text-foreground">
                    Channel 0 is <span className="text-destructive font-semibold">disabled</span> on{' '}
                    <span className="font-mono">{data.domain}</span>. Visitors with the extension see HTTP 451.
                  </p>
                  <button
                    onClick={() => mutate('open')}
                    className="mt-3 rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
                  >
                    Re-open channel
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    Channel 0 is currently <span className="text-primary font-semibold">open</span> on{' '}
                    <span className="font-mono">{data.domain}</span>. Anyone who opens the extension on this
                    domain joins the chat.
                  </p>
                  <button
                    onClick={() => mutate('disable')}
                    className="mt-3 rounded-none bg-destructive px-5 py-3 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    Disable channel on {data.domain}
                  </button>
                </>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                Removing the TXT record removes your verification on the next mutating call.
                Branded &ldquo;official&rdquo; channels with theme + pinned message + analytics are a paid tier — coming soon.
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
          >
            ← Check another domain
          </button>
        </div>
      )}

      {phase === 'err' && (
        <div className="mt-10 rounded-none border border-destructive p-6">
          <div className="text-sm text-destructive">{err}</div>
          <button onClick={reset} className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">← Try again</button>
        </div>
      )}

      <div className="mt-16 grid gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:grid-cols-3">
        <div>
          <div className="font-display text-sm text-primary">Free</div>
          <div className="mt-1">Disable the channel on your domain. Verified owners only.</div>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Paid (soon)</div>
          <div className="mt-1">Branded &ldquo;official&rdquo; tier: theme, pinned message, official badge, analytics.</div>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Source</div>
          <div className="mt-1">
            <Link className="underline" href="/channel0">/channel0</Link> · <Link className="underline" href="/channel0/privacy">privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
