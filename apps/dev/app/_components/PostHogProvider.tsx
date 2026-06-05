'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

/**
 * Env-gated PostHog analytics.
 *
 * Initializes only when NEXT_PUBLIC_POSTHOG_KEY is set, so the portal ships
 * with telemetry wired but DARK until a dedicated mosadd PostHog project key
 * is provided in Vercel. (The only currently-connected PostHog project
 * belongs to a separate product — we deliberately do not route mosadd
 * traffic there.) Flip it on later with one env var, zero code change.
 *
 * Vercel Web Analytics runs independently via <Analytics/> in layout.tsx.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let initialized = false;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY) return;
    if (!initialized) {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false, // we send manual pageviews below (App Router)
        capture_pageleave: true,
        person_profiles: 'identified_only',
      });
      initialized = true;
    }
  }, []);

  useEffect(() => {
    if (!KEY || !initialized) return;
    const url = window.origin + pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
