import type { Metadata } from 'next';
import Link from 'next/link';
import { Prose, H1, Lead, H2, H3, P, Pre, InlineCode, Anchor, Ul, Callout } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'mosadd mIRC for WordPress — drop-in chat plugin',
  description:
    'Free WordPress plugin that adds the mosadd mIRC chat widget to your site. Settings page, shortcode, 5 skins, 10 placements. Apache-2.0. Download and install in 60 seconds.',
};

// Source ZIP lives in apps/wordpress-plugin/dist/. We serve it as a static
// asset via Next's public/ folder (build script copies it on every deploy).
const ZIP_URL = '/mosadd-mirc-1.0.0.zip';
const REPO_URL = 'https://github.com/Hei33enberg/mosADD-OS/tree/main/apps/wordpress-plugin';

const SHORTCODE = `[mosadd_mirc]

[mosadd_mirc channel="article-42" mode="inline" skin="terminal" locale="en"]`;

export default function WordPressInstallPage() {
  return (
    <Prose>
      <H1>mosadd mIRC for WordPress</H1>
      <Lead>
        Free Apache-2.0 plugin that adds the mIRC chat widget to any WordPress site. Five skins, ten placements,
        shortcode support. Install in 60 seconds.
      </Lead>

      <div className="flex flex-wrap gap-3 my-6">
        <Link
          href={ZIP_URL}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider text-sm"
        >
          ↓ Download mosadd-mirc-1.0.0.zip
        </Link>
        <Link
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 border border-border font-mono font-bold uppercase tracking-wider text-sm hover:border-primary hover:text-primary"
        >
          Source on GitHub ↗
        </Link>
      </div>

      <Callout type="info">
        <strong>WordPress.org submission pending.</strong> The plugin works exactly the same when installed manually
        from the ZIP above. Once approved at wp.org/plugins, a "Search for mosadd mIRC" install path opens too.
      </Callout>

      <H2>Install (3 minutes)</H2>
      <H3>1 · Get a publishable key</H3>
      <P>
        Sign up at <Anchor href="https://hub.mosadd.com/embed/new">hub.mosadd.com/embed/new</Anchor>, add your
        site&apos;s domain (e.g. <InlineCode>myblog.com</InlineCode> and <InlineCode>www.myblog.com</InlineCode>), pick
        a channel id, click <em>Create embed key</em>. Copy the <InlineCode>m_pk_live_…</InlineCode> key once — you
        won&apos;t see it again.
      </P>

      <H3>2 · Upload + activate the plugin</H3>
      <Ul>
        <li>WP admin → <strong>Plugins → Add New → Upload Plugin</strong></li>
        <li>Choose <InlineCode>mosadd-mirc-1.0.0.zip</InlineCode> → <strong>Install Now</strong></li>
        <li>Click <strong>Activate</strong></li>
      </Ul>

      <H3>3 · Configure</H3>
      <Ul>
        <li>Go to <strong>Settings → mosadd mIRC</strong></li>
        <li>Paste the publishable key</li>
        <li>Set the channel id (same one you used at hub.mosadd.com)</li>
        <li>Pick mode (launcher pill or inline), position, skin, language</li>
        <li>Save Changes</li>
      </Ul>
      <P>
        That&apos;s it. The widget appears in the footer of every page. Visitors join with just a nick.
      </P>

      <H2>Shortcode (place inline anywhere)</H2>
      <P>
        Want the chat in only one post, or as part of a Gutenberg block? Uncheck <em>&quot;Inject the widget into the
        footer&quot;</em> in settings and drop this into any post or page:
      </P>
      <Pre lang="text">{SHORTCODE}</Pre>
      <P>
        The shortcode accepts <InlineCode>channel</InlineCode>, <InlineCode>mode</InlineCode>,{' '}
        <InlineCode>position</InlineCode>, <InlineCode>skin</InlineCode>, and <InlineCode>locale</InlineCode> overrides.
        See the full data-attribute reference at <Anchor href="/embed/install">/embed/install</Anchor>.
      </P>

      <H2>Compatibility</H2>
      <Ul>
        <li><strong>WordPress 5.5+</strong>, <strong>PHP 7.4+</strong></li>
        <li>
          <strong>Caching plugins:</strong> WP Rocket, W3 Total Cache, WP Super Cache, LiteSpeed Cache — all fine.
          The widget renders as plain HTML, no per-request PHP runtime.
        </li>
        <li>
          <strong>Cloudflare in front of WordPress:</strong> works. The WS connection happens client-side after
          page load.
        </li>
        <li>
          <strong>Page builders:</strong> Elementor, Divi, Beaver Builder, Bricks — the shortcode works in their
          shortcode blocks; auto-inject works regardless.
        </li>
        <li>
          <strong>Multisite:</strong> activate per-site or network-wide. Each site has its own settings + key.
        </li>
        <li>
          <strong>WordPress.com (hosted):</strong> Business plan or higher (script-tag plugins aren&apos;t allowed on
          Personal / Premium tiers).
        </li>
      </Ul>

      <H2>What it touches in your database</H2>
      <P>The plugin only stores 7 rows in <InlineCode>wp_options</InlineCode>:</P>
      <Ul>
        <li><InlineCode>mosadd_mirc_pk_key</InlineCode> — the publishable key</li>
        <li><InlineCode>mosadd_mirc_channel</InlineCode> — channel id</li>
        <li><InlineCode>mosadd_mirc_mode</InlineCode>, <InlineCode>_position</InlineCode>,{' '}
          <InlineCode>_skin</InlineCode>, <InlineCode>_locale</InlineCode>, <InlineCode>_auto_inject</InlineCode> —
          rendering config</li>
      </Ul>
      <P>
        All seven are removed when you fully delete the plugin (not just deactivate) via{' '}
        <InlineCode>uninstall.php</InlineCode>.
      </P>

      <H2>Source code</H2>
      <P>
        Apache-2.0 (Mozilla-compatible per WordPress.org rules). Source in{' '}
        <Anchor href={REPO_URL}>mosadd-os/apps/wordpress-plugin</Anchor>. PRs welcome — features that fit well:
        Gutenberg block, Polylang/WPML integration, EDD/WooCommerce contextual channels (one channel per product).
      </P>

      <P>
        Next: <Anchor href="/embed/install">install on other platforms</Anchor> ·{' '}
        <Anchor href="/skins">browse skins</Anchor> ·{' '}
        <Anchor href="/pricing">pricing</Anchor>
      </P>
    </Prose>
  );
}
