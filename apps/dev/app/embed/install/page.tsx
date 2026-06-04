import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead, H2, H3, P, Pre, InlineCode, Ul, Anchor, Callout } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'Install the mIRC embed — WordPress, Webflow, Ghost, custom HTML',
  description:
    'Step-by-step install guides for the mosadd mIRC embed widget on WordPress, Webflow, Ghost, Notion, and raw HTML sites. Copy-paste, 60 seconds.',
};

const SNIPPET = `<div id="mosadd-mirc"
     data-channel="my-channel"
     data-mode="launcher"
     data-launcher-position="br">
</div>
<script src="https://embed.mosadd.com/v1.js"
        data-key="m_pk_live_…">
</script>`;

export default function EmbedInstallPage() {
  return (
    <Prose>
      <H1>Install the mIRC embed</H1>
      <Lead>
        Same 6-line snippet on every platform. Below: where exactly each CMS lets
        you paste it. Want the snippet first? It&apos;s at the bottom of every section.
      </Lead>

      <Callout type="success">
        Before any of these: get your <strong>publishable key</strong> at{' '}
        <Anchor href="https://mosadd.dev/embed/new">mosadd.dev/embed/new</Anchor>.
        Add your site&apos;s domain to the allow-list (e.g. <code>myblog.com</code> and{' '}
        <code>www.myblog.com</code>). Copy the <code className="font-mono text-primary">m_pk_live_…</code> key once — you won&apos;t see it again.
      </Callout>

      <H2 id="snippet">The snippet</H2>
      <Pre lang="html">{SNIPPET}</Pre>
      <P>
        Replace <InlineCode>my-channel</InlineCode> with whatever you set when creating the embed key.
        Replace <InlineCode>m_pk_live_…</InlineCode> with the real key. That&apos;s the entire integration.
      </P>

      <H2 id="wordpress">WordPress</H2>
      <H3>Self-hosted (WordPress.org / Bluehost / SiteGround / WP Engine)</H3>
      <Ul>
        <li><strong>Site-wide chat</strong> (every page): Appearance → <em>Theme File Editor</em> →{' '}
          <code>footer.php</code> → paste the snippet just before <code>&lt;/body&gt;</code>. Save.</li>
        <li><strong>Just one post/page</strong>: edit the post → switch the block to{' '}
          <em>Custom HTML</em> → paste the snippet. Publish.</li>
        <li><strong>Via plugin</strong> (no theme edit): install{' '}
          <em>&quot;Insert Headers and Footers&quot;</em> (free) → Settings → Scripts in Footer → paste → Save.</li>
      </Ul>
      <H3>WordPress.com (hosted)</H3>
      <P>
        Free plan: <strong>cannot use third-party scripts</strong> — WordPress.com strips them. Upgrade to{' '}
        <strong>Business</strong> or <strong>Commerce</strong> tier, then use the{' '}
        <em>Custom HTML</em> block in any page/post or the plugin approach above.
      </P>

      <H2 id="webflow">Webflow</H2>
      <P>
        Webflow gives you two clean install spots — pick by scope:
      </P>
      <Ul>
        <li><strong>Site-wide</strong>: Project Settings → <em>Custom Code</em> → <em>Footer Code</em> →
          paste the snippet. Publish to staging or production. The widget loads on every page.</li>
        <li><strong>Single page</strong>: Open the page → Settings (gear icon) → <em>Inside &lt;body&gt; tag</em> →
          paste. Republish. Only that page has the widget.</li>
        <li><strong>Embed element</strong> (lets you place the chat inline, e.g. inside a section): drag an{' '}
          <em>Embed</em> element onto the canvas where you want the chat → paste only the{' '}
          <InlineCode>&lt;div id=&quot;mosadd-mirc&quot;…&gt;&lt;/div&gt;</InlineCode> part. Then put the{' '}
          <InlineCode>&lt;script&gt;</InlineCode> in <em>Footer Code</em>. The element renders where you placed it,
          script auto-finds it.</li>
      </Ul>
      <Callout type="info">
        <strong>Webflow free site plan:</strong> Custom Code is locked. Need at least the{' '}
        <em>Basic</em> hosting plan ($14/mo at the time of writing).
      </Callout>

      <H2 id="ghost">Ghost</H2>
      <P>
        Two clean spots — Ghost calls them <em>Code Injection</em>:
      </P>
      <Ul>
        <li><strong>Site-wide</strong>: Ghost Admin → Settings → <em>Code Injection</em> → <em>Site Footer</em> →
          paste the snippet → Save. Loads on every page including posts.</li>
        <li><strong>Per post</strong>: open the post → click the gear icon → <em>Code Injection</em> →{' '}
          <em>Post Footer</em> → paste → Update.</li>
      </Ul>
      <Callout type="info">
        Ghost(Pro) and self-hosted both support Code Injection out of the box — no plan upgrade needed.
      </Callout>

      <H2 id="ghost-newsletter">Ghost newsletters</H2>
      <P>
        <strong>The widget will NOT render in email clients</strong> — Gmail, Outlook, Apple Mail all strip{' '}
        <InlineCode>&lt;script&gt;</InlineCode> tags. The embed only works on the web post page (where readers click
        through from the email). This is expected — there&apos;s no &quot;chat in email&quot; on any platform.
      </P>

      <H2 id="notion">Notion / other no-code</H2>
      <P>
        Notion <strong>does not</strong> support arbitrary script tags (security model). Workarounds:
      </P>
      <Ul>
        <li>Use <Anchor href="https://super.so">super.so</Anchor> or <Anchor href="https://oopy.io">oopy.io</Anchor> as
          a Notion→public-site bridge — both accept Custom Code blocks like Webflow.</li>
        <li>Embed via iframe — drop a Notion <em>Embed</em> block pointing at a single-page HTML you host elsewhere
          (e.g. <code>github.io</code>) that contains the snippet.</li>
      </Ul>

      <H2 id="raw-html">Raw HTML / custom site</H2>
      <P>
        Just paste it. Anywhere in the body. The script auto-mounts on{' '}
        <InlineCode>DOMContentLoaded</InlineCode>, so even <InlineCode>defer</InlineCode>-loaded scripts work. The
        widget renders inside a Shadow DOM — zero CSS bleed in either direction.
      </P>
      <Pre lang="html">{`<!doctype html>
<html>
<head>
  <title>My site</title>
</head>
<body>
  <h1>Welcome</h1>
  <p>Your content here…</p>

${SNIPPET.split('\n').map(l => '  ' + l).join('\n')}
</body>
</html>`}</Pre>

      <H2 id="positioning">Positioning options</H2>
      <P>Set the <InlineCode>data-mode</InlineCode> + <InlineCode>data-launcher-position</InlineCode> attributes:</P>
      <Ul>
        <li><InlineCode>data-mode=&quot;launcher&quot;</InlineCode> (default) — small pill in a corner, click to expand.
          Use <InlineCode>data-launcher-position=&quot;br&quot;</InlineCode> / <code>bl</code> / <code>tr</code> /{' '}
          <code>tl</code>.</li>
        <li><InlineCode>data-mode=&quot;inline&quot;</InlineCode> + <InlineCode>data-position=&quot;sidebar-right&quot;</InlineCode> —
          full chat fixed to one side (strajkpolski.pl style).</li>
        <li><InlineCode>data-position=&quot;inline&quot;</InlineCode> (default for inline mode) — chat rendered into the
          div, follows your page flow.</li>
        <li><InlineCode>data-position=&quot;fullscreen&quot;</InlineCode> — chat takes the whole viewport.</li>
      </Ul>

      <H2 id="skins">Skins</H2>
      <P>
        Five skins ship with the bundle. Set <InlineCode>data-skin</InlineCode>:
      </P>
      <Ul>
        <li><InlineCode>default</InlineCode> — mosadd-mIRC (brand frame + retro mIRC chat)</li>
        <li><InlineCode>retro-irc-1990</InlineCode> — full 1990s mIRC, beige/red palette</li>
        <li><InlineCode>terminal</InlineCode> — green-on-black hacker terminal, CRT scanlines</li>
        <li><InlineCode>minimal-dark</InlineCode> — modern dark, Inter font</li>
        <li><InlineCode>minimal-light</InlineCode> — day-mode counterpart</li>
      </Ul>
      <P>
        All five bundled skins are listed on the <Anchor href="/embed">embed page</Anchor>.
      </P>

      <H2 id="troubleshooting">Troubleshooting</H2>
      <H3>Widget doesn&apos;t appear</H3>
      <Ul>
        <li>Check the <InlineCode>m_pk_live_…</InlineCode> in the snippet matches the one you created in the hub.</li>
        <li>Open browser DevTools → Console. Look for{' '}
          <InlineCode>[mosadd-embed]</InlineCode> warnings (missing data-key, unknown skin name, etc).</li>
        <li>Check the page URL&apos;s host is in the embed key&apos;s allow-list (mosadd.dev/embed/new → click your key).</li>
      </Ul>
      <H3>WS connect 401 / &quot;origin_not_allowed&quot;</H3>
      <P>
        Your site&apos;s domain isn&apos;t on the key&apos;s allow-list. Add it (e.g.{' '}
        <code>myblog.com</code>, <code>www.myblog.com</code>, or <code>*.myblog.com</code> for all subdomains).
      </P>
      <H3>&quot;Channel at capacity&quot; (402)</H3>
      <P>
        You hit the MAT cap for the month on your plan. Either upgrade Pro→Team, or wait for the 1st of next
        month. The widget shows a queue overlay automatically.
      </P>

      <P>
        Next: <Anchor href="/embed">about the embed</Anchor> · <Anchor href="/pricing">pricing</Anchor> ·{' '}
        <Anchor href="/pricing">pricing</Anchor> · <Anchor href="https://mosadd.dev/embed/new">create a key</Anchor>
      </P>
    </Prose>
  );
}
