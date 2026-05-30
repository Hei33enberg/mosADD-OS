import type { ReactNode } from 'react';

/**
 * Terminal — a brutalist command block: pure-black surface, neon-green `$`
 * prompt, JetBrains Mono. Used for install snippets across the portal.
 */
export function Terminal({
  children,
  label = 'shell',
  prompt = '$',
}: {
  children: ReactNode;
  label?: string;
  prompt?: string;
}) {
  return (
    <div className="relative border border-border bg-card/60">
      {/* title bar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-none bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-none bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-none bg-primary/60" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-foreground">
        <code>
          <span className="select-none text-primary">{prompt} </span>
          {children}
        </code>
      </pre>
    </div>
  );
}
