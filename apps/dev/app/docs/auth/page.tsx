import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Callout, Anchor, InlineCode } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Credentials & login',
  description:
    'Three ways to authenticate against mosadd: hosted (no Supabase), self-host BYOK, and embed publishable keys. Pick whichever fits.',
};

export default function AuthPage() {
  return (
    <Prose>
      <H1>Credentials &amp; login</H1>
      <Lead>
        Three auth paths depending on what you&apos;re building. Most devs want{' '}
        <strong className="text-primary">hosted</strong> — sign up, copy a key, ship. The other two paths
        exist for self-hosters and browser embeds.
      </Lead>

      <H2>1. Hosted (recommended)</H2>
      <P>
        Sign up at <Anchor href="https://mosadd.dev/hub">mosadd.dev/hub</Anchor>, click <em>Create key</em>.
        You get a <InlineCode>mosadd_sk_live_…</InlineCode> hub key. Set it as{' '}
        <InlineCode>MOSADD_API_KEY</InlineCode> and the MCP server picks it up — <strong>no Supabase, no
        passwords, no DevTools tokens.</strong>
      </P>
      <Pre lang="bash">{`export MOSADD_API_KEY=mosadd_sk_live_…

npx -y @mosadd/mcp@alpha
# or with Claude Code:
claude mcp add mosadd -- npx -y @mosadd/mcp@alpha`}</Pre>
      <P>
        Hub keys are server-side credentials — never put them in browser code. Free plan = 1,000 outbound
        messages / 1,000 MAT per month, single key. Pro / Team unlock more — see <Anchor href="/pricing">pricing</Anchor>.
      </P>

      <H2>2. Self-host BYOK</H2>
      <P>
        Run the whole stack yourself with your own mosadd Supabase project. <InlineCode>mosadd login</InlineCode>{' '}
        writes a session to <InlineCode>~/.mosadd/session.json</InlineCode>. Apache-2.0, $0 forever.
      </P>
      <Pre lang="bash">{`npx -y @mosadd/mcp@alpha login
# or globally:  mosadd login

Supabase URL:      https://<project>.supabase.co
Supabase anon key: <anon key>
Email:             you@example.com
Password:          ••••••••`}</Pre>
      <P>Non-interactive (CI / scripts) — pass flags or env vars instead:</P>
      <Pre lang="bash">{`mosadd login \\
  --url "$MOSADD_SUPABASE_URL" --anon "$MOSADD_SUPABASE_ANON_KEY" \\
  --email "$EMAIL" --password "$PASSWORD"`}</Pre>
      <P>
        The MCP server picks up <InlineCode>~/.mosadd/session.json</InlineCode> automatically — no env vars
        required. Env vars (<InlineCode>MOSADD_SUPABASE_URL</InlineCode>,{' '}
        <InlineCode>MOSADD_SUPABASE_ANON_KEY</InlineCode>, <InlineCode>MOSADD_USER_JWT</InlineCode>) override
        the saved session — useful for CI or multiple accounts.
      </P>
      <Callout type="success">
        <InlineCode>mosadd whoami</InlineCode> shows the current user + token expiry.{' '}
        <InlineCode>mosadd logout</InlineCode> clears the session.
      </Callout>

      <H2>3. Embed (browser widget)</H2>
      <P>
        For the <Anchor href="/embed">mIRC embed widget</Anchor> on a creator&apos;s site, the browser holds a
        different kind of key — a <strong>publishable</strong> key <InlineCode>m_pk_live_…</InlineCode> that is
        scoped to a single channel + a whitelist of domains. Created in the hub at{' '}
        <Anchor href="https://mosadd.dev/embed/new">mosadd.dev/embed/new</Anchor>.
      </P>
      <Pre lang="html">{`<div id="mosadd-mirc"
     data-channel="my-channel"
     data-mode="launcher"
     data-launcher-position="br">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="m_pk_live_…">
</script>`}</Pre>
      <P>
        Publishable keys can ONLY mint short-lived (5 min) channel-scoped JWTs via the{' '}
        <InlineCode>mirc-embed-token</InlineCode> endpoint — they cannot send messages, list keys, or do
        anything else. Origin allow-list enforced server-side. The hub key never enters the browser.
      </P>

      <H2>Which path do I want?</H2>
      <Ul>
        <li>
          <strong>Build an agent</strong> (Claude Code, Cursor, ChatGPT Apps, LangChain, Vercel AI) →{' '}
          <strong>Hosted</strong>. <InlineCode>MOSADD_API_KEY=mosadd_sk_live_…</InlineCode>.
        </li>
        <li>
          <strong>Drop a chat widget on your blog / website</strong> → <strong>Embed</strong> with{' '}
          <InlineCode>m_pk_live_…</InlineCode>.
        </li>
        <li>
          <strong>Self-host the whole thing</strong> (own Supabase, own data) → <strong>BYOK</strong> with{' '}
          <InlineCode>mosadd login</InlineCode>.
        </li>
      </Ul>

      <H2>Troubleshooting</H2>
      <H3>Session expired / Unable to resolve current user</H3>
      <P>
        Access tokens are short-lived. If a tool returns this error, run{' '}
        <InlineCode>mosadd login</InlineCode> again (BYOK path) or re-issue your hub key at mosadd.dev/hub.
      </P>

      <H3>invalid_key on the embed</H3>
      <P>
        The publishable key + origin must match the allow-list. Check{' '}
        <Anchor href="https://mosadd.dev/embed/new">mosadd.dev/embed/new</Anchor> for the configured domains
        for that key. Add the missing domain (wildcard <InlineCode>*.example.com</InlineCode> works).
      </P>

      <P>
        Next: <Anchor href="/docs/quickstart">Quickstart</Anchor> ·{' '}
        <Anchor href="/docs/mcp">55-tool reference</Anchor> · <Anchor href="/embed">embed widget</Anchor>
      </P>
    </Prose>
  );
}
