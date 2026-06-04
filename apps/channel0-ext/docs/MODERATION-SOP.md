# mURL — Trust & Safety / Moderation SOP

_Internal runbook for the mURL (codename `channel0`) anonymous per-domain chat.
Owner: mURL agent / CTO. Last verified live: 2026-06-04._

mURL drops an anonymous, domain-scoped chat room onto any website. There is no
account and no human identity — moderation is therefore **automated-first**, with
a manual operator path for anything the automation can't catch (CSAM, threats,
court orders). This document is the operator's runbook.

---

## 1. The moderation chain (how a bad message dies)

All of this is **LIVE on prod** (Supabase `rooffhgbxafyjcwmwpsy`, verified 2026-06-04):

```
 user clicks [!] on a message
        │
        ▼
 channel0-report  (edge fn, verify_jwt=false)
   • validates message_id (uuid), channel_slug, device_token, reason∈{spam,abuse,illegal,other}
   • reporter_hash = sha256(CHANNEL0_DEVICE_SALT : device_token)   ← never stores raw token
   • per-device throttle: 20 reports / 60s  (kills bot flag-storms, leaves legit flaggers viable)
   • UPSERT channel_reports ON CONFLICT (message_id, reporter_hash) DO NOTHING
        │            (one device can NOT ratchet the counter — idempotent)
        ▼
 channel_reports  row
        │
        ▼
 trg_channel0_auto_hide  (DB trigger, SECURITY DEFINER)
   • counts DISTINCT reporters for that message_id
   • at AUTO_HIDE_THRESHOLD = 3  →  UPDATE messages_meta SET deleted_at = now()
        │
        ▼
 message-list  (edge fn) filters `.is('deleted_at', null)`  → message vanishes on next history load
```

Live DO ring buffer (last 100 msgs in the Cloudflare Durable Object) is **not**
retroactively scrubbed by the trigger — the hide takes effect on the durable
(Supabase) record, so it disappears on reload / for late-joiners. For an
**immediate** purge from a hot room, use the kill switch (§4) or a targeted
`message-delete` (§3.2).

### Key facts
| Thing | Value | Where |
|---|---|---|
| Auto-hide threshold | **3 distinct reporters** | `channel0_auto_hide_on_report()` constant |
| Report dedup key | `(message_id, reporter_hash)` UNIQUE | `channel_reports` |
| Reporter identity | `sha256(salt:device_token)` — **not** reversible to a person | by design (privacy/legal) |
| Per-device report rate | 20 / 60s | `channel0-report` |
| Reason enum | `spam` `abuse` `illegal` `other` | client + server validated |

---

## 2. Triage cadence (what the operator does)

**Daily (5 min):** review the report queue, newest first.

```sql
-- Most-reported messages in the last 24h that are NOT yet auto-hidden.
select r.message_id, r.channel_slug, count(*) as reports,
       array_agg(distinct r.reason) as reasons, max(r.created_at) as last_report,
       m.deleted_at
from channel_reports r
join messages_meta m on m.id = r.message_id
where r.created_at > now() - interval '24 hours'
group by r.message_id, r.channel_slug, m.deleted_at
having m.deleted_at is null
order by reports desc, last_report desc
limit 50;
```

**Decision tree per flagged message:**
- `illegal` reason OR content is CSAM / credible threat / doxxing → **§5 escalation immediately** (do not wait for the 3-report threshold).
- 1–2 reports, clearly spam/abuse → leave it; the trigger handles it at 3, or hide manually if egregious.
- Coordinated false-flagging suspected (many reports from few devices in a burst) → check `reporter_hash` spread; the dedup already blocks single-device ratcheting, but cross-device brigading is possible. If false, do nothing (message is fine); if the brigade is itself abuse, consider device bans (§4).

---

## 3. Manual interventions

### 3.1 Hide a specific message right now (operator override)
```sql
-- Soft-delete (same column the auto-hide + message-list filter use).
update messages_meta set deleted_at = coalesce(deleted_at, now()) where id = '<message_uuid>';
```

### 3.2 `message-delete` edge fn
Author-or-moderator soft-delete path already deployed (`message-delete` v7,
verify_jwt=false). Anonymous mURL writers have no auth identity, so operator
hides go through the SQL above or the kill switch — `message-delete` is mainly
for the hub-key / embed surfaces.

### 3.3 Un-hide (false positive)
```sql
update messages_meta set deleted_at = null where id = '<message_uuid>';
-- optionally clear the bogus reports:
delete from channel_reports where message_id = '<message_uuid>';
```

---

## 4. Kill switches & domain controls

| Control | Effect | How |
|---|---|---|
| **Global kill switch** | `channel0-join` returns 503 → no new joins anywhere | set env `CHANNEL0_KILLSWITCH=1` on the edge fn (Supabase → Edge Functions → secrets) |
| **Per-domain disable** | that domain's room closed; `channel0-join` → 451 | `domain_controls.status = 'blocked'` for the domain |
| **Re-open a domain** | restore chat | `domain_controls.status = 'open'` |
| **Device ban** | a specific device can't join | add `reporter_hash`/device-hash to the ban path in `channel0-join` (per-device sha256 salt match) |

Per-domain block (most common operator action):
```sql
update domain_controls set status = 'blocked' where domain = '<example.com>';
-- or insert if the row doesn't exist yet:
insert into domain_controls (domain, status) values ('<example.com>', 'blocked')
on conflict (domain) do update set status = 'blocked';
```
The Worker also re-checks `blocked` from its 60s ensure-cache before accepting a
socket (defense in depth), so a block takes effect within ~1 min on hot rooms and
instantly for new joiners.

---

## 5. Escalation — illegal content (CSAM, threats, court orders)

**This is the one path where speed beats process.** Do NOT wait for 3 reports.

1. **Hide immediately** (§3.1) and **block the domain** if the room is dedicated to it (§4).
2. **Preserve evidence** before any deletion that would destroy it — capture `message_id`, `channel_slug`, `created_at`, `encrypted_payload` (the base64 envelope), and the `reporter_hash` set. Do not delete the `channel_reports` rows for an illegal-content case.
3. **CSAM:** report to NCMEC (US) / IWF (UK/EU) per counsel's instructions. Do not download/redistribute. Owner + counsel gate — this is a legal obligation, not a product decision.
4. **Law-enforcement / court order:** route to the owner + counsel. mURL stores only `sha256(salt:device_token)` — there is **no PII** to hand over by design; be precise about what does and does not exist.
5. Log the action in the abuse inbox referenced by the in-extension "Report abuse / DMCA" link (`https://mosadd.dev/murl/abuse`).

---

## 6. GDPR / data-subject requests

- Durable messages carry `messages_meta.sender_sub`. For mURL writers this is
  `anon:<nick>` (the nick the user chose for that domain); for hub-key chats it's
  the user_id UUID.
- Erasure is by sub: the `dsr_erase_embed_sub` RPC + `embed-dsr-delete` edge fn
  wipe a subject's messages by `sha256(sub)`. A mURL user proving control of their
  nick on a domain is the erase key.
- Reporter identities are already pseudonymous (`sha256(salt:token)`), not PII.

---

## 7. What is intentionally NOT built (and why)

- **No browser fingerprinting.** Device token is a random per-install UUID used
  only as a rate-limit/ban key, salted+hashed server-side. Deliberate legal/privacy
  hygiene — do not "improve" this into a fingerprint.
- **No pre-publish content scanning / AI filter.** Client has a soft profanity +
  link-flood nudge (UX only); the server is authoritative via report→auto-hide +
  rate limits. A pre-publish ML filter is a future option, not MVP.
- **No identity recovery.** Anonymous by design; an operator literally cannot tell
  you who sent a message.

---

## 8. Quick reference — live endpoints (prod)

- `channel0-join` — anon token mint (PoW gate, blocked→451, killswitch→503)
- `channel0-report` — file a report (this doc, §1)
- `channel0-trending` — live room discovery board
- `channel0-owner-stats` / `domain-verify` — domain-owner claim/brand path
- `message-list` — history (filters `deleted_at`)
- Worker: `https://mosadd-edge.mr-brics-33.workers.dev` (`/c/<slug>/ws`, `/c/<slug>/presence`)
