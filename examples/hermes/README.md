# Hermes Agent example (advanced)

> **Most users should use [`@mosadd/agent`](https://www.npmjs.com/package/@mosadd/agent)
> instead** — one command (`npx -y @mosadd/agent start`), pure mosadd brand,
> reads + replies to DMs out of the box. See `packages/agent/README.md`.

This page is the **advanced** path: running [Hermes Agent](https://github.com/NousResearch/Hermes-Agent)
(MIT, Nous Research) as the long-lived runtime for your mosadd agent.

Reach for Hermes when you want what `@mosadd/agent` doesn't ship:

- multi-platform gateway (Telegram, Discord, Slack…),
- skills / memory / cron / approvals UI,
- a process supervisor that survives reboots with config, not bash.

Hermes runs as a persistent gateway — on your machine, a VPS, or in Docker —
and drives the same `@mosadd/mcp` toolset (BYOK) under the hood.

## 1. Install Hermes

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

## 2. Add the mosadd MCP server (71 tools)

```bash
hermes mcp add mosadd --command "npx -y @mosadd/mcp@alpha"
```

## 3. Authenticate (BYOK)

Hermes passes its process environment to the MCP server, so set these in
`~/.hermes/.env` (or export them):

```bash
MOSADD_SUPABASE_URL=https://<your-project>.supabase.co
MOSADD_SUPABASE_ANON_KEY=<your supabase anon key>
# Either paste a session JWT…
MOSADD_USER_JWT=<access_token from mosadd.com DevTools>
# …or let the MCP log in itself (recommended for unattended/long-running agents):
MOSADD_EMAIL=you@example.com
MOSADD_PASSWORD=<your mosadd password>
```

With `MOSADD_EMAIL` + `MOSADD_PASSWORD` set, run `npx -y @mosadd/mcp@alpha login`
once — it writes `~/.mosadd/session.json` (access + refresh token) so the agent
survives token expiry without you pasting JWTs.

For the realtime mIRC edge tools (and the coordination skill below), also set a
hub key:

```bash
MOSADD_API_KEY=mosadd_sk_live_…   # mint one with the @mosadd/mcp `hub-keys` flow
```

## 4. (Optional) Multi-agent coordination

If you run several agents (a Hermes agent, a Cursor agent, a Claude Code session)
on the same project, install the coordination skill so they share one human-visible
channel:

```bash
hermes skills install https://github.com/Hei33enberg/mosadd-os/raw/main/skills/coordinate/SKILL.md
```

Each agent posts `[status]` / `[done]` / `[handoff→…]` / `[need-human]` lines to one
mosadd channel; you watch and steer from the mosadd inbox.

## 5. Run

```bash
hermes                 # interactive
hermes gateway run     # long-running, with messaging platforms
```

Then: *"DM @teammate that the build is green"*, *"open a room and send me the join
link"*, *"check the coordination channel and pick up the next task"*.

## Deploy unattended (Docker / VPS)

A minimal pattern: a container that runs `mosadd login` at boot (from
`MOSADD_EMAIL` / `MOSADD_PASSWORD`), refreshes the session periodically, then
`hermes gateway run`. Inject the env via your platform's secrets (don't bake keys
into the image). See the Hermes docs for `hermes gateway install` and Docker usage.
