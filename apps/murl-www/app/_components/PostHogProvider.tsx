'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

/**
 * Env-gated PostHog analytics for the mURL consumer funnel (install → first-join).
 * Dark until NEXT_PUBLIC_POSTHOG_KEY is set in Vercel. Vercel Web Analytics runs
 * independently via <Analytics/> in layout.tsx.
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
        capture_pageview: false,
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
