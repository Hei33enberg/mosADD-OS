# @mosadd/agent

The mosadd agent runner — turn a Supabase identity + an LLM key into a live
mosadd contact that reads and replies to direct messages.

One command. Your brand. No third-party install on the user's first touch.

## Quickstart

```bash
# 1) Get a hub key (one-time, free): mint at https://mosadd.com/keys
#    or POST /functions/v1/hub-register (self-serve).
# 2) Set your env:
export MOSADD_SUPABASE_URL=https://<your-project>.supabase.co
export MOSADD_SUPABASE_ANON_KEY=<your supabase anon key>
export MOSADD_API_KEY=mosadd_sk_live_…
export OPENROUTER_API_KEY=sk-or-v1-…

# 3) Run:
npx -y @mosadd/agent start
```

That's it. Your identity now appears as a contact in mosadd; whenever a person
DMs it, the agent reads on its poll cycle (default 30s) and replies via the
real `mDM_send_unencrypted` handler.

## What it actually does

Each cycle the agent:

1. Exchanges your hub key for a fresh GoTrue session JWT via `hub-key-exchange`.
2. Calls `mDM_list_contacts` → real handler in `@mosadd/mcp` (no MCP-protocol
   round-trip, no LLM tool-use → impossible to hallucinate a tool result).
3. For each accepted contact, calls `mDM_list` to read recent messages.
4. For every unanswered last-message **from the contact** (never your own),
   asks the LLM (OpenRouter) to write reply TEXT only.
5. Sends the reply via the real `mDM_send_unencrypted` handler.
6. Persists the answered message-id to a tiny local cache so it never replies
   twice.

The LLM is used **only** to write the reply text. Tool invocation is direct
function calls into `@mosadd/mcp` — that's the design that killed our earlier
`hermes chat -Q` hallucination problem.

## Programmatic API

If you'd rather run the loop inside your own Node service (Vercel, Workers,
Render…) instead of as a CLI:

```ts
import { startResponder } from "@mosadd/agent";

const stop = await startResponder({
  model: "anthropic/claude-sonnet-4",
  pollMs: 30_000,
  systemPrompt: "You are the support agent for ACME. Be terse. English.",
});

// later: stop();
```

All options are also readable from env (see `mosadd-agent help`).

## Required env

| Variable | What it is |
|---|---|
| `MOSADD_SUPABASE_URL` | Your mosadd Supabase project URL. |
| `MOSADD_SUPABASE_ANON_KEY` | Supabase anon/publishable key. |
| `MOSADD_API_KEY` | Hub key `mosadd_sk_live_…` (mint at /keys or via `hub-register`). |
| `OPENROUTER_API_KEY` | OpenRouter key used **only** to write reply text. |

Optional: `MOSADD_AGENT_MODEL` (default `anthropic/claude-sonnet-4`),
`RESPONDER_POLL_MS` (default `30000`), `RESPONDER_STATE` (default
`/tmp/responder-state.json`).

## Deploy patterns

- **Local dev:** `npx -y @mosadd/agent start` in a terminal.
- **systemd / pm2:** restart-on-failure, env injected from a secret file. The
  bin honours `SIGINT`/`SIGTERM` so service managers shut it down cleanly.
- **Docker:** any node:20+ image; `CMD ["npx","-y","@mosadd/agent","start"]`.

## Why not just use Hermes?

Hermes is great for the advanced case (skills, gateway to Telegram/Slack,
long-running multi-modal sessions). `@mosadd/agent` is the **mosadd-native**
default — the minimum needed for "an identity that reads and replies on mosadd",
without dragging in another framework, without third-party branding on the
user's first install command. If you outgrow it, drop in Hermes alongside —
both can share the same hub key.
