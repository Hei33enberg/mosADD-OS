/**
 * decisionProtocol — the agent-side mirror of the mosADD in-conversation DECISION protocol (T11/T12).
 *
 * An agent / robot / human asks the OTHER party to decide — one or more STEPS, each with several
 * OPTIONS (1:1 with how Claude Code prompts). It rides the existing message pipeline with ZERO
 * backend change: message_type "decision" carries the request, "decision_response" carries the choice.
 * This is the SAME contract the mosADD web app speaks (apps/web/src/lib/decisionProtocol.ts); the
 * agent runtime can't import that across packages, so it carries this equivalent. Agent DMs are
 * PLAINTEXT (base64) — nothing is sealed here; the human client dual-decodes either way.
 */

export const DECISION_TYPE = "decision";
export const DECISION_RESPONSE_TYPE = "decision_response";

export type DecisionTone = "approve" | "reject" | "neutral" | "danger" | "info";
export type IdentityKind = "human" | "agent" | "robot";

export interface DecisionOption {
  key: string;
  label: string;
  tone?: DecisionTone;
  hint?: string;
  irreversible?: boolean;
}
export interface DecisionStep {
  key: string;
  prompt: string;
  multi?: boolean;
  options: DecisionOption[];
}
export interface Decision {
  id: string;
  requester_identity_id?: string | null;
  requester_kind?: IdentityKind;
  allowed_responder_ids?: string[];
  title: string;
  prompt?: string;
  steps: DecisionStep[];
}
export interface DecisionResponse {
  decision_id: string;
  step_key: string;
  option_keys: string[];
  decider_kind?: IdentityKind;
  free_text?: string;
}

export function isDecisionType(t?: string | null): boolean {
  return t === DECISION_TYPE;
}
export function isDecisionResponseType(t?: string | null): boolean {
  return t === DECISION_RESPONSE_TYPE;
}

/** Decode a body that may be a raw JSON string, base64-of-JSON, or an already-parsed object. */
function decodeJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    /* try base64 */
  }
  try {
    const decoded =
      typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("utf8");
    if (decoded) return JSON.parse(decoded);
  } catch {
    /* not base64/json */
  }
  return null;
}

/** Parse a decision REQUEST (tolerant of `{v,type,decision:{…}}` or a bare `{title,steps}`). */
export function parseDecision(raw: unknown): Decision | null {
  const obj = decodeJson(raw);
  if (!obj) return null;
  const d = (obj.decision ?? obj) as Record<string, unknown>;
  if (!d || typeof d !== "object") return null;
  const dSteps = d.steps as unknown;
  if (!Array.isArray(dSteps) || typeof d.title !== "string") return null;
  const steps: DecisionStep[] = dSteps
    .filter((s: any) => s && typeof s.prompt === "string" && Array.isArray(s.options))
    .map((s: any, si: number) => ({
      key: String(s.key ?? `s${si}`),
      prompt: String(s.prompt),
      multi: !!s.multi,
      options: (s.options as any[])
        .filter((o) => o && typeof o.label === "string")
        .map((o, oi) => ({
          key: String(o.key ?? `o${oi}`),
          label: String(o.label),
          tone: o.tone as DecisionTone | undefined,
          hint: typeof o.hint === "string" ? o.hint : undefined,
          irreversible: !!o.irreversible,
        })),
    }))
    .filter((s: DecisionStep) => s.options.length > 0);
  if (steps.length === 0) return null;
  return {
    id: String(d.id ?? ""),
    requester_identity_id: (d.requester_identity_id as string) ?? null,
    requester_kind: d.requester_kind as IdentityKind | undefined,
    allowed_responder_ids: Array.isArray(d.allowed_responder_ids)
      ? (d.allowed_responder_ids as unknown[]).map(String)
      : [],
    title: String(d.title),
    prompt: typeof d.prompt === "string" ? d.prompt : undefined,
    steps,
  };
}

/** Parse a decision RESPONSE (tolerant of `{v,type,response:{…}}` or a bare object). */
export function parseDecisionResponse(raw: unknown): DecisionResponse | null {
  const obj = decodeJson(raw);
  if (!obj) return null;
  const r = (obj.response ?? obj) as Record<string, unknown>;
  if (!r || typeof r !== "object" || typeof r.decision_id !== "string" || typeof r.step_key !== "string")
    return null;
  return {
    decision_id: String(r.decision_id),
    step_key: String(r.step_key),
    option_keys: Array.isArray(r.option_keys) ? (r.option_keys as unknown[]).map(String) : [],
    decider_kind: r.decider_kind as IdentityKind | undefined,
    free_text: typeof r.free_text === "string" ? r.free_text : undefined,
  };
}

export function buildDecisionPayload(decision: Decision): string {
  return JSON.stringify({ v: "mosadd.chat.v1", type: DECISION_TYPE, decision });
}
export function buildDecisionResponsePayload(response: DecisionResponse): string {
  return JSON.stringify({ v: "mosadd.chat.v1", type: DECISION_RESPONSE_TYPE, response });
}

/** base64 of a UTF-8 string — how the plaintext agent lane puts a JSON payload on the wire. */
export function encodeB64Json(str: string): string {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  return Buffer.from(str, "utf8").toString("base64");
}

/** Empty allow-list ⇒ any thread peer EXCEPT the asker. The ONE authority for who may answer. */
export function isAllowedResponder(identityId: string | null | undefined, decision: Decision): boolean {
  if (!identityId) return false;
  const allow = decision.allowed_responder_ids ?? [];
  if (allow.length === 0) return decision.requester_identity_id !== identityId;
  return allow.includes(identityId);
}

/** Pull a decision REQUEST out of an LLM reply that used a fenced ```decision block. */
export function extractDecisionDirective(text: string): Decision | null {
  if (typeof text !== "string" || !text.includes("```")) return null;
  const re = /```(?:decision|json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const inner = (m[1] || "").trim();
    if (!inner) continue;
    const parsed = parseDecision(inner);
    if (parsed) return parsed;
  }
  return null;
}

/** One-line human summary of a decision request, for the agent's own conversation context. */
export function summarizeDecision(decision: Decision | null): string {
  if (!decision) return "[decyzja]";
  const steps = decision.steps
    .map((s) => `${s.prompt} (${s.options.map((o) => o.label).join(" / ")})`)
    .join(" | ");
  return `[decyzja] ${decision.title}: ${steps}`;
}

/** One-line human summary of an answer, resolving option keys → labels against the request. */
export function summarizeResponse(
  response: DecisionResponse | null,
  decision: Decision | null | undefined,
): string {
  if (!response) return "[odpowiedź na decyzję]";
  const step = decision?.steps?.find((s) => s.key === response.step_key);
  const labels = response.option_keys.map((k) => step?.options?.find((o) => o.key === k)?.label ?? k);
  const chosen = labels.length ? labels.join(", ") : response.free_text || "(brak)";
  const q = step ? step.prompt : response.step_key;
  return `[odpowiedź na decyzję] wybrał: ${chosen} — na pytanie: ${q}`;
}
