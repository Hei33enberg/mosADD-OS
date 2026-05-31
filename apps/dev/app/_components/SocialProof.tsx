/**
 * Social-proof bar — integration logos + live stat strip.
 * Server component: pulls the GitHub star count at ISR time (revalidate 1h).
 * Pattern from the Evil Martians "100 devtool landing pages" study: for tools
 * without big customer logos yet, lead with integration compatibility + numbers.
 */
const CLIENTS = [
  'Claude Code',
  'Cursor',
  'Windsurf',
  'Cline',
  'ChatGPT Apps',
  'Vercel AI SDK',
  'LangChain',
];

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
  const stats: Array<{ value: string; label: string }> = [
    { value: '32', label: 'MCP tools' },
    { value: '0', label: 'setup steps' },
    { value: '$0', label: 'to first tool call' },
    ...(stars != null ? [{ value: `${stars}`, label: 'GitHub stars' }] : []),
  ];

  return (
    <section className="border-x border-b border-border px-6 py-6">
      <div className="mb-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Works in every MCP client
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {CLIENTS.map((c) => (
          <span key={c} className="font-display text-sm text-muted-foreground/80">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-border/60 pt-5">
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
