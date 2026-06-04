'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Window-message protocol: the extension's content script (running on this
// page because it injects on <all_urls>) listens for our "ping" and replies
// with a "pong" so we can show "Open extension" instead of "Install".
const MOSADD_EVENT_PING = 'mosadd-murl:ping';
const MOSADD_EVENT_PONG = 'mosadd-murl:pong';

interface Props { domain: string; slug: string }

export function JoinController({ domain }: Props) {
  const [hasExt, setHasExt] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let received = false;
    function onMsg(e: MessageEvent) {
      if (e.data && typeof e.data === 'object' && e.data.kind === MOSADD_EVENT_PONG) {
        received = true;
        setHasExt(true);
      }
    }
    window.addEventListener('message', onMsg);
    // Fire the ping repeatedly for a second — content scripts can mount late.
    const t1 = setTimeout(() => window.postMessage({ kind: MOSADD_EVENT_PING }, '*'), 50);
    const t2 = setTimeout(() => window.postMessage({ kind: MOSADD_EVENT_PING }, '*'), 400);
    const t3 = setTimeout(() => { if (!received) setHasExt(false); }, 1200);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  function copyLink() {
    const url = `https://mosadd.dev/c/${domain}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  function openOnDomain() {
    // Send the user to the actual domain. The extension's content script will
    // mount the chat panel on the destination page automatically.
    window.location.href = `https://${domain}`;
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {hasExt === true && (
        <>
          <button
            onClick={openOnDomain}
            className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open the chat on {domain} →
          </button>
          <span className="self-center text-xs uppercase tracking-[0.15em] text-primary">
            ✓ extension detected
          </span>
        </>
      )}

      {hasExt === false && (
        <>
          <a
            href="https://github.com/Hei33enberg/mosADD-OS/tree/main/apps/channel0-ext"
            target="_blank"
            rel="noreferrer"
            className="rounded-none bg-primary px-5 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Install the extension →
          </a>
          <Link
            href="/murl"
            className="rounded-none border border-border px-5 py-3 text-foreground transition-colors hover:border-primary/50"
          >
            What is mURL?
          </Link>
        </>
      )}

      {hasExt === null && (
        <span className="text-sm text-muted-foreground">checking for the extension…</span>
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
