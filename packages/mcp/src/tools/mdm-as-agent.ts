/**
 * mDM agent-attributed send — a person's session speaks AS one of THEIR agents.
 *
 * ── THE PROBLEM THIS SOLVES ──────────────────────────────────────────────────
 * An MCP key is bound to a USER, and the hosted gateway exchanges it for THAT
 * user's session. So when someone adds the connector while signed in as
 * themselves, their agent runtime comes up holding the OWNER'S identity. The
 * founder hit exactly this on 2026-08-17: his "Dispatch" agent authenticated as
 * him, went looking for him among his own contacts, did not find him, and
 * reported the agent↔agent guard as the cause. The real cost was that his mDM
 * had no living 1:1 thread with his dispatcher.
 *
 * With this tool the same session can post AS `dispatcher@mosadd.com`, so the
 * DYSPOZYTOR thread fills with messages FROM the dispatcher.
 *
 * ── AUTHORIZATION ────────────────────────────────────────────────────────────
 * Enforced SERVER-SIDE by the `mdm-send-as-agent` Edge Function, never here:
 * the named identity must be `kind='agent'`, owned by the CALLER
 * (`owner_user_id`), and not retired. A client-side check would be decoration —
 * the tool arguments are attacker-controlled by definition.
 *
 * Shape follows the accepted `mAYL_send_as_agent` precedent (owner's credential
 * in, agent-attributed message out). Its AUTH model was deliberately not copied:
 * measured 2026-08-17, `hub-claim-mint` accepts any `agent_id` string and never
 * compares it to an owner, so the agent name in a mAYL provenance stamp is
 * caller-asserted text. That gap is filed as LINEAR-5625; this tool does not
 * reproduce it.
 *
 * Auth transport also differs on purpose: mAYL_send_as_agent reads
 * `process.env.MOSADD_API_KEY`, which does not exist on the hosted multi-tenant
 * gateway (the key is per-request there, not process-wide). This tool goes
 * through `invokeFunction`, i.e. the caller's own session — so it works
 * identically over stdio and over mcp.mosadd.com.
 *
 * Agent DMs travel as plaintext base64 on the established agent lane (the same
 * path agent-dm-responder uses); this tool does not change that property.
 * LINEAR-5620.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction } from "../providers/supabase.js";

const mDM_send_as_agent_input = z.object({
  agent: z
    .string()
    .min(1)
    .max(200)
    .describe(
      "Which of YOUR agents to speak as — its mosADD address (dispatcher@mosadd.com), " +
        "its identity id, or its display name. Must be an agent you own.",
    ),
  text: z.string().min(1).max(8000).describe("The message body, as the agent would write it."),
  to: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Recipient identity id or mosADD address. Defaults to YOU (the key's owner) — " +
        "the common case is an agent reporting to its owner. Must be a person, not another agent.",
    ),
  silent: z
    .boolean()
    .optional()
    .describe("Deliver without waking a phone: the message still arrives and shows unread, only the OS push is skipped."),
});

const mDM_list_my_agents_input = z.object({});

type SendResult = {
  ok: boolean;
  sent_as: { identity_id: string; address: string | null; display_name: string | null };
  to: { identity_id: string; display_name: string | null };
  thread_id: string;
};

async function mDM_send_as_agent(
  input: z.infer<typeof mDM_send_as_agent_input>,
  ctx: MosaddToolContext,
): Promise<SendResult> {
  ctx.log("debug", "mDM_send_as_agent", { agent: input.agent });
  return await invokeFunction<SendResult>("mdm-send-as-agent", {
    agent: input.agent,
    text: input.text,
    ...(input.to ? { to: input.to } : {}),
    ...(input.silent ? { silent: true } : {}),
  });
}

async function mDM_list_my_agents(
  _input: z.infer<typeof mDM_list_my_agents_input>,
  ctx: MosaddToolContext,
): Promise<{ agents: Array<{ identity_id: string; address: string | null; display_name: string | null }> }> {
  ctx.log("debug", "mDM_list_my_agents");
  return await invokeFunction("mdm-send-as-agent", { action: "list_agents" });
}

export const mdmAsAgentTools: MosaddTool[] = [
  {
    name: "mDM_send_as_agent",
    requires: "network",
    description:
      "Send a direct message AS ONE OF YOUR OWN AGENTS instead of as yourself. Use this when you are an " +
      "agent runtime (Dispatch, Hermes, a CTO agent) connected with your owner's key: without it every " +
      "message you send appears to come FROM the owner, so the owner has no thread with you. Names the " +
      "agent by mosADD address, identity id or display name; `to` defaults to the key's owner. The server " +
      "verifies you OWN that agent — speaking as someone else's agent, or as another person, is refused. " +
      "Recipient must be a person: agent-to-agent DM stays blocked.",
    inputSchema: mDM_send_as_agent_input,
    handler: mDM_send_as_agent as MosaddTool["handler"],
  },
  {
    name: "mDM_list_my_agents",
    requires: "network",
    description:
      "List the agents you are allowed to speak as with mDM_send_as_agent — every live agent owned by " +
      "the account behind this key, with its identity id, mosADD address and display name. Call this " +
      "first when you are unsure which agent identity you hold.",
    inputSchema: mDM_list_my_agents_input,
    handler: mDM_list_my_agents as MosaddTool["handler"],
  },
];
