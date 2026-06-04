/**
 * @mosadd/threat-engine — defensive decision engine.
 *
 * Ported from m0ssad-3 `supabase/functions/threat-engine/index.ts` (the DECK
 * Security Engine). The Edge Function coupled the decision logic to Supabase
 * side-effects (lock identity, suspend DIDs, sign-out). This package extracts
 * the PURE decision — `evaluateEvent(event) → {action, severity, reason}` — so
 * it runs anywhere with NO backend:
 *
 *   - cymru-os evaluates threats locally, off-grid, with no Supabase realtime;
 *   - the Phase 2 hub wraps it in middleware around every MCP tool call.
 *
 * The CALLER executes the returned action (revoke sessions, lock account,
 * suspend DID) against whatever backend it has. This module decides; it never
 * acts. That separation is what makes it portable.
 *
 * Security note (carried from the source): the original Edge Function had a
 * pre-auth account-takeover vuln (any anonymous POST could lock a targeted
 * account). That class of bug is impossible here — this is a pure function
 * with no authority and no side-effects.
 */

export const VERSION = "3.0.0-alpha.4" as const;

/** Defensive actions the engine can recommend. The host executes them. */
export type ThreatAction =
  /** No defensive action — record the telemetry only. */
  | "log_only"
  /** Drop all active sessions for the subject (re-auth required). */
  | "revoke_sessions"
  /** Lock the account (killswitch): block identity + suspend its DIDs + sign out. */
  | "lock_account"
  /** Suspend the subject's phone numbers / DID pool entries only. */
  | "suspend_did";

/** Normalized severity tier of the DECISION (distinct from any input hint). */
export type ThreatSeverity = "info" | "warning" | "critical" | "killswitch";

/** A telemetry event handed to the engine for evaluation. */
export interface ThreatEvent {
  /** Event type, e.g. "SIM_SWAP", "AUTH_BRUTEFORCE", "QOS_DROP". Case-insensitive. */
  eventType: string;
  /**
   * Optional severity hint from the producer. Recognized escalation hints:
   * "killswitch" (→ lock_account) and "critical" (→ revoke_sessions). Any
   * other value is treated as informational and ignored for escalation.
   */
  severity?: string;
  /** Optional free-text context. Echoed into nothing — informational only. */
  details?: string;
}

/** The engine's verdict. Pure data — the caller carries it out. */
export interface ThreatDecision {
  action: ThreatAction;
  severity: ThreatSeverity;
  reason: string;
}

/** Substring triggers, faithful to the source rules (matched upper-cased). */
const KILLSWITCH_TRIGGERS = ["SIM_SWAP", "KERNEL"] as const;
const REVOKE_TRIGGERS = ["SIP_MALFORMED", "AUTH_BRUTEFORCE"] as const;
// Extension beyond the original EF (the ticket lists `suspend_did` as a
// returnable action; the EF only used it as a side-effect of lock_account).
// Conservative carrier-abuse signals that warrant suspending numbers WITHOUT
// locking the whole account.
const SUSPEND_DID_TRIGGERS = ["TOLL_FRAUD", "ROBOCALL", "DID_ABUSE", "CALL_ABUSE"] as const;

function matchesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Evaluate a single telemetry event and recommend a defensive action.
 *
 * Deterministic, side-effect-free, backend-free. Mirrors the m0ssad-3 DECK
 * rules, in priority order:
 *   1. SIM swap / kernel compromise / explicit "killswitch" → lock_account
 *   2. malformed SIP / auth brute-force / explicit "critical" → revoke_sessions
 *   3. carrier/DID abuse signals → suspend_did
 *   4. everything else → log_only
 */
export function evaluateEvent(event: ThreatEvent): ThreatDecision {
  const type = (event.eventType ?? "").toUpperCase();
  const hint = (event.severity ?? "").toLowerCase();

  if (matchesAny(type, KILLSWITCH_TRIGGERS) || hint === "killswitch") {
    return {
      action: "lock_account",
      severity: "killswitch",
      reason: "Critical physical or OS-level compromise detected",
    };
  }

  if (matchesAny(type, REVOKE_TRIGGERS) || hint === "critical") {
    return {
      action: "revoke_sessions",
      severity: "critical",
      reason: "Network or authentication threat detected",
    };
  }

  if (matchesAny(type, SUSPEND_DID_TRIGGERS)) {
    return {
      action: "suspend_did",
      severity: "warning",
      reason: "Carrier/DID abuse detected — suspending numbers",
    };
  }

  return {
    action: "log_only",
    severity: "info",
    reason: "Standard telemetry anomaly",
  };
}
