# RFC-0005: mURL skill for the Anthropic Skills bundle

- **Status:** Accepted
- **Author:** @Hei33enberg
- **Created:** 2026-07-15
- **Last updated:** 2026-07-15
- **Supersedes:** (none)
- **Superseded by:** (none)

## Summary

Add `skills/murl/SKILL.md` to the Anthropic Skills bundle and register it in the Claude Code plugin marketplace — closing the one-module gap noted in [`skills/README.md`](../../skills/README.md) ("mURL … has no SKILL.md in this bundle yet").

## Motivation

mURL is a shipped core module ([RFC-0001](./0001-module-naming.md) lists it live; four tools are registered in `@mosadd/mcp`), but it is the only one of the four modules without a skill. The bundle's contract is one-skill-per-module: a `SKILL.md` teaches Claude *when* to reach for the module's tools and how to use them honestly. Without it, Claude users get mDM/mIRC/mAYL/mTALK/mRAG trigger discipline but must discover `mURL_*` on their own.

## Detailed design

**Skill file:** `skills/murl/SKILL.md`, following the established template (frontmatter → When to invoke → How to operate → Configuration → Example → Don't).

Frontmatter:

```yaml
name: mosadd-murl
description: Read, post to, and discover the live chat channel attached to any web domain or URL (mURL — IRC for URLs). …
```

**Tool surface covered** (exactly the four registered tools in `packages/mcp/src/tools/murl.ts`; no new API):

- `mURL_read_channel({ domain, limit? })` → recent messages for a domain/page room
- `mURL_post({ domain, text, from? })` → post (max 2000 chars / 3 lines, Worker-enforced)
- `mURL_presence({ domain })` → live count + roster + status (public, no key)
- `mURL_list_channels({ action?: trending|list|mine, limit?, hours?, status?, cursor? })` → discovery (Supabase edge function)

**Operating rules encoded in the skill:** per-URL keying per [RFC-0004](./0004-murl-per-url-keying.md) (bare domain → domain room; URL with path → per-page room); read-before-post; always pass `from`; posture honesty — mURL is transport-encrypted, public by design, never described as E2EE (per [docs/security/e2ee-posture.md](../security/e2ee-posture.md)).

**Registration:**
- `skills/.claude-plugin/marketplace.json` — add `{ "name": "mosadd-murl", "path": "../murl/SKILL.md" }` (after `mosadd-mirc`, matching module order) and sync `version` with `packages/mcp`.
- `skills/README.md` — add the murl row to the Shipped table; drop the gap note.

## Drawbacks

- mURL rooms are public by design; a skill that makes posting easier also makes misuse easier. Mitigated by the skill's Don't section (no secrets, no spam-posting, no impersonation, content is unverified signal).
- Bundle grows by one skill (marginal token cost for Claude users who never touch mURL).

## Rationale and alternatives

- **Status quo** (drive `mURL_*` tools directly) already works, but loses trigger discipline and — more importantly — the honesty framing that every other module's skill carries inline.
- A combined "web tools" skill was rejected: the bundle's contract is one-skill-per-module, and mURL's public-by-design posture deserves its own Don't list.

## Prior art

- The five existing skills (`mdm`, `mirc`, `mail`, `mtalk`, `mrag`) — same template, same registration path.
- [RFC-0004](./0004-murl-per-url-keying.md) — per-URL keying that this skill teaches.

## Unresolved questions

- None for this RFC; the skill covers only registered tools.

## Future possibilities

- A reviews/opinions layer on mURL channels may extend this skill with dedicated triggers.
- Domain-owner workflows (claim/verify/branding) could join once exposed as MCP tools.
