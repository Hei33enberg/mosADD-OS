=== mosadd mIRC Embed ===
Contributors: mosadd
Tags: chat, live chat, mirc, irc, community, embed, widget
Requires at least: 5.5
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: Apache License 2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

Drop-in real-time mIRC chat widget for your WordPress site. Free up to 1,000 Monthly Active Talkers.

== Description ==

mosadd mIRC Embed adds a real-time, mIRC-style chat to your WordPress site. Visitors join with just a nickname — no account, no setup on their end. Backed by Cloudflare Durable Objects for sub-100ms global fan-out.

= Why this plugin =

* **Free up to 1,000 Monthly Active Talkers** (creators only pay when they have an actual community talking, not when visitors browse).
* **One key, one snippet** — paste your `m_pk_live_…` publishable key, pick a channel, done.
* **Five skins bundled** — default (mosadd brand frame + retro mIRC chat), retro-irc-1990, terminal, minimal-dark, minimal-light. Preview at mosadd.dev/skins.
* **Six placements** — launcher pill in any corner, sidebar left/right, floating, fullscreen, or inline in the page flow.
* **Shortcode** `[mosadd_mirc]` for placement inside any post or page.
* **Apache-2.0** open source. Self-host the entire stack if you want.

= How it works =

1. Sign up at https://hub.mosadd.com/embed/new — free.
2. Add your site's domain to the allow-list and choose a channel id.
3. Paste the publishable key into this plugin's settings page.
4. Save. The widget appears in your site's footer (or wherever your `[mosadd_mirc]` shortcode is placed).

= Privacy =

* Anonymous joiners are tracked by a randomly generated `sub` claim that lives in the visitor's localStorage (so they keep their nick across reconnects). It is NOT a cookie and not used for cross-site tracking.
* The widget loads `https://embed.mosadd.com/v1.js` (33 KB) and connects WebSocket to `wss://mosadd-edge.mr-brics-33.workers.dev`. Both belong to mosadd.
* Messages flow through Cloudflare Durable Objects + are flushed to mosadd's Supabase as system-of-record. mosadd retains the messages per your account's plan.
* The publishable key `m_pk_…` is browser-safe and scoped to your domain — it cannot be used to do anything other than mint short-lived per-channel tokens.
* See https://mosadd.dev/trust for the full privacy posture.

= Pricing =

* **Free:** 1,000 Monthly Active Talkers (MAT) per month, 1 embed key, badge "powered by mosadd" shown.
* **Pro $9/mo:** 10k MAT, 5 embed keys, custom CSS skin, optional badge removal addon +$3/mo.
* **Team $29/mo:** 100k MAT, unlimited keys, white-label (badge removed), webhooks, audit log.
* **PAYG overage:** $0.001/MAT past plan, hard cap = 2× plan price — no surprise bills.
* **Self-host:** $0 forever, Apache-2.0.

A MAT is one unique visitor that sends at least one message in a calendar month. Viewers, page loads, reconnects — all free.

== Installation ==

= Easy install (recommended) =

1. Go to **Plugins → Add New → Upload Plugin** in your WordPress admin.
2. Choose `mosadd-mirc.zip` and click *Install Now*.
3. Activate the plugin.
4. Open **Settings → mosadd mIRC**.
5. Paste your publishable key (get one at https://hub.mosadd.com/embed/new).
6. Save. The chat appears on every page in the footer.

= Manual install =

1. Upload the `mosadd-mirc/` folder to `/wp-content/plugins/`.
2. Activate from the Plugins menu in WordPress.
3. Configure under Settings → mosadd mIRC.

== Frequently Asked Questions ==

= What's a publishable key? =

It's a browser-safe API key (`m_pk_live_…`) that's scoped to your domain. Even if someone copies it out of your site's HTML, they can't use it on a different domain — the mosadd backend rejects it. The matching server-side hub key never leaves mosadd.

= Will this slow down my site? =

The widget bundle is 33 KB. It's loaded with `async` so it doesn't block page render. The first paint of your site is unaffected.

= Can I put the chat only on specific posts? =

Yes. In the plugin settings, uncheck "Inject the widget into the footer on every page". Then drop the `[mosadd_mirc]` shortcode into any post or page where you want the chat.

= Does it work with caching plugins (WP Rocket, W3 Total Cache, etc)? =

Yes. The plugin outputs static HTML in the footer — no PHP runtime calls per request. Caching makes it faster.

= My site uses WP Super Cache / page caching / Cloudflare in front. Will visitors see the widget? =

Yes. The widget is rendered in plain HTML and the WebSocket connection happens client-side after page load. Caching doesn't break it.

= What if my publishable key is exposed? =

It's expected to be public — that's why it's "publishable". The key only works on the domains you allow-list when creating it at hub.mosadd.com. To rotate: open hub.mosadd.com/embed, revoke the old key, create a new one, paste it here.

= Can I self-host? =

Yes. Everything in mosadd's embed stack is Apache-2.0. See https://github.com/Hei33enberg/mosADD-OS for the source. You'd point this plugin at your own Worker by replacing the `MOSADD_MIRC_BUNDLE_URL` constant.

= GDPR / privacy law? =

mosadd is the data processor for the messages sent through the embed. See https://mosadd.dev/trust for the DPA and our privacy posture. As the site owner you remain the data controller — disclose this in your privacy policy if you embed the widget.

== Screenshots ==

1. Settings page — paste your key, choose channel, position, skin.
2. Launcher pill in the bottom-right corner of a site.
3. Expanded chat (default mosadd-mIRC skin).
4. Sidebar-right placement, retro-irc-1990 skin (strajkpolski-style).

== Changelog ==

= 1.0.0 — 2026-06-03 =
* Initial release. Settings page, auto-inject, shortcode, five bundled skins, ten positioning modes.

== Upgrade Notice ==

= 1.0.0 =
First release.

== Source code ==

This plugin is part of the mosadd-os monorepo: https://github.com/Hei33enberg/mosADD-OS/tree/main/apps/wordpress-plugin

License: Apache-2.0
