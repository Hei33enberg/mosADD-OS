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
      <Lead>Email — every user gets a <code className="font-mono text-radar-green">&lt;id&gt;@mosadd.com</code> address. Provider-agnostic.</Lead>

      <P>
        <code className="font-mono text-radar-green">mAIL</code> is the email OS module. Outbound via Resend or SES.
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
