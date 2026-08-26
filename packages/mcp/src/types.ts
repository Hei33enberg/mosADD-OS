/**
 * Internal types for the mosadd MCP server.
 */

import type { z } from "zod";
import type { DmProvider, VoiceProvider } from "@mosadd/providers";
import type { MdmKeyStore } from "./crypto/mdm-session.js";

export type Mode = "cloud" | "local" | "self-host";

/**
 * Transport backends per channel. The server fills any missing entry with its
 * default network adapter; a host (e.g. cymru-os) injects alternatives —
 * notably a radio DmProvider — via `MosaddServerOptions.providers`. This is
 * the DI seam that keeps mosadd-os transport-agnostic.
 *
 * `keys` is LOCAL crypto custody (identity + prekeys + ratchet sessions) for
 * mDM E2EE — distinct from transport. Defaults to an in-process keystore; a
 * host may inject a file/keychain-backed one.
 */
export interface ProviderRegistry {
  dm: DmProvider;
  keys: MdmKeyStore;
  /**
   * mTALK push-to-talk transport. Defaults to the network provider (LiveKit
   * media + authoritative floor state). A radio host injects a provider that
   * maps the floor onto a physical RF channel.
   */
  voice: VoiceProvider;
}

export interface MosaddServerOptions {
  /** API key for hosted mode. Required if mode === "cloud". */
  apiKey?: string;
  /** Override the default hub URL (https://mcp.mosadd.com). */
  hubUrl?: string;
  /** Operating mode. Defaults to "cloud" if apiKey is present, else "local". */
  mode?: Mode;
  /** Log level. */
  logLevel?: "debug" | "info" | "warn" | "error";
  /**
   * Host-injected channel providers. Any omitted channel uses the default
   * network adapter. A carrier-aware host supplies e.g. a radio DmProvider here.
   */
  providers?: Partial<ProviderRegistry>;
  /**
   * When true, publish this identity's mDM prekey bundle once on startup
   * (best-effort, non-fatal) so peers can open an E2EE session without the user
   * manually running mDM_publish_keys first. Fixes the cold-start where mDM_send
   * fails for every recipient because nobody has published keys. Used by the
   * stdio binary; the hosted per-request transport leaves this off (it publishes
   * per authenticated session instead).
   */
  autoPublishKeys?: boolean;
}

export interface MosaddToolContext {
  options: Required<Pick<MosaddServerOptions, "mode" | "hubUrl">> & MosaddServerOptions;
  /** Resolved channel providers (defaults merged with host-injected ones). */
  providers: ProviderRegistry;
  /** Per-request logger. */
  log: (level: "debug" | "info" | "warn" | "error", msg: string, extra?: unknown) => void;
}

/**
 * Transport capability a tool requires to function. This is the ONE contract
 * string shared with consuming hosts. e.g. cymru-os gates tools by carrier
 * availability via this flag (cymru-os RFC 0002 D-Bus "Capability-flag bridge").
 * The enum is FINAL and normalized with the cymru-os host; changing these
 * values must be coordinated (Linear label `requires:cymru-input`).
 *
 *  - "any"      works over any transport, incl. off-grid radio (small,
 *               packet-friendly payloads). e.g. text DM.
 *  - "radio"    radio-specific path (e.g. Codec2 audio frames). Off-grid OK.
 *  - "network"  needs IP connectivity (server-hosted channels, email, public
 *               join links, bridges). NOT available off-grid.
 */
export type CapabilityRequirement = "any" | "radio" | "network";

/**
 * MCP tool annotations (spec `ToolAnnotations`, minus `title` which lives on the
 * tool itself). Connector UIs — Claude's included — group and gate tools by these
 * hints: `readOnlyHint: true` lands the tool in the read-only bucket (bulk-approvable),
 * `destructiveHint: true` marks it as destroying/overwriting user data at approval
 * time, and tools with NO annotations all fall into one flat "Other tools" bucket —
 * which is exactly how the mosADD connector looked until 2026-08-26 (84 tools, one
 * undifferentiated list; founder order: fix it).
 */
export interface MosaddToolAnnotations {
  /** Tool does not mutate anything. list/get/search/state/metrics class. */
  readOnlyHint?: boolean;
  /** Tool destroys or irreversibly overwrites data (delete/ban/revoke/edit-in-place). */
  destructiveHint?: boolean;
  /** Calling twice with the same args has no additional effect. */
  idempotentHint?: boolean;
  /** Tool reaches outside the mosADD closed world (e.g. sends external email). */
  openWorldHint?: boolean;
}

export interface MosaddTool<TInput = unknown, TOutput = unknown> {
  /** Tool name. MUST follow the m{MODULE}_{operation} convention. */
  name: string;
  /**
   * Human title for connector UIs (e.g. "Send encrypted DM"). The `name` stays the
   * model-facing handle; this is what a PERSON sees in the permissions list.
   */
  title?: string;
  /** Short human-readable description. Shown to the model. */
  description: string;
  /** MCP annotations; see MosaddToolAnnotations. Every registered tool SHOULD set them. */
  annotations?: MosaddToolAnnotations;
  /**
   * Transport this tool requires. Consuming hosts read this to gate tools by
   * available carriers. Every tool MUST declare it explicitly.
   */
  requires: CapabilityRequirement;
  /** Zod schema for input. */
  inputSchema: z.ZodType<TInput>;
  /** Tool handler. */
  handler: (input: TInput, ctx: MosaddToolContext) => Promise<TOutput>;
}
