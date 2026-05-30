import { describe, expect, it } from "vitest";
import { evaluateEvent, type ThreatDecision } from "../index.js";

describe("@m0ssad/threat-engine — evaluateEvent", () => {
  // ---- Rule 1: killswitch → lock_account ----

  it("locks the account on SIM swap", () => {
    const d = evaluateEvent({ eventType: "SIM_SWAP_DETECTED" });
    expect(d.action).toBe("lock_account");
    expect(d.severity).toBe("killswitch");
  });

  it("locks the account on kernel compromise", () => {
    expect(evaluateEvent({ eventType: "KERNEL_INTEGRITY_FAIL" }).action).toBe("lock_account");
  });

  it("locks the account on an explicit killswitch severity hint", () => {
    expect(evaluateEvent({ eventType: "ANYTHING", severity: "killswitch" }).action).toBe(
      "lock_account",
    );
  });

  // ---- Rule 2: critical → revoke_sessions ----

  it("revokes sessions on malformed SIP", () => {
    const d = evaluateEvent({ eventType: "SIP_MALFORMED_PACKET" });
    expect(d.action).toBe("revoke_sessions");
    expect(d.severity).toBe("critical");
  });

  it("revokes sessions on auth brute-force", () => {
    expect(evaluateEvent({ eventType: "AUTH_BRUTEFORCE" }).action).toBe("revoke_sessions");
  });

  it("revokes sessions on an explicit critical severity hint", () => {
    expect(evaluateEvent({ eventType: "WHATEVER", severity: "critical" }).action).toBe(
      "revoke_sessions",
    );
  });

  // ---- Rule 3: DID abuse → suspend_did ----

  it("suspends DIDs on toll fraud", () => {
    const d = evaluateEvent({ eventType: "TOLL_FRAUD_SPIKE" });
    expect(d.action).toBe("suspend_did");
    expect(d.severity).toBe("warning");
  });

  // ---- Rule 4: default → log_only ----

  it("logs benign telemetry by default", () => {
    const d = evaluateEvent({ eventType: "QOS_DROP", severity: "low" });
    expect(d.action).toBe("log_only");
    expect(d.severity).toBe("info");
  });

  // ---- Properties ----

  it("is case-insensitive on event type", () => {
    expect(evaluateEvent({ eventType: "sim_swap" }).action).toBe("lock_account");
  });

  it("prioritizes killswitch over critical when both could match", () => {
    // KERNEL (killswitch) wins even with a 'critical' hint present.
    expect(evaluateEvent({ eventType: "KERNEL_PANIC", severity: "critical" }).action).toBe(
      "lock_account",
    );
  });

  it("is pure — same input yields identical output, no throwing on empty type", () => {
    const a: ThreatDecision = evaluateEvent({ eventType: "" });
    const b: ThreatDecision = evaluateEvent({ eventType: "" });
    expect(a).toEqual(b);
    expect(a.action).toBe("log_only");
  });
});
