# Multi-machine agent workstation — architecture (phased, plan-only)

> Status: **design, not built** (2026-07-14). Owner-approved as a *plan* — no runtime code lands until each phase is separately signed off. Companion to [`OWNER-GUIDE.md`](./OWNER-GUIDE.md), which describes what exists today.

## Vision
Turn each **mosADD desktop (Electron)** — and the headless `@mosadd/agent` runtime — into a **node**: a machine that one owner (and, later, a permitted team) can **drive through mosADD**. Run agent sessions on it like Claude Code / Hermes, and reach **across your machines** with **cross-access governed by permissions**. The messenger *is* the control plane: you already talk to agents as contacts — a node is just a contact that can also *act on a machine*, always behind your consent.

## Why this is tractable (what we reuse — we are not starting from zero)
The identity, transport, and consent spine already exist:
| Need | Existing primitive |
|---|---|
| Machine identity + ownership | `identities.owner_user_id` (the one-owner→many-agents rollup) + `hub_api_keys` |
| Auth (uniform everywhere) | `hub_api_keys` → `hub-key-exchange` → short-lived session JWT |
| Per-action consent + audit | Electron **`ConsentBroker`** (`apps/desktop/mcp/consentBroker.cjs`) → per-call approval, memory-only grants, audited to `mcp_audit_log` |
| A local tool server pattern | Electron **`ragMcpServer.cjs`** (127.0.0.1, MCP over JSON-RPC) |
| A live session as a contact | **`mosadd-connect`** (session shows ACTIVE, reads DMs, executes directives) |
| Device pairing | `pair-initiate` / `pair-approve` / `pair-poll` + `pair_sessions` |
| Task directives | `coord-execute` / `work_orders` (dispatcher → members, `[status]`/`[done]`) |
| Remote tool transport | the `mcp.mosadd.com` gateway (stateless, per-request caller creds) |

What is genuinely **missing**: command execution, scoped filesystem access, remote/cross-machine control, and a roles/permissions (RBAC) model. Those are the phases below.

## Security posture (applies to every phase)
- **Default-deny.** A node exposes nothing until a capability is explicitly granted.
- **Per-call consent.** Every action that touches the machine goes through the `ConsentBroker` (allow-once / allow-session), reset on sign-out / identity switch.
- **Capability scopes on the key.** The hub key carries which capabilities it may invoke (server-enforced), not just a plan tier.
- **Full audit, fail-closed.** Every invocation is logged (`mcp_audit_log`); on any doubt the node refuses.
- **Owner-brokered.** No machine talks to another machine directly — the owner's authority mediates.
- **OSS + self-host.** The node runtime is Apache-2.0; you can run it entirely on your own hardware.

## Phases (each separately owner-signed-off before build)

### Phase 1 — Node identity + registration  *(safe: ownership only, no execution)*
A machine registers itself as a **node owned by `owner_user_id`** using a **capability-scoped hub key**.
- Backend (CTO-1): add capability scopes to `hub_api_keys` (or a `node_grants` table); model a node as an `identities` row (`kind='node'`) tied to `owner_user_id`, reusing `pair_sessions` for the enroll handshake.
- Client (CTO-2): a "register this machine" flow in the desktop app + `@mosadd/agent`; a **Fleet** view listing your machines with a live status dot.
- Outcome: *"my machines"* appear as a governed fleet, each with an identity and an owner. **Zero execution capability** — this is pure plumbing and is safe to ship first.

### Phase 2 — Capabilities in the node runtime  *(the sensitive core)*
Add real powers to the node (Electron main process and/or `@mosadd/agent`), each behind ConsentBroker **and** a server-side capability scope **and** audit:
- `exec` — run a command, starting with the **safest shape**: an **allow-list** of commands, in a **scoped working directory**, over a PTY, output streamed back as messages.
- `fs` — read/write within a **scoped path** only.
- `rag` — query the machine's local mosADD memory (already exists, read-only).
- `screen-frame` — a single screenshot on request (view-only; the primitive already exists via `comms_action` screen_share).
Ship `exec` last and narrowest. Nothing here lands without a dedicated review.

### Phase 3 — Owner control surface
- A **Fleet cockpit** view + **DM a node** to drive it; results stream back as messages using the coordination markers (`[status]`, `[done]`, `[need-human]`).
- **MCP tools** `node_list` / `node_exec` / `node_read` so your *agents* (Claude Code, Cursor) can drive nodes too — the agent asks, you approve.

### Phase 4 — Team / RBAC
- A `node_grants` ACL: *which identity or role* may invoke *which capability* on *which node*. Reuse the mIRC channel role ladder (owner > admin > moderator > member).
- This is what makes "manage others' machines by permission" real and safe.

### Phase 5 — Cross-machine (node → node)
- Node A acting on Node B, **brokered by the owner's authority** — never a direct remote shell. The owner's session (or an explicitly granted role) mediates every hop, fully audited.

## Sequencing & risk
1. **Phase 1 first** — it is safe (ownership, no exec) and unlocks the Fleet view immediately.
2. **Phase 2 `exec`/remote is a large attack surface** — only after Phase 1, only allow-listed + scoped + consented + audited, and only with a separate owner sign-off.
3. Naming/positioning stays on-brand with mosadd.com: *"fleet cockpit," "agents are contacts,"* honest about what each capability can and cannot do.

## Division of labour  *(confirmed by CTO-1, 2026-07-14)*
- **Backend / security (CTO-1):** capability scopes on `hub_api_keys`, `node_grants` / RBAC, node identity + RLS, the enroll handshake, server-side capability enforcement, **and the exec/fs sandbox itself + audit** — the security-critical core.
- **Client / shell (CTO-2):** the Electron/UI layer — node registration in the main process, the Fleet view, ConsentBroker capability prompts/UX, the `node_*` MCP tool surface.
- **Hard gate:** nothing from the exec phase (Phase 2+) lands without the founder's separate sign-off.
