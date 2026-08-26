/**
 * comms_embed — let a builder-agent drop a LIVE mosadd channel into the app/site
 * it is generating.
 *
 * Mints a publishable embed key (`m_pk_live_…`) scoped to a channel + the app's
 * domain(s) via the `embed-keys` Edge Function, and returns a paste-in HTML
 * snippet that loads the mosadd widget from the CDN (embed.mosadd.com/v1.js).
 *
 * Security: the publishable key is safe to ship in HTML — it can ONLY mint
 * channel-scoped JWTs (the widget exchanges it at runtime via `mirc-embed-token`,
 * validated against the key's origin allow-list). Your hub key (`mosadd_sk_live_…`)
 * never enters the browser. The action is owned by the calling user (user-JWT
 * scoped — `mosadd login` / MOSADD_USER_JWT / hub-key exchange).
 *
 * Reuses the shipped embed infra (apps/embed widget + embed-keys + mirc-embed-token).
 * RFC 0001: channel-agnostic capability → `comms_` namespace (not an m<MODULE>_ prefix).
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

/** Widget CDN base. Override with MOSADD_EMBED_CDN for self-host / dev. */
const EMBED_CDN = (process.env.MOSADD_EMBED_CDN ?? "https://embed.mosadd.com").replace(/\/+$/, "");

const POSITIONS = ["inline", "sidebar-left", "sidebar-right", "floating-bl", "floating-br", "fullscreen"] as const;
const SKINS = ["default", "retro-irc-1990", "terminal", "minimal-dark", "minimal-light"] as const;

const embed_create_input = z.object({
  channel: z
    .string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/)
    .describe("The mIRC channel id everyone on the embed shares (e.g. 'acme-support'). Auto-created on first message if new."),
  allowed_origins: z
    .array(z.string().min(1)).min(1).max(10)
    .describe("REQUIRED. Domain(s) where the widget will be served — the key only works from these origins. Use the host(s) of the app you're building, e.g. ['app.acme.com','*.acme.com']. For local testing use mode:'test' and e.g. 'localhost:3000'."),
  name: z.string().max(64).optional().describe("Label for the key in the owner's dashboard. Default 'embed: <channel>'."),
  position: z.enum(POSITIONS).optional().describe("Where the widget renders. Default 'inline'."),
  skin: z.enum(SKINS).optional().describe("Visual skin. Default 'default' (mosadd-branded retro mIRC)."),
  title: z.string().max(60).optional().describe("Header title shown in the widget. Default 'mIRC'."),
  anon: z.boolean().optional().describe("Allow visitors to join with just a nick (no mosadd account). Default true."),
  locale: z.enum(["en", "pl"]).optional().describe("Widget UI language. Default 'en'."),
  mode: z.enum(["live", "test"]).optional().describe("Key mode — 'test' for local/dev origins, 'live' for production. Default 'live'."),
});

interface EmbedKeyResult {
  id?: string;
  key?: string;
  pk_prefix?: string;
  allowed_channels?: string[];
  error?: string;
}

interface EmbedCreateResult {
  embed_key: string;
  channel: string;
  allowed_origins: string[];
  snippet: string;
}

/** HTML-attr-safe: drop quotes/angle brackets (inputs are already length-bounded). */
const attrSafe = (s: string): string => s.replace(/["'<>]/g, "");

function buildSnippet(input: z.infer<typeof embed_create_input>, key: string): string {
  const attrs = [`data-channel="${attrSafe(input.channel)}"`, `data-position="${input.position ?? "inline"}"`];
  if (input.skin) attrs.push(`data-skin="${input.skin}"`);
  if (input.title) attrs.push(`data-title="${attrSafe(input.title)}"`);
  if (input.anon === false) attrs.push(`data-anon="false"`);
  if (input.locale) attrs.push(`data-locale="${input.locale}"`);
  return (
    `<div id="mosadd-mirc" ${attrs.join(" ")}></div>\n` +
    `<script src="${EMBED_CDN}/v1.js" data-key="${key}"></script>`
  );
}

async function embed_create(
  input: z.infer<typeof embed_create_input>,
  ctx: MosaddToolContext,
): Promise<EmbedCreateResult> {
  readSupabaseEnv();
  ctx.log("debug", "comms_embed_create minting embed key", { channel: input.channel, origins: input.allowed_origins.length });

  const res = await invokeFunction<EmbedKeyResult>("embed-keys", {
    name: input.name ?? `embed: ${input.channel}`,
    channels: [input.channel],
    allowed_origins: input.allowed_origins,
    mode: input.mode ?? "live",
  });
  if (res.error) throw new Error(res.error);
  if (!res.key) throw new Error("embed-keys returned no publishable key (missing `key`).");

  return {
    embed_key: res.key,
    channel: input.channel,
    allowed_origins: input.allowed_origins,
    snippet: buildSnippet(input, res.key),
  };
}

export const embedTools: MosaddTool[] = [
  {
    name: "comms_embed_create",
    title: "Create website embed",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Embed a LIVE mosadd chat channel into an app/site you're building (great for builder-agents on Lovable/Bolt/Cursor/v0). Mints a publishable embed key scoped to a channel + the app's domain(s) and returns a ready-to-paste HTML snippet (a <div> + <script src=embed.mosadd.com/v1.js data-key=…>). Visitors of the host page chat in real time (anonymous nick or mosadd login). REQUIRES `allowed_origins` — the domain(s) the app is served from (the key only works there). The publishable key is browser-safe (mints only channel-scoped JWTs); your hub key never leaves the server. Returns { embed_key, channel, allowed_origins, snippet }.",
    inputSchema: embed_create_input,
    handler: embed_create as MosaddTool["handler"],
  },
];
