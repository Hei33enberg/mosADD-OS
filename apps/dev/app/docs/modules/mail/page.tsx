import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mAIL',
  description: 'Email — every user gets <id>@mosadd.com. Provider-agnostic.',
};

export default function MailPage() {
  return (
    <Prose>
      <H1>mAIL</H1>
      <Lead>Email — every user gets a <code className="font-mono text-primary">&lt;id&gt;@mosadd.com</code> address. Provider-agnostic.</Lead>

      <P>
        <code className="font-mono text-primary">mAIL</code> is the email OS module. Outbound via Resend or SES.
        Inbound via a Postfix-backed catch-all that drops into the threat radar before delivery.
      </P>

      <H2>Tools</H2>

      <H3>mAIL_list</H3>
      <Pre lang="ts">{`mAIL_list({
  direction?: 'inbound' | 'outbound',  // omit for both
  limit?: number,                       // default 50, max 200
  before?: string,                      // pagination: pass prior next_cursor
})
→ {
  emails: {
    message_id, direction, from, to, subject,
    priority, status, sent_at, snippet,
  }[],
  next_cursor: string | null,
}`}</Pre>

      <H3>mAIL_send</H3>
      <Pre lang="ts">{`mAIL_send({
  to: string | string[],   // single, or array of up to 50
  subject: string,
  body_text?: string,      // plain text body (one of body_text/body_html required)
  body_html?: string,      // HTML body
  cc?: string[],
  bcc?: string[],
  reply_to?: string,
})
→ { message_id, queued_at }`}</Pre>

      <H3>mAIL_view</H3>
      <Pre lang="ts">{`mAIL_view({ message_id })
→ { message_id, from, to, subject, body_text, body_html, received_at }`}</Pre>

      <H3>mAIL_delete</H3>
      <Pre lang="ts">{`mAIL_delete({ message_id })   // soft-delete; drops out of mAIL_list. Your own mail only.
→ { ok: true, message_id, deleted: true }`}</Pre>

      <H3>mAIL_stats</H3>
      <Pre lang="ts">{`mAIL_stats({ message_id })   // engagement rollup for one sent email
→ { summary: {
    message_id, subject, to, direction, status, sent_at,
    open_count, unique_opens, click_count, forwarded,
    first_opened_at, last_opened_at,
    events_by_type, total_events,
  } }`}</Pre>

      <H3>mAIL_events</H3>
      <Pre lang="ts">{`mAIL_events({ message_id })   // raw engagement timeline
→ { summary, events: {
    event_type,            // pixel_open | link_click | forwarded | page_view | copy_detected | print_detected | ...
    at, device, ip_hash, link_url,
  }[] }`}</Pre>

      <H3>mAIL_metrics</H3>
      <Pre lang="ts">{`mAIL_metrics({})   // mailbox-wide aggregate across sent mail
→ { mailbox: {
    total_sent, opened_emails, open_rate_pct,
    total_opens, total_clicks, forwarded_emails,
  } }`}</Pre>

      <H2>Engagement tracking</H2>
      <P>
        Outbound mail is sent with a tracking pixel and link-wrapping, so <strong>opens and link clicks
        are measured reliably</strong> (per-recipient, IP-hashed for GDPR). <code className="font-mono">mAIL_stats</code>/<code className="font-mono">mAIL_events</code>/<code className="font-mono">mAIL_metrics</code> read
        those events back. <strong>Forward detection</strong> is best-effort (inferred from IP /16 subnet diversity);
        <strong> print / copy / save / re-edit</strong> are only observable when the recipient reads mail in mosadd&apos;s
        own renderer (mosadd.com) — for mail that lands in Gmail/Outlook only open + click are reliable. The pixel is
        privacy-sensitive: disclose tracking to recipients and honour opt-out where required.
      </P>

      <H2>Providers</H2>
      <Ul>
        <li><strong>Resend</strong> — default outbound (BYOK <code className="font-mono">MOSADD_RESEND_API_KEY</code>)</li>
        <li><strong>SES</strong> — high-volume outbound</li>
        <li><strong>Postfix</strong> — self-host inbound + catch-all</li>
      </Ul>

      <H2>Threat radar hooks</H2>
      <Ul>
        <li><code className="font-mono">PHISHING.suspicious_link</code> — URL similarity scoring against known brand domains</li>
        <li><code className="font-mono">COMINT.bulk_send</code> — N recipients in M minutes</li>
        <li><code className="font-mono">MASINT.attachment_format_anomaly</code> — file-type mismatch in attachments</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
