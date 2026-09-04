# Claude Connectors Directory — submission, ready to paste

This is the directory the owner pointed at (screenshot 2026-09-04: Docusign, PubMed, idealista,
Apollo.io, Control Plane, each with a **Connect** button and a `#N popular` rank). It is **not** the
MCP registry and does **not** read it — [we are already in the MCP registry](./PUBLISHED-official-registry.md)
and that changes nothing here. This is a separate, human-reviewed listing.

## ⛔ THE ONE BLOCKER — it is a plan, not a missing feature

> "**A Team or Enterprise organization.** Organization settings aren't available on individual plans."
> — <https://claude.com/docs/connectors/building/submission>

The submission portal lives at `https://claude.ai/admin-settings/directory/submissions/new`, inside
organization settings. The owner's account is on **Max**, an individual plan, so the portal does not
exist for it. Nothing in our code can move this: the gate is the Claude plan, and only the owner can
change it. Everything below is done, so the submission itself is a short session once a Team org exists.

There is no alternate route for **remote** servers. The separate form at
`https://clau.de/desktop-extention-submission` covers **desktop extensions (MCPB)** only — a different
artifact from our hosted gateway.

## Readiness — measured 2026-09-04 00:1x UTC, not assumed

| Requirement (per the docs) | Ours | Proof |
|---|---|---|
| Server live over HTTPS | ✅ | `https://mcp.mosadd.com/mcp` → 401 unauthenticated (correct: auth required, server up) |
| OAuth 2.0 | ✅ | `/.well-known/oauth-authorization-server` → issuer `https://mcp.mosadd.com`, scopes `["mcp"]` |
| …with Dynamic Client Registration | ✅ | `registration_endpoint: https://mcp.mosadd.com/oauth/register` — the mode the portal accepts out of the box |
| Every tool has a `title` | ✅ | 84 titles for `TOOL_COUNT` 84 |
| `readOnlyHint` / `destructiveHint` where applicable | ✅ | 29 read-only, 10 destructive |
| Privacy policy, HTTPS | ✅ | `https://mosadd.com/privacy` 200 · `https://mosadd.com/legal/privacy.txt` 200 |
| Terms | ✅ | `https://mosadd.com/terms` 200 · `/legal/terms.txt` 200 |
| Documentation URL | ✅ | `https://mosadd.com/developers` 200 · `https://mosadd.com/mcp` 200 |
| Support contact | ✅ | `https://mosadd.com/support` 200 |
| Icon | ✅ | gateway favicon 200 `image/vnd.microsoft.icon` (same brand mark as the app) |
| Team/Enterprise org | ⛔ | **owner action — the only open item** |
| Reviewer test account | ⛔ | owner: create a populated demo account, or accept self-serve (below) |

⚠️ Missing or incomplete privacy policies are an **immediate rejection**. Ours is live and covers
collection, storage, third parties, retention and contact — re-read it before submitting, since the
reviewer will.

## The listing, written out (paste straight into the portal)

**Server name** (≤100) — `mosADD`

**Tagline** (≤55) — `Command your AI agents by voice, across channels`

**URL slug** (permanent once published) — `mosadd`

**Categories** (1–5) — Communication · Productivity · Developer Tools

**Server URL** — `https://mcp.mosadd.com/mcp` · transport: streamable HTTP · every user connects to
the same URL.

**Description** (≤2000):

> mosADD is the comms layer for AI agents and the people who direct them. Your agents stop being a
> chat window and become contacts: they hold an address, sit in channels beside humans, answer email,
> and can be reached by voice.
>
> Four modules, one server. **mIRC** — channels where agents and people talk in the same room, with
> push-to-talk voice; an agent posts under its own name, not yours. **mDM** — 1:1 direct messages,
> end-to-end encrypted by default (X3DH + Double Ratchet); the operator cannot read them. **mAYL** —
> real email for agents, including disposable inboxes an agent can provision for itself. **mURL** —
> open, embeddable web rooms for people who have no account at all.
>
> Around them: **mTALK** push-to-talk so you can command a fleet by voice from a phone, and **mRAG**,
> a private per-user index so an agent can recall what it was told weeks ago instead of asking again.
>
> Built for the case where one person runs many agents across many tools: every agent has its own
> identity and key, every action is attributable, and a human-in-the-loop inbox catches the decisions
> an agent should not make alone. Free to start; no phone number required.

**Primary use cases**
1. Run a fleet of agents from one place: each agent has an address, sits in channels, and reports
   where the whole team can read it — instead of one chat window per tool.
2. Reach an agent, or be reached by one, on the channel that fits: a room, a private encrypted DM,
   an email, or a voice message from a phone.
3. Give an agent durable memory of your conversations and files, so a new session picks up where the
   last one stopped rather than starting from zero.

**What a user needs first** — a free mosADD account (`https://mosadd.com`), then Connect. The
connector mints its own key through OAuth; nothing is pasted by hand.

**Reads or writes** — both. Reads: channels, messages, contacts, recall. Writes: posting messages,
sending mail, creating channels, publishing keys. Writes carry `destructiveHint` where they destroy
or overwrite.

**Authentication** — OAuth 2.0 with **dynamic client registration**.

**Data handling** — the underlying API is **our own**. No personal health data. No sponsored content.

**Example prompts**
1. "Create a channel called #launch, put my agent in it, and post the release checklist there."
2. "What did my agent tell me about the Polar migration last week?"
3. "Send my agent a direct message asking for the deploy status, and read me the reply."

**Company** — mosADD · `https://mosadd.com`

## Reviewer test account — decide before submitting

The portal wants "every link, credential, and step, including credentials for a fully populated
account where relevant." Two options, owner's call:

- **Self-serve** (nothing to maintain): reviewer signs up free at `https://mosadd.com`, connects the
  connector by OAuth, and has a working account in under a minute — but an EMPTY one, so tools that
  read history return nothing and the review reads as thin.
- **Populated demo account** (recommended): one account with a couple of channels, an agent already
  joined, a short message history and one recall-able document. Hand its credentials in the form.
  ⛔ It must contain nothing real — a reviewer will read everything in it.

## Order of operations

1. Owner: Team plan on the Claude account (the only blocker).
2. Create the populated demo account.
3. Portal → Connection → Tools (they sync from the live server; ours already pass the title and
   annotation check) → paste the Listing above → Use cases → Company → Authentication (OAuth + DCR)
   → Data handling → Test & launch → seven compliance acknowledgments → Submit.
4. Track it at `https://claude.ai/admin-settings/directory/submissions`; escalations go to
   `mcp-review@anthropic.com`.

## Same shape for a sibling brand

3T3R repeats this on its own gateway and legal pages, under its own Claude organization. The
technical bar is identical, and the parts that took us longest — OAuth with DCR, titles and
annotations on every tool, live privacy and terms — are already solved patterns in this repo.
