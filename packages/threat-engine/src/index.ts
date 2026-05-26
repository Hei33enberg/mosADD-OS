/**
 * @m0ssad/threat-engine — 167-event threat taxonomy + scoring
 *
 * Categories: SIGINT, COMINT, MASINT, CYBER, BEHAVIORAL, PRIVACY, ELINT, OSINT, MPOST.
 * Severity tiers: GREEN, YELLOW, ORANGE, RED, BLACK.
 * Severity → action: log, alert_user, alert + sampling, disconnect/destroy, wipe_account.
 *
 * The kernel-level security primitive. Phase 2 hub wraps this in middleware
 * around every MCP tool call and feeds it threat intel feeds (Spamhaus, HIBP,
 * carrier shared bad-number lists, Anthropic prompt injection benchmark).
 *
 * Phase 1 MVP: types + scoring. Ports the taxonomy from m0ssad-3/lib/threatEvents.ts.
 */

export const VERSION = "3.0.0-alpha.0" as const;
