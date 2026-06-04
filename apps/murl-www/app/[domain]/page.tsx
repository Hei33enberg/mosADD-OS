import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { normalizeDomain } from '../../lib/domain';
import { TRENDING_URL } from '../../lib/site';
import { JoinController } from './join-client';

interface PageProps { params: Promise<{ domain: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const norm = normalizeDomain(decodeURIComponent(raw));
  if (!norm) return { title: 'mURL' };
  return {
    title: `#${norm.domain}`,
    description: `Live anonymous chat for everyone on ${norm.domain} right now. Join the room — free, no account. Powered by mosADD.`,
    openGraph: {
      title: `#${norm.domain} on mURL`,
      description: `Live anonymous chat for everyone on ${norm.domain} right now.`,
      type: 'website',
    },
  };
}

async function fetchActivity(slug: string): Promise<{ messages: number; status: string } | null> {
  try {
    const r = await fetch(`${TRENDING_URL}?minutes=120`, { cache: 'no-store' });
    if (!r.ok) return null;
    const data = (await r.json()) as { items?: Array<{ slug: string; messages: number; status: string }> };
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
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">mURL · #{norm.domain}</div>
      <h1 className="font-display mt-2 text-4xl font-bold text-foreground md:text-5xl">
        Join the chat for <span className="text-primary">#{norm.domain}</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Live, anonymous chat with everyone who’s on <span className="font-mono">{norm.domain}</span> right now.
        No account, no email — pick a nickname and you’re in. Free, powered by{' '}
        <span className="font-bold text-foreground/80">mos<span className="text-primary">ADD</span></span>.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 rounded-none border border-border bg-card px-4 py-2 text-xs">
        <span className="live-dot" />
        {activity == null && <span className="text-muted-foreground">checking activity…</span>}
        {activity != null && activity.status === 'blocked' && (
          <span className="text-destructive">chat disabled by the website owner</span>
        )}
        {activity != null && activity.status !== 'blocked' && (
          <span className="text-foreground">
            {activity.messages > 0
              ? <><span className="font-mono text-primary">{activity.messages}</span> messages in the last 2 hours</>
              : <>no activity yet — be the first</>}
          </span>
        )}
      </div>

      <JoinController domain={norm.domain} />

      <div className="mt-12 grid gap-6 border-t border-border pt-8 md:grid-cols-3">
        <div>
          <div className="font-display text-sm text-primary">Anonymous</div>
          <p className="mt-1 text-xs text-muted-foreground">No account, no email. A random nickname per install. Browsing never tracked.</p>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Scoped to this site</div>
          <p className="mt-1 text-xs text-muted-foreground">We only see the domain (<span className="font-mono">{norm.domain}</span>), never URLs or page content.</p>
        </div>
        <div>
          <div className="font-display text-sm text-primary">Own this website?</div>
          <p className="mt-1 text-xs text-muted-foreground">Verify ownership and turn the room off for free at <a className="underline" href="https://mosadd.dev/domains">mosadd.dev/domains</a>.</p>
        </div>
      </div>
    </div>
  );
}
