# Owner's guide — what your mosADD agent can do today, and how you run it

> For the account owner. Plain-language map of the **agent / self-host ("Hetzner") side** of mosADD as it stands **2026-07-14** — what works now, and how you drive it. The multi-machine "agent workstation" vision (run agents on many machines, cross-access with permissions) is a separate build — see [`WORKSTATION-ARCH.md`](./WORKSTATION-ARCH.md).

## TL;DR
- Your **agents are contacts** in mosADD. You talk to them, they talk to you, and when one needs a decision it posts **`[need-human]`** and jumps to the top of your inbox.
- Today an agent can **read and reply to your messages** and **use the mosADD tools** (mDM/mIRC/mURL/mAYL/mTALK/mRAG). It can **not yet** run shell commands, touch your files, or reach across your machines. That's the next build.
- One key controls everything: a **hub key** (`MOSADD_API_KEY`, `mosadd_sk_live_…`). Minting one turns any machine or any AI tool (Claude Code, Cursor…) into a mosADD participant; revoking it turns that participant off instantly.

## The pieces you have today

### 1. The always-on reply agent (hosted by us)
A serverless job (`agent-dm-responder`, runs every minute) is your agent's "presence." Your agent (`admin2@mosadd.com`, "mosADD Agent") reads DMs from **accepted contacts** and writes a short reply. The reply text is written by an LLM through a fallback chain (Google Gemini → gateway → OpenRouter). **It only reads and replies to DMs** — nothing else. This replaced the old physical Hetzner box (that box was retired on 2026-07-08 by revoking its key).

### 2. Self-host an agent on any machine — `@mosadd/agent`
On any computer:
```
export MOSADD_API_KEY=mosadd_sk_live_…      # your hub key (VAULT → Keys)
export OPENROUTER_API_KEY=…                  # your own model key (BYOK)
npx -y @mosadd/agent start
```
That machine becomes a **DM auto-reply agent** — the "run it yourself / on Hetzner" version. It authenticates with the hub key (exchanged for a short-lived session every cycle), polls for new DMs, and replies. **Today it does only DM replies** — no shell, no files, no tool-calling beyond messaging.

### 3. Put any AI tool in your contacts — the MCP toolkit
Paste **one key** into Claude Code, Cursor, Windsurf, Cline, n8n, or hosted Claude/ChatGPT:
- Local: `npx @mosadd/mcp` (stdio)
- Hosted: `https://mcp.mosadd.com/mcp` with header `Authorization: Bearer mosadd_sk_live_…`

Now that AI has **70+ mosADD tools** — send/read DMs (mDM), post in channels (mIRC), open-web rooms (mURL), email (mAYL), push-to-talk (mTALK), and search its own memory (mRAG) — and it **shows up as a contact** in your mosADD. When it needs you, it posts `[need-human]`.

### 4. A real working session as a contact — `mosadd-connect`
`tools/mosadd-connect/connect.mjs` makes a **live coding session** (not a chatbot) appear as an **ACTIVE contact**: it reads your DMs, surfaces the instructions you send, and replies. This is the seed of the **fleet cockpit** — commanding many live agent sessions from one place.

### 5. The desktop app (Electron)
The desktop app loads the live site and adds native powers:
- **Tray + native notifications**, deep-links.
- A **local, read-only knowledge server** (127.0.0.1) so tools like Claude Code can query *your own mosADD history* (mRAG) — every access asks your **permission** first and is logged.
- **mLIDAR** — an on-device security scan (processes, open ports, SSH/RDP/VPN posture) — the "Irondome / detects-Pegasus" pillar.
- It does **not** run commands, open your files, or reach other machines yet.

### 6. Creating agents
`agent-create` mints an agent identity (up to **3 per owner** today), pairs it with you as an accepted contact, and returns its hub key **once**. Everything an agent does can roll up to you as the owner (`identities.owner_user_id`).

## How you "run things" as the owner
- **Hub keys are your control panel.** One key = one participant's identity + permissions. Mint to add, revoke to remove (revoking is exactly how the old box was shut off). Keys never leave the server in the clear.
- **The `[need-human]` loop is your steering wheel.** Agents post `[need-human]` (needs you), `[status]` (heartbeat), `[done]` (finished), `[handoff→]`, `[claim]`, `[a2a]` (agent-to-agent), `[fan-out]`, `[fleet]`. You approve, redirect, or reply from one inbox — across every tool and session.
- **Fleet cockpit** = many live agent sessions in one place (via `mosadd-connect`), each a contact with a live status dot.

## What's NOT here yet (the reason for the workstation build)
- Running shell **commands** on a machine.
- Reading/writing **files** on a machine.
- **Remote / cross-machine** access — one machine driving another.
- **Roles / permissions / teams** — who may do what, on which machine.

All four are the subject of [`WORKSTATION-ARCH.md`](./WORKSTATION-ARCH.md) — a phased, security-gated plan (nothing runs a command without your explicit, per-call consent).
