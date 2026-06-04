'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SITE_URL } from '../../lib/site';
import { BrowserButtons } from '../_components/BrowserButtons';

// Matches the extension content script's probe protocol (lib/content). The
// extension only answers same-origin probes from allowed origins; until the
// extension allowlists this site (wire-up task), detection simply stays false
// and we show the install/open path — which works regardless.
const PING = 'mosadd-channel0:ping';
const PONG = 'mosadd-channel0:pong';

export function JoinController({ domain }: { domain: string }) {
  const [hasExt, setHasExt] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let received = false;
    function onMsg(e: MessageEvent) {
      if (e.source !== window) return;
      if (e.data && typeof e.data === 'object' && e.data.kind === PONG) {
        received = true;
        setHasExt(true);
      }
    }
    window.addEventListener('message', onMsg);
    const t1 = setTimeout(() => window.postMessage({ kind: PING }, window.origin), 50);
    const t2 = setTimeout(() => window.postMessage({ kind: PING }, window.origin), 400);
    const t3 = setTimeout(() => { if (!received) setHasExt(false); }, 1200);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  function copyLink() {
    navigator.clipboard?.writeText(`${SITE_URL}/${domain}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {hasExt === true && (
        <>
          <button
            onClick={() => { window.location.href = `https://${domain}`; }}
            className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open the chat on {domain} →
          </button>
          <span className="self-center text-xs uppercase tracking-[0.15em] text-primary">✓ extension detected</span>
        </>
      )}

      {hasExt !== true && (
        <>
          <BrowserButtons variant="compact" />
          <Link
            href="/"
            className="self-center rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
          >
            What is mURL?
          </Link>
        </>
      )}

      <button
        onClick={copyLink}
        className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
      >
        {copied ? 'copied ✓' : 'copy invite link'}
      </button>
    </div>
  );
}
