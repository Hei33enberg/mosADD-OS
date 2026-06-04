'use client';

import { useState } from 'react';

/** Minimal terminal-style code block with a copy button (dev pages). */
export function CodeBlock({ label, children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden border border-border bg-card/60">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-primary/70" />
          {label ? <span className="ml-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="rounded-none border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-foreground"><code>{children}</code></pre>
    </div>
  );
}
