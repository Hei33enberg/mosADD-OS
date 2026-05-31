'use client';

import { useState } from 'react';
import posthog from 'posthog-js';

/**
 * Hosted-hub waitlist — demand capture.
 *
 * v1 records intent two ways, both no-op-safe:
 *  - PostHog `waitlist_signup` event + person prop (lights up once the mosadd
 *    PostHog key is set in Vercel; harmless before that).
 *  - Optional durable POST to NEXT_PUBLIC_WAITLIST_ENDPOINT (the m0ssad-3
 *    `hub-waitlist` edge function, once the owner deploys it). If unset/failing
 *    we still show success — the PostHog event is the floor.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT;

export function WaitlistForm({ source = 'pricing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState('error');
      return;
    }
    setState('loading');
    try {
      posthog.capture?.('waitlist_signup', { email, company, source });
      posthog.identify?.(email, { email, company, waitlist_source: source });
    } catch {
      /* PostHog not initialized yet — fine */
    }
    if (ENDPOINT) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, company, source }),
        });
      } catch {
        /* durable store optional; PostHog event already fired */
      }
    }
    setState('done');
  }

  if (state === 'done') {
    return (
      <div className="rounded-none border border-primary/40 bg-primary/[0.05] px-4 py-3 text-sm text-primary">
        ✓ You&apos;re on the list. We&apos;ll email you when the hosted hub opens.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        aria-label="Work email"
        className="flex-1 rounded-none border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
      />
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="company (optional)"
        aria-label="Company"
        className="rounded-none border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none sm:w-40"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {state === 'loading' ? '…' : 'Join waitlist →'}
      </button>
      {state === 'error' ? (
        <span className="self-center text-xs text-destructive">Enter a valid email.</span>
      ) : null}
    </form>
  );
}
