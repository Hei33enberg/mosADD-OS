/**
 * mIRC edge — Cloudflare Worker + Durable Object backend (LINEAR-2675/2680).
 *
 * Parallel to mirc-messages.ts (Supabase path). These tools talk directly to
 * the mosadd-edge Worker → ChannelDO via REST. Use them when you want:
 *   - sub-100ms global fan-out (DO broadcasts WS),
 *   - to skip the Supabase write hot path (DO async-flushes to messages_meta
 *     anyway, so the message still appears via the existing mIRC_list_messages
 *     / message-list path),
 *   - to scale to thousands of writers per channel without contention.
 *
 * Auth: a `mosadd_sk_live_…` hub API key (Bearer). Free plan = text is free
 * (the paid gates live where the paid product is). Set the edge URL via
 * MOSADD_EDGE_URL (defaults to the prod Worker).
 *
 * For native WebSocket subscription (live push to a long-lived process), MCP
 * stdio is request/response so it isn't a fit; the dev should connect with a
 * plain WS client to:
 *   `wss://${MOSADD_EDGE_HOST}/c/${channelId}/ws?k=${apiKey}`
 * Snippet in `apps/edge/README.md`.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

const DEFAULT_EDGE_URL = "https://mosadd-edge.mr-brics-33.workers.dev";

function edgeUrl(): string {
  return process.env.MOSADD_EDGE_URL?.replace(/\/$/, "") ?? DEFAULT_EDGE_URL;
}

/** Resolve the hub key from env. Same convention as the rest of the toolkit:
 *  MOSADD_API_KEY is the standard, with MOSADD_HUB_KEY as a friendly alias. */
function hubKey(): string {
  const key = process.env.MOSADD_API_KEY ?? process.env.MOSADD_HUB_KEY ?? "";
  if (!key) throw new Error("MOSADD_API_KEY required for mIRC edge tools (see mosadd login or hub-keys).");
  return key;
}

// ── send_edge ────────────────────────────────────────────────────────────────

const mIRC_send_edge_input = z.object({
  channel_id: z.string().min(1).max(128).describe("Channel id (UUID). Same as mIRC_create / mIRC_list."),
  text: z.string().min(1).max(64_000).describe("Message body (UTF-8, max 64 KB)."),
  from: z.string().max(120).optional().describe("Sender hint shown to other clients (defaults to the hub-key owner)."),
});

async function mIRC_send_edge(
  input: z.infer<typeof mIRC_send_edge_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: number; channel_id: string }> {
  ctx.log("debug", "mIRC_send_edge", { channel_id: input.channel_id });
  const r = await fetch(`${edgeUrl()}/c/${input.channel_id}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${hubKey()}`,
    },
    body: JSON.stringify({ text: input.text, from: input.from }),
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    throw new Error(`mosadd-edge ${r.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await r.json() as { id?: string; ts?: number };
  if (!data?.id) throw new Error("mosadd-edge: send returned no id");
  return { message_id: data.id, delivered_at: data.ts ?? Date.now(), channel_id: input.channel_id };
}

// ── history_edge ─────────────────────────────────────────────────────────────

const mIRC_history_edge_input = z.object({
  channel_id: z.string().min(1).max(128).describe("Channel id (UUID)."),
  limit: z.number().int().min(1).max(100).default(50).optional()
    .describe("How many recent messages to return (max 100, the DO ring size)."),
});

async function mIRC_history_edge(
  input: z.infer<typeof mIRC_history_edge_input>,
  ctx: MosaddToolContext,
): Promise<{ messages: Array<{ id: string; from: string | null; text: string; timestamp: number }>; channel_id: string }> {
  const limit = input.limit ?? 50;
  ctx.log("debug", "mIRC_history_edge", { channel_id: input.channel_id, limit });
  const r = await fetch(`${edgeUrl()}/c/${input.channel_id}/history?limit=${limit}`, {
    headers: { Authorization: `Bearer ${hubKey()}` },
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    throw new Error(`mosadd-edge ${r.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await r.json() as { messages?: Array<{ id: string; ts: number; from?: string | null; text: string }> };
  return {
    channel_id: input.channel_id,
    messages: (data.messages ?? []).map((m) => ({
      id: m.id,
      from: m.from ?? null,
      text: m.text,
      timestamp: m.ts,
    })),
  };
}

export const mircEdgeTools: MosaddTool[] = [
  {
    name: "mIRC_send_edge",
    requires: "network",
    description:
      "Send a text message into a persistent channel via the mosadd-edge Cloudflare Worker (Durable Object backend). Sub-100ms global fan-out to all WebSocket subscribers of the channel + async flush to Supabase as system-of-record (idempotent). Use this when you want native realtime push without polling. Parallel to mIRC_post_message (Supabase path); pick one per channel. Auth: MOSADD_API_KEY env (hub key).",
    inputSchema: mIRC_send_edge_input,
    handler: mIRC_send_edge as MosaddTool["handler"],
  },
  {
    name: "mIRC_history_edge",
    requires: "network",
    description:
      "Read the last N (max 100) messages held in the channel's Durable Object ring buffer at the edge. Hot path is the DO, not Supabase — same data lands in messages_meta via async flush, so cold reads / pagination beyond 100 should use mIRC_list_messages.",
    inputSchema: mIRC_history_edge_input,
    handler: mIRC_history_edge as MosaddTool["handler"],
  },
];
