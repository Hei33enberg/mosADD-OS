import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JoinController } from './join-client';

// ── Domain normalization (server-side mirror of the extension's lib/domain.ts) ──
const MULTIPART_TLDS = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'co.in', 'net.in', 'org.in', 'gov.in',
  'com.mx', 'com.ar', 'com.tr', 'com.sg', 'com.hk', 'com.tw', 'com.cn',
  'co.za', 'co.kr', 'co.il', 'or.kr',
]);
const STRIPPABLE = ['www.', 'm.', 'mobile.', 'amp.'];

function normalizeDomain(input: string): { domain: string; slug: string } | null {
  if (!input) return null;
  let host = input.trim().toLowerCase();
  try {
    // Accept both raw "zalando.pl" and full URLs.
    if (host.includes('://')) host = new URL(host).hostname.toLowerCase();
  } catch { return null; }
  if (!host || host === 'localhost' || /^[0-9.]+$/.test(host) || host.includes(':')) return null;
  for (const p of STRIPPABLE) { if (host.startsWith(p)) { host = host.slice(p.length); break; } }
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  const domain = (parts.length >= 3 && MULTIPART_TLDS.has(last2)) ? last3 : last2;
  if (!/^[a-z0-9.-]{1,253}$/.test(domain)) return null;
  const slug = domain.replace(/\./g, '-');
  if (!/^[a-z0-9-]{1,128}$/.test(slug)) return null;
  return { domain, slug };
}

interface PageProps { params: Promise<{ domain: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const norm = normalizeDomain(decodeURIComponent(raw));
  if (!norm) return { title: 'mURL' };
  return {
    title: `#${norm.domain} · mURL`,
    description: `Live anonymous chat for everyone on ${norm.domain} right now. Join the room. Powered by mosadd.`,
    openGraph: {
      title: `#${norm.domain} on mURL`,
      description: `Live anonymous chat for everyone on ${norm.domain} right now.`,
      type: 'website',
    },
  };
}

async function fetchActivity(slug: string): Promise<{ messages: number; status: string } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    const r = await fetch(`${supabaseUrl}/functions/v1/murl-trending?minutes=60`, {
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const data = await r.json() as { items: Array<{ slug: string; messages: number; status: string }> };
    const hit = data.items?.find((i) => i.slug === slug);
    return hit ? { messages: hit.messages, status: hit.status } : { messages: 0, status: 'open' };
  } catch { return null; }
}

export default async function ChannelLanding({ params }: PageProps) {
  const { domain: raw } = await params;
  const norm = normalizeDomain(decodeURIComponent(raw));
  if (!norm) notFound();

  const activity = await fetchActivity(norm.slug);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      {/* Hero */}
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        mURL · #{norm.domain}
      </div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground md:text-5xl">
        Join the chat for{' '}
        <span className="text-primary">#{norm.domain}</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Live anonymous chat with everyone who&apos;s on{' '}
        <span className="font-mono">{norm.domain}</span> right now. No account, no email — just
        pick a nick and you&apos;re in. Powered by{' '}
        <Link className="text-primary underline" href="/">mosadd</Link>.
      </p>

      {/* Activity strip */}
      <div className="mt-6 inline-flex items-center gap-3 rounded-none border border-border bg-card px-4 py-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
        {activity == null && (
          <span className="text-muted-foreground">checking activity…</span>
        )}
        {activity != null && activity.status === 'blocked' && (
          <span className="text-destructive">chat disabled by domain owner</span>
        )}
        {activity != null && activity.status !== 'blocked' && (
          <span className="text-foreground">
            {activity.messages > 0
              ? <><span className="font-mono text-primary">{activity.messages}</span> messages in the last 60 min</>
              : <>no activity yet — be the first</>}
          </span>
        )}
      </div>

      {/* Join controller (client) */}
      <JoinController domain={norm.domain} slug={norm.slug} />

      {/* Privacy reassurance */}
      <div className="mt-12 grid gap-6 border-t border-border pt-8 md:grid-cols-3">
        <div>
          <div className="font-display text-sm text-primary">Anonymous</div>
          <p className="mt-1 text-xs text-muted-foreground">
            No account. No email. Random nick generated per install. No browsing tracked.
          </p>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Scoped to this domain</div>
          <p className="mt-1 text-xs text-muted-foreground">
            We only see the domain you&apos;re on (<span className="font-mono">{norm.domain}</span>),
            never URLs or page content.
          </p>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Own this domain?</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Verify ownership via DNS and disable the channel for free at{' '}
            <Link className="underline" href="/domains">/domains</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
