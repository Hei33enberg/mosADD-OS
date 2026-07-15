---
name: mosadd-mail
description: Send and read email through the mosadd OS module mAYL (email 3.0, was mp0st). Every mosadd user has a personal address `<userId>@mosadd.com` — outgoing mail flows through the mosadd mp0st pipeline. Use when the user asks to send an email or read a message by id.
---

# mosadd Email (mAYL)

This skill operates the **mAYL** OS module (email 3.0, renamed from `mp0st`) of [mosadd](https://mosadd.com). Every mosadd user gets `<userId>@mosadd.com` as a built-in address — no separate email provider needed.

## Tools (12 registered)

> Tool names below use the `mp0st_*` back-compat aliases (still live). The current/preferred names are `mAYL_*` — e.g. `mAYL_send` for `mp0st_send`.

| Tool | Use it for |
|---|---|
| `mp0st_send` | Send mail from `<userId>@mosadd.com`. Supports `body_text`/`body_html`, `cc`/`bcc`, `reply_to`, plus monitoring/legal options: `tracking`, `force_reader`, `watermark`, `disclose_tracking`, `auto_destruct`. |
| `mp0st_list` | List the user's mailbox newest-first; filter by `direction` (`inbound`/`outbound`); page with `before` + `next_cursor`. |
| `mp0st_view` | Read the full body + metadata of one email by `message_id`. |
| `mp0st_delete` | Soft-delete one of the user's emails by `message_id`. |
| `mp0st_stats` | Engagement summary for one sent email: opens, unique opens, clicks, likely-forwarded, first/last open. |
| `mp0st_events` | Raw per-event engagement timeline for one email (opens, clicks, forwards, reader signals) with timestamps. |
| `mp0st_metrics` | Mailbox-wide aggregate across all sent mail: total sent, open rate, total opens/clicks, forwarded. |
| `mp0st_revoke` | Recall a sent email's secure-reader access (`restore:true` to re-enable). Cannot claw back already-read content. |
| `mp0st_audit_export` | Tamper-evident HMAC-signed engagement audit report for one email (legal/compliance). |
| `mp0st_consent` | Manage recipient tracking opt-outs (GDPR/ePrivacy): `list` / `check` / `optin`. |
| `mp0st_notify` | Recent engagement feed across all sent mail ("who just opened/clicked"); poll with `since`/`cursor`. |
| `mp0st_send_as_agent` | Send mail attributed to the AGENT (stamps `sent_by='agent'` + `agent_id`/`task_id`). Needs `MOSADD_API_KEY` (hub claim). |

## When to invoke

Trigger on these user intents:
- "Email <recipient> about <topic>" — `mp0st_send`
- "What's in my inbox?" / "Show my sent mail" — `mp0st_list` (filter `direction`)
- "What did <X> say in their email?" / "Open message <id>" — `mp0st_view`
- "Delete that email" — `mp0st_delete`
- "Did they open my email?" / "Any opens or clicks?" — `mp0st_stats` (summary) or `mp0st_events` (per-event detail)
- "What's my overall open rate?" — `mp0st_metrics`
- "Notify me who opened my mail" / "any new opens?" — `mp0st_notify`
- "Recall that email" — `mp0st_revoke`
- "Export a delivery/engagement audit for legal" — `mp0st_audit_export`
- "Stop tracking this recipient" / "who opted out?" — `mp0st_consent`
- "Send this on my behalf as the agent" — `mp0st_send_as_agent`

## How to operate

1. **Pick body format.** Default to `body_text` for short messages. Use `body_html` when the user explicitly wants formatting (links, lists, images). Both can be present.

2. **Multiple recipients.** `to` accepts either a single email or an array (up to 50). Use `cc` / `bcc` for the obvious roles.

3. **Reply-to.** If the user wants replies routed somewhere else (e.g. an alias), pass `reply_to`. Otherwise replies go to the user's `<userId>@mosadd.com`.

4. **Subjects.** Match the user's tone. Don't add a subject they didn't ask for. RFC 5322 caps at 998 chars — clip if needed.

## Example

> **User:** "Send Alice an email with subject 'Quote for project X' and body 'Hi Alice, attached is the quote. Best, M.'"
>
> **You:**
> 1. `mp0st_send({ to: "alice@example.com", subject: "Quote for project X", body_text: "Hi Alice, attached is the quote. Best, M." })` → `{ message_id, status, is_internal }`
> 2. Reply: "Sent to alice@example.com. You can check opens/clicks later with `mp0st_stats`."

## Configuration

Outbound delivery uses Resend by default in alpha. The mosadd hub will broker BYOK Resend / Mailgun / SendGrid in Phase 2 — for now the user's mosadd Supabase backend handles routing transparently.

## Don't

- Don't fabricate recipient addresses if the user gave a name not an email — clarify or look up via context.
- Don't claim mAYL is end-to-end encrypted — mail is transport-encrypted and at-rest encrypted but **server-readable by design** (not E2EE). For E2EE 1:1 messaging use `mDM_send`.
- Don't suggest mAYL for instant messaging — that's `mDM_send` (the user almost always wants the chat module).
- Don't enable tracking-heavy options (`force_reader`, `watermark`, `auto_destruct`) unless the user asks — and prefer `disclose_tracking` for GDPR/ePrivacy compliance when tracking is on.
