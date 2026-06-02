import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Ul, Pre, Callout, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Credentials & login',
  description: 'Authenticate the mosadd MCP server with one command — mosadd login — instead of pasting a JWT.',
};

export default function AuthPage() {
  return (
    <Prose>
      <H1>Credentials &amp; login</H1>
      <Lead>
        The mosadd tools act on your behalf against a mosadd backend (Supabase, BYOK). Authenticate once with{' '}
        <code className="font-mono text-primary">mosadd login</code> — no DevTools, no copy-pasting tokens.
      </Lead>

      <H2>mosadd login</H2>
      <P>
        After installing the MCP server, sign in. You need your mosadd <strong>Supabase project URL + anon key</strong>{' '}
        (both public) and your <strong>email + password</strong>:
      </P>
      <Pre lang="bash">{`npx -y @mosadd/mcp login
# or, if installed globally:  mosadd login

Supabase URL:      https://<project>.supabase.co
Supabase anon key: <anon key>
Email:             you@example.com
Password:          ••••••••`}</Pre>
      <P>
        Non-interactive (CI / scripts) — pass flags or env instead of prompts:
      </P>
      <Pre lang="bash">{`mosadd login \\
  --url "$SUPABASE_URL" --anon "$SUPABASE_ANON_KEY" \\
  --email "$EMAIL" --password "$PASSWORD"`}</Pre>
      <P>
        On success the session is written to{' '}
        <code className="font-mono text-primary">~/.mosadd/session.json</code> (mode 600). The MCP server picks it up
        automatically — <strong>no env vars required</strong>.
      </P>

      <Callout type="success">
        <code className="font-mono">mosadd whoami</code> shows who you&apos;re signed in as and whether the token is
        still valid. <code className="font-mono">mosadd logout</code> clears it.
      </Callout>

      <H2>Env vars (alternative / override)</H2>
      <P>Env vars always take precedence over the saved session — useful for CI or multiple accounts:</P>
      <Ul>
        <li><code className="font-mono text-primary">MOSADD_SUPABASE_URL</code> — your Supabase project URL</li>
        <li><code className="font-mono text-primary">MOSADD_SUPABASE_ANON_KEY</code> — the public anon key (RLS-gated)</li>
        <li><code className="font-mono text-primary">MOSADD_USER_JWT</code> — a session access token</li>
      </Ul>

      <H2>Token expiry</H2>
      <P>
        Access tokens are short-lived. If a tool returns{' '}
        <code className="font-mono">Your mosadd session has expired</code> or{' '}
        <code className="font-mono">Unable to resolve current user</code>, just run{' '}
        <code className="font-mono text-primary">mosadd login</code> again.
      </P>

      <Callout type="info">
        Don&apos;t have a backend yet? The zero-setup hosted gateway (<code className="font-mono">mcp.mosadd.com</code>,
        sign-up → API key, no Supabase needed) is coming in Phase 2 — see{' '}
        <Anchor href="/pricing">pricing</Anchor>. Until then, mosadd-os is BYOK against your own mosadd Supabase.
      </Callout>

      <P>
        Next: <Anchor href="/docs/quickstart">Quickstart</Anchor> · <Anchor href="/docs/mcp">40-tool reference</Anchor>
      </P>
    </Prose>
  );
}
