'use client';

import { useState } from 'react';
import posthog from 'posthog-js';

/** Copy-to-clipboard button for code/terminal blocks. Shows ✓ for 1.5s.
 *  Fires a PostHog `install_copy` event — top of the activation funnel
 *  (copy install → quickstart → first tool call). No-op if PostHog unset. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const isInstall = /npx|npm i|mcp add|@mosadd\//.test(text);
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            try {
              posthog.capture?.(isInstall ? 'install_copy' : 'code_copy', { snippet: text.slice(0, 80) });
            } catch {
              /* PostHog not initialized — fine */
            }
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
