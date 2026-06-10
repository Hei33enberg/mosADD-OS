/**
 * Social-proof bar — integration logos + live stat strip.
 * Server component: pulls the GitHub star count at ISR time (revalidate 1h).
 * Pattern from the Evil Martians "100 devtool landing pages" study: for tools
 * without big customer logos yet, lead with integration compatibility + numbers.
 */
import { ClientLogos } from './ClientLogos';

async function getStars(): Promise<number | null> {
  try {
    const res = await fetch('https://api.github.com/repos/Hei33enberg/mosadd-os', {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { stargazers_count?: number };
    return typeof j.stargazers_count === 'number' ? j.stargazers_count : null;
  } catch {
    return null;
  }
}

export async function SocialProof() {
  const stars = await getStars();
  // No tool-count here — the hero already carries it. Keep these distinct.
  const stats: Array<{ value: string; label: string }> = [
    { value: '0', label: 'setup steps' },
    { value: '$0', label: 'to first tool call' },
    { value: 'Apache-2.0', label: 'open source' },
    ...(stars != null && stars > 0 ? [{ value: `${stars}`, label: stars === 1 ? 'GitHub star' : 'GitHub stars' }] : []),
  ];

  return (
    <section className="py-10">
      <div className="mb-5 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Works in every MCP client
      </div>
      {/* Compatibility wall — real client logos (monochrome, currentColor). */}
      <ClientLogos />
      <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <span className="font-display text-xl text-primary">{s.value}</span>
            <span className="ml-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
