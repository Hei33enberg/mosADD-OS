'use client';

import { useState } from 'react';

/** Copy-to-clipboard button for code/terminal blocks. Shows ✓ for 1.5s. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          },
          () => {},
        );
      }}
      className="rounded-none border border-border bg-background/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {copied ? '✓ copied' : 'copy'}
    </button>
  );
}
