---
name: mosadd-mail
description: Send and read email through the mosadd OS module mAIL. Every mosadd user has a personal address `<userId>@mosadd.com` — outgoing mail flows through the mosadd mp0st pipeline. Use when the user asks to send an email or read a message by id.
---

# mosadd Email (mAIL)

This skill operates the **mAIL** OS module of [mosadd](https://mosadd.dev). Every mosadd user gets `<userId>@mosadd.com` as a built-in address — no separate email provider needed.

## When to invoke

Trigger on these user intents:
- "Email <recipient> about <topic>" — `mAIL_send`
- "What did <X> say in their email?" / "Open message <id>" — `mAIL_view`

For **listing the inbox**, the alpha doesn't ship `mAIL_list_inbox` yet — direct the user to the mosadd web app (mosadd.com) to browse.

## How to operate

1. **Pick body format.** Default to `body_text` for short messages. Use `body_html` when the user explicitly wants formatting (links, lists, images). Both can be present.

2. **Multiple recipients.** `to` accepts either a single email or an array (up to 50). Use `cc` / `bcc` for the obvious roles.

3. **Reply-to.** If the user wants replies routed somewhere else (e.g. an alias), pass `reply_to`. Otherwise replies go to the user's `<userId>@mosadd.com`.

4. **Subjects.** Match the user's tone. Don't add a subject they didn't ask for. RFC 5322 caps at 998 chars — clip if needed.

## Example

> **User:** "Send Alice an email with subject 'Quote for project X' and body 'Hi Alice, attached is the quote. Best, M.'"
>
> **You:**
> 1. `mAIL_send({ to: "alice@example.com", subject: "Quote for project X", body_text: "Hi Alice, attached is the quote. Best, M." })` → `{ message_id, queued_at }`
> 2. Reply: "Sent to alice@example.com. (Note: alpha doesn't auto-attach files — paste the quote inline or share a link.)"

## Configuration

Outbound delivery uses Resend by default in alpha. The mosadd hub will broker BYOK Resend / Mailgun / SendGrid in Phase 2 — for now the user's m0ssad-3 Supabase backend handles routing transparently.

## Don't

- Don't fabricate recipient addresses if the user gave a name not an email — clarify or look up via context.
- Don't promise tracking pixels or read receipts — they're a separate concern (mp0st-beacon), not in mAIL_send.
- Don't suggest mAIL for instant messaging — that's `mDM_send` (the user almost always wants the chat module).
