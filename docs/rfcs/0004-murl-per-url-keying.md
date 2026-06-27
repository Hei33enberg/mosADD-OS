# RFC-0004 — mURL keys PER-URL (not per-domain)

**Status:** Accepted (founder delegated the call to CTO#2, 2026-06-27)
**Drivers:** RAK reader wants a live chat room **per article**. mURL is "IRC-for-URLs" — the
right primitive — but the code keyed rooms by **domain only**, collapsing every article on a
site into one room. (An earlier CTO#2 take suggested mIRC-per-article as a workaround; that was
wrong — the founder changed the channel rules and mURL is the answer. This RFC makes the code
match the rule.)

## Decision
A mURL room is keyed by the **canonical URL**, not the domain.

- **Slug** = `host("."→"-")` + each path segment (`"/"→"__"`), with scheme, query, fragment and
  trailing slash stripped and segments sanitised to `[a-z0-9-]`.
- A **bare domain** (no path) → the **domain room** — unchanged behaviour, fully back-compatible.
- A **URL with a path** → a **per-page room** (the per-article ask).

Examples:
| input | slug | room |
|---|---|---|
| `rak.ad` | `rak-ad` | domain room (as today) |
| `https://rak.ad/artykul/abc/?utm=x#c` | `rak-ad__artykul__abc` | that article's room |
| `https://www.rak.ad/sekcja/x/y` | `rak-ad__sekcja__x__y` | that page's room |

The **host** is still derived for status/branding/blocking — a domain block (`rak.ad` claimed/blocked)
covers **all** its page rooms (`domain = slug.split("__")[0]`).

## Changes
### 1. MCP tool — `packages/mcp/src/tools/murl.ts` ✅ DONE (this commit, authored by CTO#2)
`domainToSlug` → `urlToSlug`: keeps the path instead of stripping it; same 4 tools, same names,
same counts — only the keying changes. The `domain` arg now accepts a full URL and is documented
as per-URL. Backward compatible (bare domain → domain slug). **Needs an npm republish to ship**
(see Rollout).

### 2. Edge Worker — `apps/edge/src/index.ts` ⛔ CTO#1 to apply + deploy (Cloudflare lane)
`ensureDomainStatus` derives the domain from the slug to check open/claimed/blocked. With page
slugs (`rak-ad__artykul__abc`) the old `slug.replace(/-/g,".")` produces garbage. One-line fix —
derive the host from the slug **prefix before the first `__`**:

```diff
- body: JSON.stringify({ slug, domain: slug.replace(/-/g, ".") }),
+ body: JSON.stringify({ slug, domain: slug.split("__")[0].replace(/-/g, ".") }),
```

**CTO#1 verification before deploy:** confirm nothing else in the Worker (route parsing, any
`/c/{slug}` charset validation, branding-by-domain, `domain-channel-ensure` EF) rejects `__` in a
slug or re-derives the domain a second way. The DO is per-slug, so per-page DOs are free; only the
domain-status derivation needed the fix above. `domain-channel-ensure` should treat an unknown page
slug as `open` (auto-create) exactly as it does unknown domains today.

## Rollout (coordinated — NOT unilateral)
1. CTO#1 applies the edge diff + deploys `mosadd-edge` (Cloudflare).
2. CTO#1 republishes `@mosadd/mcp` (founder's npm token) with the `murl.ts` change → bump alpha.
   Tool-token/count/server.json are unchanged, so this folds into the normal republish lane.
3. Order: edge first (so page slugs resolve correctly), then republish the tool. Either order is
   safe for the domain rooms (back-compat), but page rooms only behave fully once both land.

## Consumer (RAK) impact
RAK calls `mURL_read_channel` / `mURL_post` with the article's **canonical URL** (not the bare
domain) → its own room. The relay just forwards the canonical URL as the `domain`/url arg + the
reader's `from` nick. Seed-on-publish: agent posts the TL;DR to the article URL. No subdomain
hack, no mIRC, no per-article id bookkeeping — the URL *is* the key. See LINEAR-4017.

## Non-goals / later
- The drop-in `<script>` embed surface (`comms_embed_create` + `embed-keys` EF) stays undeployed —
  RAK renders with its own irc-bubble + relay, so it's off the path.
- Anon identity stays a client-reimplemented pattern (FNV-1a nick); for per-page-coherent nicks,
  seed on the canonical URL.
