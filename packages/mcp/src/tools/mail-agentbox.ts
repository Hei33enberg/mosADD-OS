/**
 * mAYL agent inboxes — disposable, two-way mailboxes an agent can mint for itself.
 *
 * Backed by the mosADD `mayl-agentbox` Edge Function (owner-scoped CRUD over
 * public.mayl_agent_boxes) + the mp0st-inbound-webhook receive path. A box is a REAL
 * address `agent-<hex>@mosadd.com` that can both SEND (via mAYL_send's from-selector)
 * and — since 2026-08-06 — RECEIVE (inbound mail resolves the box → the owner account).
 *
 * This is the mosADD answer to AgentMail's `create_inbox`: the agent gets its own real
 * inbox on demand, but inside an E2EE messenger where the agent is already a first-class
 * contact and every send carries cryptographic provenance — not a bare third-party API.
 *
 * Auth is identical to every other mAYL tool: invokeFunction sends the caller's
 * `Authorization: Bearer <userJwt>`, which mayl-agentbox validates via requireUser
 * (auth.uid() owner-scoping). No new auth surface.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const BoxId = z.string().min(1).describe("Agent-box id (UUID) from mAYL_agentbox_provision or mAYL_agentbox_list.");

const agentbox_provision_input = z.object({
  display_name: z
    .string()
    .max(120)
    .optional()
    .describe("Optional human label for the box (e.g. 'signup catcher'). Max 120 chars."),
  agent_id: z
    .string()
    .optional()
    .describe("Optional identity id to attribute the box to — must be an agent identity you own."),
  kind: z
    .enum(["ephemeral", "persistent"])
    .optional()
    .describe("'ephemeral' (default) auto-expires + is reaped; 'persistent' never expires."),
  ttl_seconds: z
    .number()
    .int()
    .positive()
    .max(86_400)
    .optional()
    .describe("Lifetime for an ephemeral box, in seconds. Default 600 (10 min). Max 86400 (24 h). Ignored for persistent."),
});

const agentbox_list_input = z.object({});

const agentbox_release_input = z.object({ id: BoxId });

const agentbox_extend_input = z.object({
  id: BoxId,
  ttl_seconds: z
    .number()
    .int()
    .positive()
    .max(86_400)
    .optional()
    .describe("New lifetime from NOW, in seconds. Default 600 (10 min). Max 86400 (24 h). Ephemeral boxes only."),
});

// ---- Handlers ----

async function agentbox_provision(
  input: z.infer<typeof agentbox_provision_input>,
  ctx: MosaddToolContext,
): Promise<Record<string, unknown>> {
  readSupabaseEnv();
  ctx.log("debug", "mAYL_agentbox_provision invoking mayl-agentbox", { kind: input.kind ?? "ephemeral" });
  return await invokeFunction("mayl-agentbox", {
    action: "create",
    display_name: input.display_name ?? null,
    agent_id: input.agent_id ?? null,
    kind: input.kind ?? "ephemeral",
    ttl_seconds: input.ttl_seconds ?? null,
  });
}

async function agentbox_list(
  _input: z.infer<typeof agentbox_list_input>,
  ctx: MosaddToolContext,
): Promise<Record<string, unknown>> {
  readSupabaseEnv();
  ctx.log("debug", "mAYL_agentbox_list invoking mayl-agentbox", {});
  return await invokeFunction("mayl-agentbox", { action: "list" });
}

async function agentbox_release(
  input: z.infer<typeof agentbox_release_input>,
  ctx: MosaddToolContext,
): Promise<Record<string, unknown>> {
  readSupabaseEnv();
  ctx.log("debug", "mAYL_agentbox_release invoking mayl-agentbox", { id: input.id });
  return await invokeFunction("mayl-agentbox", { action: "release", id: input.id });
}

async function agentbox_extend(
  input: z.infer<typeof agentbox_extend_input>,
  ctx: MosaddToolContext,
): Promise<Record<string, unknown>> {
  readSupabaseEnv();
  ctx.log("debug", "mAYL_agentbox_extend invoking mayl-agentbox", { id: input.id });
  return await invokeFunction("mayl-agentbox", {
    action: "extend",
    id: input.id,
    ttl_seconds: input.ttl_seconds ?? null,
  });
}

// ---- Registration ----

export const mailAgentboxTools: MosaddTool[] = [
  {
    name: "mAYL_agentbox_provision",
    title: "Provision disposable inbox",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Mint the agent its OWN real, disposable email inbox at agent-<hex>@mosadd.com that can SEND and RECEIVE. Default ephemeral with a 10-minute TTL (auto-expires + is reaped); pass kind:'persistent' for a permanent box, or ttl_seconds (max 86400) for a custom lifetime. Optional display_name + agent_id. Returns the box {id, address, expires_at}. Use the address to catch signup/verification codes or replies, then mAYL_list (filter by the box address) + mAYL_view to read what arrived. Owner-scoped; max 25 active boxes per account.",
    inputSchema: agentbox_provision_input,
    handler: agentbox_provision as MosaddTool["handler"],
  },
  {
    name: "mAYL_agentbox_list",
    title: "List disposable inboxes",
    annotations: { readOnlyHint: true },
    requires: "network",
    description:
      "List your active agent inboxes (address, display_name, kind, agent_id, expires_at), newest first. Owner-scoped.",
    inputSchema: agentbox_list_input,
    handler: agentbox_list as MosaddTool["handler"],
  },
  {
    name: "mAYL_agentbox_release",
    title: "Release disposable inbox",
    annotations: { destructiveHint: true },
    requires: "network",
    description:
      "Release (delete) one of your agent inboxes by id — frees the address immediately so it stops receiving. Owner-scoped.",
    inputSchema: agentbox_release_input,
    handler: agentbox_release as MosaddTool["handler"],
  },
  {
    name: "mAYL_agentbox_extend",
    title: "Extend disposable inbox",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Extend an EPHEMERAL agent inbox's lifetime by id (ttl_seconds counted from NOW, max 24 h). Persistent boxes never expire and cannot be extended. Owner-scoped.",
    inputSchema: agentbox_extend_input,
    handler: agentbox_extend as MosaddTool["handler"],
  },
];
