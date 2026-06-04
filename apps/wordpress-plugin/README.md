# `@mosadd/wordpress-plugin` — mosadd mIRC for WordPress

Standard WordPress plugin that drops the mosadd mIRC embed widget onto any WordPress site.

```
apps/wordpress-plugin/
├── plugin/                      # the WP plugin source (zipped as mosadd-mirc/)
│   ├── mosadd-mirc.php          # plugin header + settings registration + render
│   ├── includes/admin-page.php  # Settings → mosadd mIRC page UI
│   ├── uninstall.php            # drops options on full delete
│   ├── readme.txt               # WordPress.org plugin directory readme
│   └── LICENSE                  # Apache-2.0
├── build-zip.sh                 # bundle the plugin/ folder into a distributable ZIP
└── README.md                    # this file
```

## What the plugin does

- Adds a **Settings → mosadd mIRC** page where the site owner pastes a publishable key (`m_pk_live_…`) and picks a channel, position, skin, and language.
- **Auto-injects** the standard mosadd embed snippet into `wp_footer` on every page (toggleable).
- **Shortcode** `[mosadd_mirc]` for inline placement inside posts/pages, with per-instance overrides:
  `[mosadd_mirc channel="article-42" mode="inline" skin="terminal" locale="en"]`
- **Validates** the publishable key format server-side. Strips invalid input.
- **Cleans up** all stored options on `uninstall.php` (no orphaned `wp_options` rows).
- **Plugin row link** "Settings" added on the Plugins screen.

## How creators install it

1. Sign up at https://hub.mosadd.com/embed/new → get `m_pk_live_…`
2. Download `mosadd-mirc-X.Y.Z.zip` from https://mosadd.dev/embed/wordpress
3. WP admin → Plugins → Add New → Upload Plugin → choose the ZIP
4. Activate → Settings → mosadd mIRC → paste key + channel id → Save
5. Done. Widget appears in the footer of every page.

## Build the ZIP

```bash
cd apps/wordpress-plugin
./build-zip.sh
# → dist/mosadd-mirc-1.0.0.zip
```

The script:
- Reads the version from the `Version:` header in `plugin/mosadd-mirc.php`
- Copies `plugin/` → `mosadd-mirc/` (WP requires the folder name to match the slug)
- Zips it to `dist/mosadd-mirc-<version>.zip`

The resulting ZIP is what the user uploads to WordPress admin OR what we submit to WordPress.org.

## WordPress.org submission checklist (owner action)

1. Account at https://wordpress.org/plugins/ (free).
2. Submit a NEW plugin: title "mosadd mIRC Embed", slug `mosadd-mirc`, ZIP attached.
3. Reviewer typically takes 1-2 weeks. They check:
   - GPL/Apache-2.0 license correctly declared
   - No tracking/loaded code from external CDNs (we DO load `embed.mosadd.com/v1.js` — disclose in description, this is the entire point of the plugin)
   - Proper escape/sanitize on every output and input
   - No hard-coded URLs that aren't documented
   - `readme.txt` follows the format (we do)
4. Once approved, push the same ZIP to `wp.svn` (their SVN repo). Automated for stable releases.

## Self-host the bundle URL

If you fork mosadd-os and run your own Worker + apps/embed bundle, change one constant:

```php
// plugin/mosadd-mirc.php
define('MOSADD_MIRC_BUNDLE_URL', 'https://embed.yourdomain.com/v1.js');
```

## Versioning

The version lives in TWO places — keep them in sync:
- `plugin/mosadd-mirc.php` plugin header `Version:` line
- `plugin/readme.txt` `Stable tag:` line

`build-zip.sh` reads from the plugin header; `readme.txt` `Stable tag:` is what WordPress.org displays.

## License

Apache-2.0 (`plugin/LICENSE`). Distributed by mosadd.
