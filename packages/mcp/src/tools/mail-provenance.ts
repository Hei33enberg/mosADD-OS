/**
 * mp0st provenance — agent-attributed email send.
 *
 * The plain `mp0st_send` (mail.ts) sends as the USER. When an AGENT sends mail on
 * the user's behalf, the recipient (and the audit trail) should be able to tell
 * it was agent-originated. Per the Lane A contract, `mp0st-send`, when called
 * with a HUB-CLAIM JWT, stamps the row with:
 *   sent_by = 'agent', sent_by_agent_id, sent_by_task_id
 *
 * This tool mints/forwards that hub-claim JWT and sets the provenance fields.
 *
 * AUTH MODEL (differs from the rest of mp0st):
 *   - mp0st_send uses the user's Supabase session JWT (via invokeFunction).
 *   - mp0st_send_as_agent presents a HUB-CLAIM JWT (hub key → claim exchange) so
 *     mp0st-send can attribute the send to the agent/task.
 *
 * STATUS: scaffold. The hub-claim exchange endpoint is assumed (TODO Lane A —
 * confirm the exact route + claim shape). Falls back to the user session JWT if
 * no hub key is configured, with provenance fields passed through for the EF to
 * honor once deployed.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

const DEFAULT_SUPABASE_URL = "https://rooffhgbxafyjcwmwpsy.supabase.co";

function supabaseUrl(): string {
  return (
    process.env.MOSADD_SUPABASE_URL?.replace(/\/$/, "") ??
    process.env.SUPABASE_URL?.replace(/\/$/, "") ??
    DEFAULT_SUPABASE_URL
  );
}

function hubKey(): string | null {
  return process.env.MOSADD_API_KEY ?? process.env.MOSADD_HUB_KEY ?? null;
}

const EmailAddress = z.string().email().max(254);

const mp0st_send_as_agent_input = z.object({
  to: z.union([EmailAddress, z.array(EmailAddress).min(1).max(50)]),
  subject: z.string().min(1).max(998),
  body_text: z.string().max(1_048_576).optional(),
  body_html: z.string().max(1_048_576).optional(),
  cc: z.array(EmailAddress).max(50).optional(),
  bcc: z.array(EmailAddress).max(50).optional(),
  reply_to: EmailAddress.optional(),
  tracking: z.boolean().optional(),
  agent_id: z
    .string()
    .min(1)
    .max(120)
    .describe("Stable id of the agent doing the send. Stamped as sent_by_agent_id for provenance."),
  task_id: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe("Optional id of the task/run this send belongs to. Stamped as sent_by_task_id."),
});

/**
 * Exchange the hub key for a hub-claim JWT that authorizes agent-attributed
 * actions. TODO(Lane A): confirm endpoint + response. Mirrors the
 * hub-mint-channel-token pattern in mirc-edge.ts.
 */
async function mintHubClaim(agentId: string, taskId?: string): Promise<string> {
  const key = hubKey();
  if (!key) {
    throw new Error("mp0st_send_as_agent needs MOSADD_API_KEY (hub key) to mint a provenance claim.");
  }
  const r = await fetch(`${supabaseUrl()}/functions/v1/hub-claim-mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ scope: "mail:send", agent_id: agentId, task_id: taskId ?? null }),
  });
  if (!r.ok) {
    const b = await r.text().catch(() => "");
    throw new Error(`hub-claim-mint ${r.status}: ${b.slice(0, 200)}`);
  }
  const data = (await r.json()) as { token?: string };
  if (!data?.token) throw new Error("hub-claim-mint: no token in response");
  return data.token;
}

async function mp0st_send_as_agent(
  input: z.infer<typeof mp0st_send_as_agent_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; status: string; is_internal: boolean; sent_by: "agent" }> {
  if (!input.body_text && !input.body_html) {
    throw new Error("mp0st_send_as_agent requires at least one of body_text or body_html.");
  }

  // Present the hub-claim JWT directly to mp0st-send (NOT the user session client)
  // so the EF attributes the row to the agent. TODO(Lane A): confirm mp0st-send
  // accepts a Bearer hub-claim and reads sent_by_agent_id / sent_by_task_id.
  const claim = await mintHubClaim(input.agent_id, input.task_id);
  ctx.log("debug", "mp0st_send_as_agent invoking mp0st-send with hub-claim", { agent_id: input.agent_id });

  const { agent_id, task_id, ...mailFields } = input;
  const r = await fetch(`${supabaseUrl()}/functions/v1/mp0st-send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${claim}` },
    body: JSON.stringify({
      ...mailFields,
      sent_by: "agent",
      sent_by_agent_id: agent_id,
      sent_by_task_id: task_id ?? null,
    }),
  });
  if (!r.ok) {
    const b = await r.text().catch(() => "");
    throw new Error(`mp0st-send ${r.status}: ${b.slice(0, 200)}`);
  }
  const res = (await r.json()) as { email_id?: string; status?: string; is_internal?: boolean; error?: string };
  if (res.error) throw new Error(res.error);

  return {
    message_id: res.email_id ?? "",
    status: res.status ?? "sent",
    is_internal: res.is_internal ?? false,
    sent_by: "agent",
  };
}

export const mailProvenanceTools: MosaddTool[] = [
  {
    name: "mp0st_send_as_agent",
    requires: "network",
    description:
      "Send an email ATTRIBUTED TO THE AGENT (provenance-stamped). Unlike mp0st_send (sends as the user), this stamps sent_by='agent' plus your agent_id and optional task_id onto the email record and audit trail — so recipients and compliance can see the mail was agent-originated. Auth: presents a hub-claim JWT (needs MOSADD_API_KEY). SCAFFOLD: depends on mp0st-send honoring the hub-claim + provenance fields (TODO Lane A).",
    inputSchema: mp0st_send_as_agent_input,
    handler: mp0st_send_as_agent as MosaddTool["handler"],
  },
];
