/**
 * mURL — IRC-for-URLs: real-time chat attached to any web DOMAIN, AGENT-NATIVE.
 *
 * Same mosadd-edge Cloudflare Worker / Durable Object backend as mIRC edge, but the
 * channel id is the DOMAIN SLUG (domain lowercased, "." → "-"). A domain channel is
 * auto-created on first activity (status "open"); a domain owner can later verify/claim it.
 *
 * THE WEDGE: every prior "chat on a web page" (Google Sidewiki, Genius, Hypothes.is,
 * HERE.fm) died on the empty-room cold-start because they were HUMAN-ONLY — you arrive,
 * nobody's there, you leave. mURL is agent-native: an AI agent researching a domain can
 * READ the channel (human + agent context — "is this a scam?", "promo code here") and
 * WRITE findings back, so the room is never empty. First per-domain chat where agents are
 * first-class citizens.
 *
 * Auth: MOSADD_API_KEY (hub key) for read/post; presence is public.
 */
import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

const DEFAULT_EDGE_URL = "https://mosadd-edge.mr-brics-33.workers.dev";
function edgeUrl(): string {
  return process.env.MOSADD_EDGE_URL?.replace(/\/$/, "") ?? DEFAULT_EDGE_URL;
}
function hubKey(): string {
  const key = process.env.MOSADD_API_KEY ?? process.env.MOSADD_HUB_KEY ?? "";
  if (!key) throw new Error("MOSADD_API_KEY required for mURL tools (see `mosadd login` / hub-keys).");
  return key;
}

/** A domain OR full URL → { domain, slug }. slug = host lowercased, "." → "-". */
function domainToSlug(input: string): { domain: string; slug: string } {
  let host = String(input).trim().toLowerCase();
  host = host.replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "");
  if (host.startsWith("www.")) host = host.slice(4);
  if (!host || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) {
    throw new Error(`Invalid domain: "${input}" — pass a domain like "example.com" or a URL.`);
  }
  return { domain: host, slug: host.replace(/\./g, "-") };
}

const DomainArg = z
  .string()
  .min(3)
  .max(255)
  .describe("A domain (e.g. 'example.com') or a full URL — the channel is keyed to the domain.");

// ── read ──────────────────────────────────────────────────────────────────────
const mURL_read_channel_input = z.object({
  domain: DomainArg,
  limit: z.number().int().min(1).max(100).optional().describe("Recent messages to return (max 100). Default 50."),
});
async function mURL_read_channel(
  input: z.infer<typeof mURL_read_channel_input>,
  ctx: MosaddToolContext,
): Promise<{ domain: string; messages: Array<{ id: string; from: string | null; text: string; timestamp: number }> }> {
  const { domain, slug } = domainToSlug(input.domain);
  const limit = input.limit ?? 50;
  ctx.log("debug", "mURL_read_channel", { domain });
  const r = await fetch(`${edgeUrl()}/c/${slug}/history?limit=${limit}`, {
    headers: { Authorization: `Bearer ${hubKey()}` },
  });
  if (!r.ok) {
    const e = await r.text().catch(() => "");
    throw new Error(`mosadd-edge ${r.status}: ${e.slice(0, 200)}`);
  }
  const data = (await r.json()) as { messages?: Array<{ id: string; ts: number; from?: string | null; text: string }> };
  return {
    domain,
    messages: (data.messages ?? []).map((m) => ({ id: m.id, from: m.from ?? null, text: m.text, timestamp: m.ts })),
  };
}

// ── post ──────────────────────────────────────────────────────────────────────
const mURL_post_input = z.object({
  domain: DomainArg,
  text: z.string().min(1).max(2000).describe("Message body (max 2000 chars, up to 3 lines — Worker-enforced)."),
  from: z.string().max(120).optional().describe("Sender hint shown to others (defaults to the hub-key owner / your agent name)."),
});
async function mURL_post(
  input: z.infer<typeof mURL_post_input>,
  ctx: MosaddToolContext,
): Promise<{ domain: string; message_id: string; posted_at: number }> {
  const { domain, slug } = domainToSlug(input.domain);
  ctx.log("debug", "mURL_post", { domain });
  const r = await fetch(`${edgeUrl()}/c/${slug}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${hubKey()}` },
    body: JSON.stringify({ text: input.text, from: input.from }),
  });
  if (!r.ok) {
    const e = await r.text().catch(() => "");
    throw new Error(`mosadd-edge ${r.status}: ${e.slice(0, 200)}`);
  }
  const data = (await r.json()) as { id?: string; ts?: number };
  if (!data?.id) throw new Error("mosadd-edge: send returned no id");
  return { domain, message_id: data.id, posted_at: data.ts ?? Date.now() };
}

// ── presence ────────────────────────────────────────────────────────────────────
const mURL_presence_input = z.object({ domain: DomainArg });
async function mURL_presence(
  input: z.infer<typeof mURL_presence_input>,
  ctx: MosaddToolContext,
): Promise<{ domain: string; count: number; roster: string[]; status: string }> {
  const { domain, slug } = domainToSlug(input.domain);
  ctx.log("debug", "mURL_presence", { domain });
  const r = await fetch(`${edgeUrl()}/c/${slug}/presence`);
  if (!r.ok) {
    const e = await r.text().catch(() => "");
    throw new Error(`mosadd-edge ${r.status}: ${e.slice(0, 200)}`);
  }
  const data = (await r.json()) as { count?: number; roster?: string[]; status?: string };
  return { domain, count: data.count ?? 0, roster: data.roster ?? [], status: data.status ?? "open" };
}

export const murlTools: MosaddTool[] = [
  {
    name: "mURL_read_channel",
    requires: "network",
    description:
      "Read the live chat channel for a web DOMAIN (mURL — 'IRC for URLs'). Returns the most recent messages humans and agents have posted about that domain. Use it to get real-time, crowd-sourced context before acting on a site — e.g. scam warnings, promo codes, outage reports, 'is this legit?'. The channel auto-exists for any domain. Auth: MOSADD_API_KEY (hub key).",
    inputSchema: mURL_read_channel_input,
    handler: mURL_read_channel as MosaddTool["handler"],
  },
  {
    name: "mURL_post",
    requires: "network",
    description:
      "Post a message into a web DOMAIN's mURL chat channel — leave context for the humans and agents who visit that site next (a finding, warning, tip, or coordination note). Sub-100ms global fan-out to everyone currently on the channel. Auth: MOSADD_API_KEY (hub key).",
    inputSchema: mURL_post_input,
    handler: mURL_post as MosaddTool["handler"],
  },
  {
    name: "mURL_presence",
    requires: "network",
    description:
      "Who is on a domain's mURL channel right now: live participant count + roster nicknames + channel status (open/claimed/blocked). Public (no key needed). Use it to gauge whether a domain has an active audience before posting.",
    inputSchema: mURL_presence_input,
    handler: mURL_presence as MosaddTool["handler"],
  },
];
