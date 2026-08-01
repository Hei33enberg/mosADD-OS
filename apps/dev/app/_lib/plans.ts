/**
 * Canonical mosadd.dev plan definitions — the single source of truth for what
 * the customer-facing surfaces (/hub, /pricing, /embed) DISPLAY and what the
 * hosted hub bills. Mirrors the backend constant
 * `supabase/functions/_shared/account-tiers.ts` (MAT caps + prices + overage).
 * Keep the two in sync — if you change a number here, change it there.
 *
 * MAT = Monthly Active Thread-action: one delivered, end-to-end-encrypted,
 * threat-scored message/action, deduplicated per sender per calendar month.
 * Numbers match `report-mat-overage` (TIER_MAT_CAP) + the pricing page.
 *
 * REPRICED 2026-06-18 (LINEAR-3406, founder-approved): Pro 9→19, Team 29→49 —
 * supersedes the 2026-06-03 lock (LINEAR-3102). This file drifted and kept
 * displaying the OLD $9/$29 while billing charged $19/$49 — a charge-vs-display
 * mismatch (audit LINEAR-5066 B-10). Founder decision 2026-08-01: $19/$49 is
 * correct; display now mirrors `account-tiers.ts` exactly, quotas included.
 */

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise';

export interface Plan {
  id: PlanId;
  label: string;
  /** Monthly price in USD. null = custom (enterprise). */
  priceUsd: number | null;
  /** Display price string, e.g. "$0", "$9/mo", "Custom". */
  price: string;
  /** MAT cap / month. null = unlimited. */
  mat: number | null;
  /** Outbound messages / month. null = unlimited. */
  messages: number | null;
  /** RAG searches / month. 0 = off. null = unlimited. */
  ragSearches: number | null;
  /** Included embed keys. null = unlimited. */
  embedKeys: number | null;
  /** Included hub (MCP) keys. null = unlimited. */
  hubKeys: number | null;
  /** White-label — "powered by mosadd" badge off by default. */
  whiteLabel: boolean;
}

/** $ charged per extra MAT once a paid plan is over its cap (PAYG). */
export const OVERAGE_RATE_USD = 0.001;
/** Default hard monthly spend cap = this × plan price ("billing stops here"). */
export const SPEND_CAP_MULTIPLIER = 2;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free', label: 'Free', priceUsd: 0, price: '$0',
    mat: 1_000, messages: 2_000, ragSearches: 50,
    embedKeys: 1, hubKeys: 1, whiteLabel: false,
  },
  pro: {
    id: 'pro', label: 'Pro', priceUsd: 19, price: '$19/mo',
    mat: 10_000, messages: 50_000, ragSearches: 1_000,
    embedKeys: 5, hubKeys: 5, whiteLabel: false,
  },
  team: {
    id: 'team', label: 'Team', priceUsd: 49, price: '$49/mo',
    mat: 100_000, messages: 500_000, ragSearches: 10_000,
    embedKeys: null, hubKeys: null, whiteLabel: true,
  },
  enterprise: {
    id: 'enterprise', label: 'Enterprise', priceUsd: null, price: 'Custom',
    mat: null, messages: null, ragSearches: null,
    embedKeys: null, hubKeys: null, whiteLabel: true,
  },
};

/** Resolve an arbitrary stored plan string to a known Plan (defaults Free). */
export function getPlan(plan: string | null | undefined): Plan {
  return PLANS[(plan as PlanId)] ?? PLANS.free;
}

/** Default monthly spend cap (USD) for a plan = 2× price. 0 for free/enterprise. */
export function defaultSpendCapUsd(plan: string | null | undefined): number {
  const p = getPlan(plan);
  return p.priceUsd ? p.priceUsd * SPEND_CAP_MULTIPLIER : 0;
}

/** Human display for a limit number (handles unlimited). */
export function fmtLimit(n: number | null): string {
  return n == null ? '∞' : n.toLocaleString();
}
