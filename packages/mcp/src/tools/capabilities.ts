/**
 * comms_capabilities — capability discovery for consuming hosts.
 *
 * THE contract surface between mosadd-os and carrier-aware hosts (e.g.
 * cymru-os, which filters tools by available transports — see cymru-os RFC
 * 0002 D-Bus "Capability-flag bridge"). A host spawns `@mosadd/mcp` over stdio
 * and calls `comms_capabilities` once to learn which tools are usable on which
 * carrier, then gates the tool list accordingly (e.g. off-grid radio →
 * only `requires: "any" | "radio"` tools are offered).
 *
 * `requires: "any"` here too — discovery must work on any transport, including
 * off-grid radio, otherwise a host couldn't learn what it's allowed to call.
 */

import { z } from "zod";
import type { CapabilityRequirement, MosaddTool } from "../types.js";

export interface CapabilityEntry {
  name: string;
  requires: CapabilityRequirement;
}

export interface CapabilityManifest {
  /** Stable contract version. Bump on any enum/shape change (requires:cymru-input). */
  contract_version: string;
  /** The finalized capability enum, echoed so hosts can validate against it. */
  requirements: CapabilityRequirement[];
  /** Flat list of every tool and its transport requirement. */
  tools: CapabilityEntry[];
  /** Pre-grouped by requirement for cheap host-side filtering. */
  by_requirement: Record<CapabilityRequirement, string[]>;
}

const CONTRACT_VERSION = "1.0.0";
const ALL_REQUIREMENTS: CapabilityRequirement[] = ["any", "radio", "network"];

/** Build the capability manifest from a tool list. Pure, host-agnostic. */
export function buildCapabilityManifest(tools: MosaddTool[]): CapabilityManifest {
  const entries: CapabilityEntry[] = tools.map((t) => ({ name: t.name, requires: t.requires }));
  const by_requirement: Record<CapabilityRequirement, string[]> = {
    any: [],
    radio: [],
    network: [],
  };
  for (const e of entries) by_requirement[e.requires].push(e.name);
  return {
    contract_version: CONTRACT_VERSION,
    requirements: ALL_REQUIREMENTS,
    tools: entries,
    by_requirement,
  };
}

/**
 * Factory: build the comms_capabilities tool over a given tool set. The tool
 * itself is appended to that set, so it self-reports too (requires: "any").
 */
export function makeCapabilitiesTool(channelTools: MosaddTool[]): MosaddTool {
  const tool: MosaddTool = {
    name: "comms_capabilities",
    title: "List tool capabilities",
    annotations: { readOnlyHint: true },
    requires: "any",
    description:
      "Discover which mosadd tools are available and what transport each requires (any | radio | network). Carrier-aware hosts (e.g. off-grid radio devices) call this once to gate the tool list to what the current carrier supports. Returns a manifest with per-tool requirements grouped by transport.",
    inputSchema: z.object({}),
    handler: async () => buildCapabilityManifest([...channelTools, tool]),
  };
  return tool;
}
