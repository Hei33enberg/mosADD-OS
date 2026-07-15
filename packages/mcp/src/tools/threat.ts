/**
 * threat_* — defensive threat-event classification, exposed as MCP tools.
 *
 * Wraps `@mosadd/threat-engine` — the canonical mosadd threat-event taxonomy
 * (`THREAT_EVENTS`, the full 160+ event catalog the radar scores against) plus
 * the pure decision engine `evaluateEvent(event) → {action, severity, reason}`.
 *
 * These tools are PURE: deterministic, side-effect-free, no backend, no network.
 * `requires: "any"` — they run anywhere (hosted hub, BYOK, fully offline). The
 * engine DECIDES; the caller carries out any recommended action against its own
 * backend. There is no surveillance, no data collection — it classifies an event
 * the caller already has and returns a defensive recommendation.
 *
 * Founder decision (LINEAR-3498): the catalog is real and must be a real MCP
 * tool, not detoxed away. (The AUDIT-B detox concerns the dead "anti-Pegasus"
 * MARKETING framing, not this classification engine.)
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import {
  THREAT_EVENTS,
  THREAT_EVENT_COUNT,
  evaluateEvent,
  getEventDef,
  type ThreatEventDef,
} from "@mosadd/threat-engine";

// ── threat_catalog ──

const threat_catalog_input = z.object({
  category: z
    .enum(["COMINT", "ELINT", "MASINT", "CYBER", "BEHAVIORAL", "PRIVACY", "SIGINT", "OSINT", "MPOST"])
    .optional()
    .describe("Filter the catalog to one intelligence-discipline category. Omit for the full catalog."),
  platform: z
    .enum(["apk", "ios", "pwa", "harmony"])
    .optional()
    .describe("Filter to events detectable on this platform. Omit for all platforms."),
});

async function threat_catalog(
  input: z.infer<typeof threat_catalog_input>,
  _ctx: MosaddToolContext,
): Promise<{ count: number; total: number; events: ThreatEventDef[] }> {
  let events = THREAT_EVENTS;
  if (input.category) events = events.filter((e) => e.category === input.category);
  if (input.platform) events = events.filter((e) => e.platforms.includes(input.platform!));
  return { count: events.length, total: THREAT_EVENT_COUNT, events };
}

// ── threat_classify ──

const threat_classify_input = z.object({
  event_type: z
    .string()
    .min(1)
    .max(120)
    .describe("Event type to classify, e.g. \"SIM_SWAP\", \"AUTH_BRUTEFORCE\", \"TOLL_FRAUD\". Case-insensitive."),
  severity: z
    .string()
    .optional()
    .describe("Optional producer severity hint. \"killswitch\" → lock_account; \"critical\" → revoke_sessions; anything else is informational."),
  details: z.string().max(2_000).optional().describe("Optional free-text context (informational only)."),
});

async function threat_classify(
  input: z.infer<typeof threat_classify_input>,
  _ctx: MosaddToolContext,
): Promise<{
  action: string;
  severity: string;
  reason: string;
  known_event: boolean;
  category: string | null;
  label: string | null;
}> {
  // Known taxonomy event → surface ITS severity immediately. Pegasus-class events
  // (PROCESS_INJECTION, STINGRAY_DETECT, IMSI_CATCHER_SCAN, MEMORY_INJECTION, SS7_PROBE…)
  // classify as critical/killswitch right away. But the engine NEVER auto-acts:
  // action is always "monitor" — it tells you, it never disconnects, locks, or wipes.
  // The taxonomy's own autoActions are what a stricter host policy COULD do; we do
  // not execute them here ("monitoruje, nie działa").
  const def = getEventDef(String(input.event_type).toUpperCase());
  if (def) {
    return {
      action: "monitor",
      severity: def.severity,
      reason: `${def.label} (${def.category}) — classified from the mosadd threat taxonomy. Monitor-only: surfaced for you to act on, no automatic action taken.`,
      known_event: true,
      category: def.category,
      label: def.label,
    };
  }
  // Unknown event string → fall back to the pure DECK decision engine (unchanged).
  const decision = evaluateEvent({ eventType: input.event_type, severity: input.severity, details: input.details });
  return { ...decision, known_event: false, category: null, label: null };
}

// ── Registration ──

export const threatTools: MosaddTool[] = [
  {
    name: "threat_catalog",
    requires: "any",
    description:
      "List the canonical mosadd threat-event taxonomy (the full radar catalog: id, category, default severity, auto-actions, per-platform availability). Filter by category or platform. Pure/offline — returns { count, total, events }. Use to discover what the defensive engine recognises.",
    inputSchema: threat_catalog_input,
    handler: threat_catalog as MosaddTool["handler"],
  },
  {
    name: "threat_classify",
    requires: "any",
    description:
      "Classify a single telemetry event against the mosadd threat taxonomy + DECK engine. For a known event type (e.g. PROCESS_INJECTION, STINGRAY_DETECT, IMSI_CATCHER_SCAN, MEMORY_INJECTION) it returns that event's real severity (info|warning|elevated|critical|killswitch) with action=\"monitor\" — Pegasus-class events surface as critical immediately, but the engine NEVER auto-acts (it tells you, it never disconnects/locks). Unknown strings fall back to the pure DECK decision (log_only|revoke_sessions|lock_account|suspend_did). Returns { action, severity, reason, known_event, category, label }. Deterministic, offline, no backend.",
    inputSchema: threat_classify_input,
    handler: threat_classify as MosaddTool["handler"],
  },
];
