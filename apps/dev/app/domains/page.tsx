'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Local-only "your verified domains" memory (C1 / LINEAR-3152). domain-verify
// is anonymous, so there's no server-side "owner" record we can query by
// account. We track here in the browser any domain this user has successfully
// verified, so /domains stops being a one-at-a-time tool.
const DOMAINS_STORAGE_KEY = 'mosadd:my-domains';
interface VerifiedDomain { domain: string; verified_at: string; status: string }
function loadVerifiedDomains(): VerifiedDomain[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DOMAINS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d): d is VerifiedDomain => d && typeof d.domain === 'string');
  } catch { return []; }
}
function persistVerifiedDomain(d: VerifiedDomain) {
  if (typeof window === 'undefined') return;
  try {
    const all = loadVerifiedDomains().filter((x) => x.domain !== d.domain);
    all.unshift(d);
    window.localStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
  } catch { /* quota / disabled — best-effort */ }
}
function forgetVerifiedDomain(domain: string) {
  if (typeof window === 'undefined') return;
  try {
    const all = loadVerifiedDomains().filter((x) => x.domain !== domain);
    window.localStorage.setItem(DOMAINS_STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const VERIFY_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/domain-verify` : '';

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

interface BrandingPayload {
  accent_color?: string;
  pinned_message?: string;
  official_badge?: boolean;
  owner_name?: string;
}

async function postVerify(body: { domain: string; action: 'challenge' | 'verify' | 'disable' | 'open' | 'brand'; owner_email?: string; branding?: BrandingPayload }): Promise<{ res: Response; data: ChallengeResponse & { branding?: BrandingPayload } }> {
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ChallengeResponse & { branding?: BrandingPayload };
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
  const [myDomains, setMyDomains] = useState<VerifiedDomain[]>([]);
  useEffect(() => { setMyDomains(loadVerifiedDomains()); }, []);
  useEffect(() => {
    if (data && data.verified_at && (data.status === 'verified' || data.status === 'blocked' || data.status === 'open')) {
      persistVerifiedDomain({ domain: data.domain, verified_at: data.verified_at, status: data.status });
      setMyDomains(loadVerifiedDomains());
    }
  }, [data]);

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

  async function saveBranding(branding: BrandingPayload) {
    if (!data) return;
    setErr(null);
    setPhase('loading');
    try {
      const { res, data: nd } = await postVerify({ domain: data.domain, action: 'brand', branding });
      setData(nd as ChallengeResponse);
      setPhase(nd.status === 'blocked' ? 'blocked' : (nd.status === 'open' ? 'open' : 'verified'));
    } catch (e) { setErr(String(e)); setPhase('err'); }
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
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · domains</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground">Claim your domain</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
        Prove ownership of a domain via DNS TXT and you can disable the mURL chat on it — or brand it
        (theme, pinned message, official badge), free for verified owners. Verification is at the apex —{' '}
        <span className="font-mono">_mosadd-murl.&lt;domain&gt;</span>.
      </p>

      {phase === 'idle' && myDomains.length > 0 && (
        <div className="mt-10 rounded-none border border-border p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your verified domains</h2>
            <span className="text-[11px] text-muted-foreground/70">{myDomains.length}</span>
          </div>
          <div className="divide-y divide-border">
            {myDomains.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 py-2 text-xs">
                <span className="font-mono text-foreground truncate" title={d.domain}>{d.domain}</span>
                <span className={`uppercase tracking-[0.15em] text-[10px] ${d.status === 'blocked' ? 'text-destructive' : d.status === 'open' ? 'text-muted-foreground' : 'text-primary'}`}>
                  {d.status}
                </span>
                <span className="text-muted-foreground">verified {new Date(d.verified_at).toISOString().slice(0, 10)}</span>
                <div className="ml-auto flex gap-2">
                  <Link
                    href={`/domains/${encodeURIComponent(d.domain)}/stats`}
                    className="rounded-none border border-border px-2 py-1 text-[11px] hover:border-primary/60 hover:text-primary"
                  >
                    Stats
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setDomain(d.domain); startChallenge(); }}
                    className="rounded-none border border-border px-2 py-1 text-[11px] hover:border-primary/60 hover:text-primary"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => { forgetVerifiedDomain(d.domain); setMyDomains(loadVerifiedDomains()); }}
                    className="rounded-none border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Remove from this list — does not affect server-side verification."
                  >
                    Forget
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground/80">
            Stored locally in this browser. Verification itself lives on the server.
          </p>
        </div>
      )}

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
                    mURL is <span className="text-destructive font-semibold">disabled</span> on{' '}
                    <span className="font-mono">{data.domain}</span>. Visitors with the extension see HTTP 451.
                  </p>
                  <button
                    onClick={() => mutate('open')}
                    className="mt-3 rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
                  >
                    Re-open mURL
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    mURL is currently <span className="text-primary font-semibold">open</span> on{' '}
                    <span className="font-mono">{data.domain}</span>. Anyone who opens the extension on this
                    domain joins the mURL chat.
                  </p>
                  <button
                    onClick={() => mutate('disable')}
                    className="mt-3 rounded-none bg-destructive px-5 py-3 font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    Disable mURL on {data.domain}
                  </button>
                </>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                Removing the TXT record drops your verification on the next mutating call.
              </div>
            </div>
          )}

          {data.verified_at && (
            <BrandingPanel
              current={(data as ChallengeResponse & { branding?: BrandingPayload }).branding ?? {}}
              onSave={saveBranding}
            />
          )}

          {data.verified_at && (
            <div className="rounded-none border border-border p-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">5. Analytics · free</div>
              <p className="text-xs text-muted-foreground">
                Message count, unique senders, hourly distribution for the last 24h + 7d. Owner-only.
              </p>
              <a
                href={`/domains/${data.domain}/stats`}
                className="mt-3 inline-block rounded-none border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50"
              >
                View analytics →
              </a>
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
          <div className="mt-1">Disable the mURL room on your domain. Verified owners only.</div>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Free for verified owners</div>
          <div className="mt-1">Branded &ldquo;official&rdquo; tier: theme, pinned message, official badge, analytics.</div>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Source</div>
          <div className="mt-1">
            <Link className="underline" href="/murl">/murl</Link> · <Link className="underline" href="/murl/privacy">privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Branding panel (C2-2). Free for verified owners (no Stripe in MVP). ──
function BrandingPanel({ current, onSave }: { current: BrandingPayload; onSave: (b: BrandingPayload) => void }) {
  const [accent, setAccent] = useState(current.accent_color ?? '#00ff7a');
  const [pinned, setPinned] = useState(current.pinned_message ?? '');
  const [owner, setOwner]   = useState(current.owner_name ?? '');
  const [badge, setBadge]   = useState(current.official_badge ?? false);
  const [saved, setSaved]   = useState(false);

  const dirty =
    accent !== (current.accent_color ?? '#00ff7a') ||
    pinned !== (current.pinned_message ?? '') ||
    owner  !== (current.owner_name ?? '') ||
    badge  !== (current.official_badge ?? false);

  return (
    <div className="rounded-none border border-border p-6">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">4. Brand your channel · free</div>
      <p className="text-xs text-muted-foreground">
        Theme color, pinned message, official badge. Visible to everyone who joins the mURL chat on your domain.
        Free for verified owners — no Stripe in MVP.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">Accent color</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-none border border-border bg-background"
            />
            <span className="font-mono text-xs text-muted-foreground">{accent}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">Owner name (for badge tooltip)</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value.slice(0, 64))}
            placeholder="e.g. Zalando SE"
            className="mt-2 w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">Pinned message (max 280)</label>
        <textarea
          value={pinned}
          onChange={(e) => setPinned(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="e.g. Welcome to our community room. Be kind. Be helpful."
          className="mt-2 w-full resize-y rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{pinned.length}/280</div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          id="badge"
          type="checkbox"
          checked={badge}
          onChange={(e) => setBadge(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <label htmlFor="badge" className="text-sm text-foreground">Show <span className="font-mono text-primary">OFFICIAL</span> badge in the mURL chat header</label>
      </div>

      <button
        disabled={!dirty}
        onClick={() => { onSave({ accent_color: accent, pinned_message: pinned, owner_name: owner, official_badge: badge }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
        className="mt-4 rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
      >
        {saved ? 'saved ✓' : 'Save branding'}
      </button>
    </div>
  );
}
