<?php
/**
 * Admin settings page for the mosadd mIRC WordPress plugin.
 * @package MosaddMirc
 */

if (!defined('ABSPATH')) exit;

function mosadd_mirc_render_admin_page() {
    $pk          = get_option('mosadd_mirc_pk_key', '');
    $channel     = get_option('mosadd_mirc_channel', 'default');
    $mode        = get_option('mosadd_mirc_mode', 'launcher');
    $position    = get_option('mosadd_mirc_position', 'br');
    $skin        = get_option('mosadd_mirc_skin', 'default');
    $locale      = get_option('mosadd_mirc_locale', 'en');
    $auto_inject = mosadd_mirc_get_bool_option('mosadd_mirc_auto_inject', true);
    $valid_pk    = preg_match('/^m_pk_(live|test)_[a-f0-9]{32,}$/', trim($pk)) === 1;
    ?>
    <div class="wrap">
      <h1><?php esc_html_e('mosadd mIRC Embed', 'mosadd-mirc'); ?></h1>
      <p class="description" style="max-width:720px;">
        <?php
        printf(
            esc_html__('Drop-in real-time chat widget. Free up to 1,000 Monthly Active Talkers. Get a publishable key at %s.', 'mosadd-mirc'),
            '<a href="' . esc_url(MOSADD_MIRC_HUB_URL) . '" target="_blank" rel="noopener">hub.mosadd.com/embed/new</a>'
        );
        ?>
      </p>

      <?php settings_errors(); ?>

      <?php if (!$valid_pk && $pk === ''): ?>
        <div class="notice notice-info inline" style="margin-top:1em;">
          <p>
            <strong><?php esc_html_e('Step 1:', 'mosadd-mirc'); ?></strong>
            <?php
            printf(
                esc_html__('Open %s, sign in, click "Create embed key". Add this site’s domain to the allow-list (e.g. %s). Copy the m_pk_live_… key.', 'mosadd-mirc'),
                '<a href="' . esc_url(MOSADD_MIRC_HUB_URL) . '" target="_blank" rel="noopener">hub.mosadd.com/embed/new</a>',
                '<code>' . esc_html(parse_url(home_url(), PHP_URL_HOST) ?: 'yoursite.com') . '</code>'
            );
            ?>
          </p>
        </div>
      <?php endif; ?>

      <form method="post" action="options.php">
        <?php settings_fields(MOSADD_MIRC_OPTION_GROUP); ?>

        <h2><?php esc_html_e('Connection', 'mosadd-mirc'); ?></h2>
        <table class="form-table" role="presentation">
          <tr>
            <th scope="row"><label for="mosadd_mirc_pk_key"><?php esc_html_e('Publishable key', 'mosadd-mirc'); ?></label></th>
            <td>
              <input type="text" id="mosadd_mirc_pk_key" name="mosadd_mirc_pk_key" value="<?php echo esc_attr($pk); ?>" class="regular-text code" autocomplete="off" placeholder="m_pk_live_…" />
              <p class="description"><?php esc_html_e('From hub.mosadd.com. Safe to use in the browser. Bound to this site’s domain.', 'mosadd-mirc'); ?></p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="mosadd_mirc_channel"><?php esc_html_e('Channel id', 'mosadd-mirc'); ?></label></th>
            <td>
              <input type="text" id="mosadd_mirc_channel" name="mosadd_mirc_channel" value="<?php echo esc_attr($channel); ?>" class="regular-text code" pattern="[A-Za-z0-9_-]{1,128}" />
              <p class="description"><?php esc_html_e('Letters, numbers, _ or -. Visitors share this room. Must match the channel you added when creating the key.', 'mosadd-mirc'); ?></p>
            </td>
          </tr>
        </table>

        <h2><?php esc_html_e('Appearance', 'mosadd-mirc'); ?></h2>
        <table class="form-table" role="presentation">
          <tr>
            <th scope="row"><label for="mosadd_mirc_mode"><?php esc_html_e('Mode', 'mosadd-mirc'); ?></label></th>
            <td>
              <select id="mosadd_mirc_mode" name="mosadd_mirc_mode">
                <option value="launcher" <?php selected($mode, 'launcher'); ?>><?php esc_html_e('Launcher pill (click to expand)', 'mosadd-mirc'); ?></option>
                <option value="inline"   <?php selected($mode, 'inline');   ?>><?php esc_html_e('Inline / sidebar (always visible)', 'mosadd-mirc'); ?></option>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="mosadd_mirc_position"><?php esc_html_e('Position', 'mosadd-mirc'); ?></label></th>
            <td>
              <select id="mosadd_mirc_position" name="mosadd_mirc_position">
                <optgroup label="<?php esc_attr_e('Launcher corners', 'mosadd-mirc'); ?>">
                  <option value="br" <?php selected($position, 'br'); ?>><?php esc_html_e('Bottom right', 'mosadd-mirc'); ?></option>
                  <option value="bl" <?php selected($position, 'bl'); ?>><?php esc_html_e('Bottom left', 'mosadd-mirc'); ?></option>
                  <option value="tr" <?php selected($position, 'tr'); ?>><?php esc_html_e('Top right', 'mosadd-mirc'); ?></option>
                  <option value="tl" <?php selected($position, 'tl'); ?>><?php esc_html_e('Top left', 'mosadd-mirc'); ?></option>
                </optgroup>
                <optgroup label="<?php esc_attr_e('Inline modes', 'mosadd-mirc'); ?>">
                  <option value="inline"         <?php selected($position, 'inline');         ?>><?php esc_html_e('Inline (page flow)', 'mosadd-mirc'); ?></option>
                  <option value="sidebar-right"  <?php selected($position, 'sidebar-right');  ?>><?php esc_html_e('Sidebar right', 'mosadd-mirc'); ?></option>
                  <option value="sidebar-left"   <?php selected($position, 'sidebar-left');   ?>><?php esc_html_e('Sidebar left', 'mosadd-mirc'); ?></option>
                  <option value="floating-br"    <?php selected($position, 'floating-br');    ?>><?php esc_html_e('Floating bottom right', 'mosadd-mirc'); ?></option>
                  <option value="floating-bl"    <?php selected($position, 'floating-bl');    ?>><?php esc_html_e('Floating bottom left', 'mosadd-mirc'); ?></option>
                  <option value="fullscreen"     <?php selected($position, 'fullscreen');     ?>><?php esc_html_e('Fullscreen', 'mosadd-mirc'); ?></option>
                </optgroup>
              </select>
              <p class="description"><?php esc_html_e('Launcher mode uses the 4 corners. Inline mode uses one of the inline placements.', 'mosadd-mirc'); ?></p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="mosadd_mirc_skin"><?php esc_html_e('Skin', 'mosadd-mirc'); ?></label></th>
            <td>
              <select id="mosadd_mirc_skin" name="mosadd_mirc_skin">
                <option value="default"         <?php selected($skin, 'default');         ?>><?php esc_html_e('default (mosadd-mIRC — brand frame + retro chat)', 'mosadd-mirc'); ?></option>
                <option value="retro-irc-1990"  <?php selected($skin, 'retro-irc-1990');  ?>><?php esc_html_e('retro-irc-1990 (full 1990s mIRC)', 'mosadd-mirc'); ?></option>
                <option value="terminal"        <?php selected($skin, 'terminal');        ?>><?php esc_html_e('terminal (green-on-black hacker)', 'mosadd-mirc'); ?></option>
                <option value="minimal-dark"    <?php selected($skin, 'minimal-dark');    ?>><?php esc_html_e('minimal-dark (modern dark)', 'mosadd-mirc'); ?></option>
                <option value="minimal-light"   <?php selected($skin, 'minimal-light');   ?>><?php esc_html_e('minimal-light (day mode)', 'mosadd-mirc'); ?></option>
              </select>
              <p class="description">
                <?php
                printf(
                    esc_html__('Preview all skins at %s.', 'mosadd-mirc'),
                    '<a href="https://mosadd.dev/skins" target="_blank" rel="noopener">mosadd.dev/skins</a>'
                );
                ?>
              </p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="mosadd_mirc_locale"><?php esc_html_e('Language', 'mosadd-mirc'); ?></label></th>
            <td>
              <select id="mosadd_mirc_locale" name="mosadd_mirc_locale">
                <option value="en" <?php selected($locale, 'en'); ?>>English</option>
                <option value="pl" <?php selected($locale, 'pl'); ?>>Polski</option>
              </select>
              <p class="description"><?php esc_html_e('The widget will also auto-detect from the visitor’s browser if you leave one of these as a fallback.', 'mosadd-mirc'); ?></p>
            </td>
          </tr>
        </table>

        <h2><?php esc_html_e('Placement', 'mosadd-mirc'); ?></h2>
        <table class="form-table" role="presentation">
          <tr>
            <th scope="row"><?php esc_html_e('Site-wide chat', 'mosadd-mirc'); ?></th>
            <td>
              <label>
                <input type="checkbox" name="mosadd_mirc_auto_inject" value="1" <?php checked($auto_inject); ?> />
                <?php esc_html_e('Inject the widget into the footer on every page.', 'mosadd-mirc'); ?>
              </label>
              <p class="description">
                <?php esc_html_e('Uncheck to keep the chat hidden by default and only place it manually via the shortcode below.', 'mosadd-mirc'); ?>
              </p>
            </td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Manual shortcode', 'mosadd-mirc'); ?></th>
            <td>
              <p><?php esc_html_e('Drop this into any post or page to place an inline chat (overrides above defaults per-instance):', 'mosadd-mirc'); ?></p>
              <p><code>[mosadd_mirc]</code></p>
              <p><?php esc_html_e('Or with per-instance overrides:', 'mosadd-mirc'); ?></p>
              <p><code>[mosadd_mirc channel="article-42" mode="inline" position="inline" skin="terminal" locale="en"]</code></p>
            </td>
          </tr>
        </table>

        <?php submit_button(); ?>
      </form>

      <?php if ($valid_pk): ?>
        <hr>
        <h2><?php esc_html_e('Preview snippet', 'mosadd-mirc'); ?></h2>
        <p><?php esc_html_e('This is the markup the plugin injects into your site’s footer when site-wide chat is on:', 'mosadd-mirc'); ?></p>
        <pre style="background:#1d2327;color:#e5e5e7;padding:12px 16px;overflow:auto;border-radius:4px;"><?php
          $masked = preg_replace('/^(m_pk_(?:live|test)_[a-f0-9]{8}).*$/', '$1…', $pk);
          echo esc_html(mosadd_mirc_render_widget_html(['pk' => $masked]));
        ?></pre>
      <?php endif; ?>

      <hr>
      <h2><?php esc_html_e('Help', 'mosadd-mirc'); ?></h2>
      <ul style="list-style:disc;padding-left:1.2em;">
        <li><a href="https://mosadd.dev/embed/install#wordpress" target="_blank" rel="noopener"><?php esc_html_e('WordPress install guide', 'mosadd-mirc'); ?></a></li>
        <li><a href="https://mosadd.dev/embed" target="_blank" rel="noopener"><?php esc_html_e('About the mIRC embed', 'mosadd-mirc'); ?></a></li>
        <li><a href="https://mosadd.dev/skins" target="_blank" rel="noopener"><?php esc_html_e('Browse all skins', 'mosadd-mirc'); ?></a></li>
        <li><a href="https://mosadd.dev/pricing" target="_blank" rel="noopener"><?php esc_html_e('Pricing &amp; MAT explanation', 'mosadd-mirc'); ?></a></li>
        <li><a href="https://hub.mosadd.com/embed" target="_blank" rel="noopener"><?php esc_html_e('Your embeds dashboard', 'mosadd-mirc'); ?></a></li>
      </ul>
    </div>
    <?php
}
