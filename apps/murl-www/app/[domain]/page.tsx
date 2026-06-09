import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { normalizeDomain } from '../../lib/domain';
import { TRENDING_URL, MURL_CHANNELS_URL } from '../../lib/site';
import { JoinController } from './join-client';

interface PageProps { params: Promise<{ domain: string }> }

// ISR: render once, refresh activity at most every 30s instead of hitting the
// trending edge fn on every single visit (N+1 under load).
export const revalidate = 30;

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
    // 5s timeout so a slow/down edge fn never hangs the server render; cached 30s.
    const r = await fetch(`${TRENDING_URL}?minutes=120`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { items?: Array<{ slug: string; messages: number; status: string }> };
    const hit = data.items?.find((i) => i.slug === slug);
    return hit ? { messages: hit.messages, status: hit.status } : { messages: 0, status: 'open' };
  } catch { return null; }
}

/** BM-5 Phase 2.5: the room's brand color (owner accent_color > seeded auto_brand),
 *  so the landing wears the same accent as the in-chat panel. Null = keep default. */
async function fetchBrandAccent(slug: string): Promise<string | null> {
  try {
    const r = await fetch(MURL_CHANNELS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'domain', slug }),
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { channel?: { branding?: { accent_color?: unknown; auto_brand?: { accent?: unknown } } } | null };
    const b = d.channel?.branding;
    const owner = typeof b?.accent_color === 'string' ? b.accent_color : null;
    const seeded = typeof b?.auto_brand?.accent === 'string' ? b.auto_brand.accent : null;
    const accent = owner ?? seeded;
    return accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : null;
  } catch { return null; }
}

/** Brand hex → "H S% L%" so it can drive the site's `--primary` HSL token. */
function hexToHslTriplet(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default async function ChannelLanding({ params }: PageProps) {
  const { domain: raw } = await params;
  const norm = normalizeDomain(decodeURIComponent(raw));
  if (!norm) notFound();

  const [activity, accent] = await Promise.all([fetchActivity(norm.slug), fetchBrandAccent(norm.slug)]);
  // Tint only the accent token (--primary); the rest of the page stays mURL.
  const hsl = accent ? hexToHslTriplet(accent) : null;
  const brandStyle = hsl ? ({ '--primary': hsl } as CSSProperties) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14" style={brandStyle}>
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
        {activity == null && <span className="text-muted-foreground">live activity unavailable right now</span>}
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
