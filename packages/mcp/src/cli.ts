/**
 * CLI front of `npx @mosadd/mcp` — the parts that print and exit instead of starting the stdio server.
 *
 *   --version / -v   print the package.json version and exit
 *   --help / -h      print commands + env vars and exit
 *   tools            print every registered tool, grouped by module, and exit
 *
 * Pure functions on purpose (no process.exit, no I/O): bin/mcp.ts decides what to do with the result,
 * and the tests call these directly. The version comes from ./version.js (= package.json), never typed here.
 */

export interface CliTool {
  name: string;
  description?: string;
}

export type CliAction =
  | { kind: "version" }
  | { kind: "help" }
  | { kind: "tools" }
  | { kind: "auth"; sub: "login" | "logout" | "whoami"; rest: string[] }
  | { kind: "serve" };

/** Decide what `argv` (process.argv.slice(2)) asks for. Flags win over subcommands; anything unknown starts the server. */
export function parseCli(args: readonly string[]): CliAction {
  const first = args[0];
  if (args.includes("--version") || args.includes("-v") || first === "version") return { kind: "version" };
  if (args.includes("--help") || args.includes("-h") || first === "help") return { kind: "help" };
  if (first === "tools") return { kind: "tools" };
  if (first === "login" || first === "logout" || first === "whoami") return { kind: "auth", sub: first, rest: args.slice(1) };
  return { kind: "serve" };
}

export function renderVersion(version: string): string {
  return `${version}\n`;
}

export function renderHelp(version: string): string {
  return [
    `mosadd-mcp ${version} — mosADD MCP server (stdio)`,
    ``,
    `Usage:`,
    `  npx @mosadd/mcp [command] [options]`,
    ``,
    `Commands:`,
    `  (none)    start the MCP server over stdio (what your agent runtime runs)`,
    `  login     sign in and save a session on this machine`,
    `  logout    delete the saved session`,
    `  whoami    show which identity the saved session / MOSADD_API_KEY resolves to`,
    `  tools     list every tool this server registers, grouped by module, and exit`,
    ``,
    `Options:`,
    `  -v, --version   print the version and exit`,
    `  -h, --help      print this help and exit`,
    ``,
    `Environment:`,
    `  MOSADD_API_KEY    hub API key — exchanged for a short-lived session at boot (hosted mode)`,
    `  MOSADD_HUB_URL    override the hub url`,
    `  MOSADD_MODE       local | cloud`,
    `  MOSADD_LOG_LEVEL  debug | info | warn | error (default info)`,
    `  See the README for the full list (Supabase BYOK, Resend, LiveKit).`,
    ``,
  ].join("\n");
}

/** Module a tool belongs to: the part of the name before the first underscore (mDM_send -> mDM). */
export function moduleOf(toolName: string): string {
  const i = toolName.indexOf("_");
  return i > 0 ? toolName.slice(0, i) : toolName;
}

/** Tools grouped by module, groups ordered by size (largest first, then name), tools alphabetical inside a group. */
export function groupTools(tools: readonly CliTool[]): { module: string; tools: CliTool[] }[] {
  const by = new Map<string, CliTool[]>();
  for (const t of tools) {
    const m = moduleOf(t.name);
    by.set(m, [...(by.get(m) ?? []), t]);
  }
  return [...by.entries()]
    .map(([module, list]) => ({ module, tools: [...list].sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.tools.length - a.tools.length || a.module.localeCompare(b.module));
}

const oneLine = (s: string | undefined, max = 90): string => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  const dot = t.search(/[.!?](\s|$)/);
  const first = dot > 0 ? t.slice(0, dot + 1) : t;
  return first.length > max ? `${first.slice(0, max - 1)}…` : first;
};

export function renderTools(tools: readonly CliTool[]): string {
  const groups = groupTools(tools);
  const lines: string[] = [`${tools.length} tools in ${groups.length} groups`, ``];
  for (const g of groups) {
    lines.push(`${g.module} (${g.tools.length})`);
    for (const t of g.tools) lines.push(`  ${t.name}${t.description ? ` — ${oneLine(t.description)}` : ""}`);
    lines.push(``);
  }
  return lines.join("\n");
}
