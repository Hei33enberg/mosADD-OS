/**
 * Internal types for the mosadd MCP server.
 */

import type { z } from "zod";

export type Mode = "cloud" | "local" | "self-host";

export interface MosaddServerOptions {
  /** API key for hosted mode. Required if mode === "cloud". */
  apiKey?: string;
  /** Override the default hub URL (https://mcp.mosadd.com). */
  hubUrl?: string;
  /** Operating mode. Defaults to "cloud" if apiKey is present, else "local". */
  mode?: Mode;
  /** Log level. */
  logLevel?: "debug" | "info" | "warn" | "error";
}

export interface MosaddToolContext {
  options: Required<Pick<MosaddServerOptions, "mode" | "hubUrl">> & MosaddServerOptions;
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

export interface MosaddTool<TInput = unknown, TOutput = unknown> {
  /** Tool name. MUST follow the m{MODULE}_{operation} convention. */
  name: string;
  /** Short human-readable description. Shown to the model. */
  description: string;
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
