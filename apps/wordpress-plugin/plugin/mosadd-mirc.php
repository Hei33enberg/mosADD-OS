<?php
/**
 * Plugin Name:       mosadd mIRC Embed
 * Plugin URI:        https://mosadd.dev/embed/wordpress
 * Description:       Drop-in real-time mIRC chat widget for your WordPress site. Free up to 1,000 Monthly Active Talkers. Powered by Cloudflare Durable Objects.
 * Version:           1.0.0
 * Requires at least: 5.5
 * Requires PHP:      7.4
 * Author:            mosadd
 * Author URI:        https://mosadd.dev
 * License:           Apache License 2.0
 * License URI:       https://www.apache.org/licenses/LICENSE-2.0
 * Text Domain:       mosadd-mirc
 * Update URI:        https://mosadd.dev/embed/wordpress
 *
 * @package MosaddMirc
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MOSADD_MIRC_VERSION', '1.0.0');
define('MOSADD_MIRC_BUNDLE_URL', 'https://embed.mosadd.com/v1.js');
define('MOSADD_MIRC_HUB_URL', 'https://hub.mosadd.com/embed/new');
define('MOSADD_MIRC_OPTION_GROUP', 'mosadd_mirc');

/* =============================================================================
 * Settings registration
 * =========================================================================== */

add_action('admin_init', 'mosadd_mirc_register_settings');

function mosadd_mirc_register_settings() {
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_pk_key', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_pk',
        'default' => '',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_channel', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_channel',
        'default' => 'default',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_mode', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_enum_mode',
        'default' => 'launcher',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_position', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_enum_position',
        'default' => 'br',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_skin', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_enum_skin',
        'default' => 'default',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_locale', [
        'type' => 'string',
        'sanitize_callback' => 'mosadd_mirc_sanitize_locale',
        'default' => 'en',
    ]);
    register_setting(MOSADD_MIRC_OPTION_GROUP, 'mosadd_mirc_auto_inject', [
        'type' => 'boolean',
        'sanitize_callback' => 'mosadd_mirc_sanitize_bool',
        'default' => true,
    ]);
}

function mosadd_mirc_sanitize_pk($v) {
    $v = trim((string)$v);
    if ($v === '') return '';
    if (!preg_match('/^m_pk_(live|test)_[a-f0-9]{32,}$/', $v)) {
        add_settings_error('mosadd_mirc_pk_key', 'mosadd_mirc_pk_invalid', __('That doesn’t look like a mosadd publishable key. It should start with m_pk_live_ or m_pk_test_ followed by hex.', 'mosadd-mirc'));
        return get_option('mosadd_mirc_pk_key', '');
    }
    return $v;
}

function mosadd_mirc_sanitize_channel($v) {
    $v = trim((string)$v);
    if ($v === '' || !preg_match('/^[A-Za-z0-9_-]{1,128}$/', $v)) {
        add_settings_error('mosadd_mirc_channel', 'mosadd_mirc_channel_invalid', __('Channel id must be 1–128 chars of letters, numbers, _ or -.', 'mosadd-mirc'));
        return get_option('mosadd_mirc_channel', 'default');
    }
    return $v;
}

function mosadd_mirc_sanitize_enum_mode($v) {
    return in_array($v, ['launcher', 'inline'], true) ? $v : 'launcher';
}

function mosadd_mirc_sanitize_enum_position($v) {
    $allowed = ['br', 'bl', 'tr', 'tl', 'sidebar-right', 'sidebar-left', 'floating-br', 'floating-bl', 'inline', 'fullscreen'];
    return in_array($v, $allowed, true) ? $v : 'br';
}

function mosadd_mirc_sanitize_enum_skin($v) {
    $allowed = ['default', 'retro-irc-1990', 'terminal', 'minimal-dark', 'minimal-light'];
    return in_array($v, $allowed, true) ? $v : 'default';
}

function mosadd_mirc_sanitize_locale($v) {
    return in_array($v, ['en', 'pl'], true) ? $v : 'en';
}

function mosadd_mirc_sanitize_bool($v) {
    return $v === '1' || $v === 1 || $v === true || $v === 'true';
}

/* =============================================================================
 * Admin page
 * =========================================================================== */

add_action('admin_menu', 'mosadd_mirc_admin_menu');

function mosadd_mirc_admin_menu() {
    add_options_page(
        __('mosadd mIRC', 'mosadd-mirc'),
        __('mosadd mIRC', 'mosadd-mirc'),
        'manage_options',
        'mosadd-mirc',
        'mosadd_mirc_admin_page'
    );
}

function mosadd_mirc_admin_page() {
    if (!current_user_can('manage_options')) return;
    require_once __DIR__ . '/includes/admin-page.php';
    mosadd_mirc_render_admin_page();
}

add_action('admin_notices', 'mosadd_mirc_admin_notice_missing_key');

function mosadd_mirc_admin_notice_missing_key() {
    if (!current_user_can('manage_options')) return;
    if (get_option('mosadd_mirc_pk_key', '') !== '') return;
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if ($screen && isset($screen->id) && $screen->id === 'settings_page_mosadd-mirc') return;
    $url = esc_url(admin_url('options-general.php?page=mosadd-mirc'));
    echo '<div class="notice notice-warning"><p><strong>mosadd mIRC:</strong> ';
    echo esc_html__('Add your publishable key to start the chat.', 'mosadd-mirc');
    echo ' <a href="' . $url . '">' . esc_html__('Open settings →', 'mosadd-mirc') . '</a></p></div>';
}

/* =============================================================================
 * Frontend injection
 * =========================================================================== */

add_action('wp_footer', 'mosadd_mirc_inject_footer', 100);

function mosadd_mirc_inject_footer() {
    if (!mosadd_mirc_get_bool_option('mosadd_mirc_auto_inject', true)) return;
    $html = mosadd_mirc_render_widget_html();
    if ($html === '') return;
    echo $html;
}

/**
 * Render the widget HTML. Used by auto-inject + shortcode + block render callback.
 * Returns '' if the plugin isn't configured (no key) or the key is invalid.
 */
function mosadd_mirc_render_widget_html(array $overrides = []) {
    $pk = isset($overrides['pk']) ? trim($overrides['pk']) : trim(get_option('mosadd_mirc_pk_key', ''));
    if ($pk === '' || !preg_match('/^m_pk_(live|test)_[a-f0-9]{32,}$/', $pk)) {
        return '';
    }
    $channel  = $overrides['channel']  ?? get_option('mosadd_mirc_channel', 'default');
    $mode     = $overrides['mode']     ?? get_option('mosadd_mirc_mode', 'launcher');
    $position = $overrides['position'] ?? get_option('mosadd_mirc_position', 'br');
    $skin     = $overrides['skin']     ?? get_option('mosadd_mirc_skin', 'default');
    $locale   = $overrides['locale']   ?? get_option('mosadd_mirc_locale', 'en');

    $attrs = [
        'id'           => 'mosadd-mirc',
        'data-channel' => $channel,
        'data-mode'    => $mode,
        'data-skin'    => $skin,
        'data-locale'  => $locale,
    ];
    if ($mode === 'launcher') {
        $attrs['data-launcher-position'] = $position;
    } else {
        $attrs['data-position'] = $position;
    }

    $div = '<div';
    foreach ($attrs as $k => $v) {
        $div .= ' ' . esc_attr($k) . '="' . esc_attr((string)$v) . '"';
    }
    $div .= '></div>';

    $script = sprintf(
        '<script src="%s" data-key="%s" async></script>',
        esc_url(MOSADD_MIRC_BUNDLE_URL),
        esc_attr($pk)
    );

    return "\n<!-- mosadd mIRC -->\n" . $div . "\n" . $script . "\n<!-- /mosadd mIRC -->\n";
}

function mosadd_mirc_get_bool_option($name, $default) {
    $v = get_option($name, $default);
    return $v === '1' || $v === 1 || $v === true || $v === 'true';
}

/* =============================================================================
 * Shortcode [mosadd_mirc channel="..." mode="inline" position="inline" skin="..." locale="..."]
 * =========================================================================== */

add_shortcode('mosadd_mirc', 'mosadd_mirc_shortcode');

function mosadd_mirc_shortcode($atts = []) {
    $atts = shortcode_atts([
        'channel'  => null,
        'mode'     => 'inline',
        'position' => 'inline',
        'skin'     => null,
        'locale'   => null,
    ], (array)$atts, 'mosadd_mirc');

    $overrides = [];
    foreach ($atts as $k => $v) {
        if ($v === null || $v === '') continue;
        $overrides[$k] = $v;
    }
    // Sanitize per-instance overrides through the same allow-lists.
    if (isset($overrides['channel']))  $overrides['channel']  = preg_match('/^[A-Za-z0-9_-]{1,128}$/', $overrides['channel']) ? $overrides['channel'] : null;
    if (isset($overrides['mode']))     $overrides['mode']     = mosadd_mirc_sanitize_enum_mode($overrides['mode']);
    if (isset($overrides['position'])) $overrides['position'] = mosadd_mirc_sanitize_enum_position($overrides['position']);
    if (isset($overrides['skin']))     $overrides['skin']     = mosadd_mirc_sanitize_enum_skin($overrides['skin']);
    if (isset($overrides['locale']))   $overrides['locale']   = mosadd_mirc_sanitize_locale($overrides['locale']);
    $overrides = array_filter($overrides, fn($v) => $v !== null);

    return mosadd_mirc_render_widget_html($overrides);
}

/* =============================================================================
 * Settings link on the Plugins page
 * =========================================================================== */

add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'mosadd_mirc_plugin_action_links');

function mosadd_mirc_plugin_action_links($links) {
    $settings = '<a href="' . esc_url(admin_url('options-general.php?page=mosadd-mirc')) . '">' . esc_html__('Settings', 'mosadd-mirc') . '</a>';
    array_unshift($links, $settings);
    return $links;
}
