#!/usr/bin/env node
/**
 * `mosadd-agent` — CLI bin for @mosadd/agent.
 *
 * Subcommands:
 *   mosadd-agent start    Run the DM responder loop in the foreground (logs to stderr).
 *   mosadd-agent help     Print usage + required env vars.
 *
 * Recommended deploy: pm2 / systemd / Docker. The loop exits only on SIGINT/SIGTERM.
 */
import { startResponder } from "../responder.js";

const HELP = `mosadd-agent — the mosadd agent runner

Usage:
  npx -y @mosadd/agent start         Run the DM responder in the foreground.
  npx -y @mosadd/agent help          Print this help.

Required environment:
  MOSADD_SUPABASE_URL                Your mosadd Supabase project URL.
  MOSADD_SUPABASE_ANON_KEY           Supabase anon key (publishable).
  MOSADD_API_KEY                     mosadd hub key (mosadd_sk_live_…). Get one
                                     from https://mosadd.com/keys or via the
                                     hub-register self-serve EF.
  OPENROUTER_API_KEY                 OpenRouter key used ONLY to write reply text.

Optional environment:
  MOSADD_AGENT_MODEL                 LLM id (default: anthropic/claude-sonnet-4).
  RESPONDER_POLL_MS                  Cycle interval ms (default: 30000).
  RESPONDER_STATE                    Path for the answered-message cache
                                     (default: /tmp/responder-state.json).

Programmatic API:
  import { startResponder } from "@mosadd/agent";
  const stop = await startResponder({ model: "anthropic/claude-sonnet-4" });
`;

async function main() {
  const cmd = process.argv[2] ?? "help";
  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    process.stdout.write(HELP);
    return;
  }
  if (cmd === "start") {
    const stop = await startResponder();
    const shutdown = () => {
      process.stderr.write("\n[mosadd/agent] shutdown signal — finishing current cycle…\n");
      stop();
      // Give the loop a moment to settle; if it's stuck in a fetch, exit anyway.
      setTimeout(() => process.exit(0), 2000);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    return;
  }
  process.stderr.write(`Unknown command: ${cmd}\n\n${HELP}`);
  process.exit(2);
}

main().catch((e) => {
  process.stderr.write(`[mosadd/agent] fatal: ${(e as Error)?.message ?? e}\n`);
  process.exit(1);
});
