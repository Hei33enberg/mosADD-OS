<?php
/**
 * Uninstall handler for mosadd mIRC. Drops all plugin options when the user
 * fully deletes the plugin (not just deactivates).
 * @package MosaddMirc
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$options = [
    'mosadd_mirc_pk_key',
    'mosadd_mirc_channel',
    'mosadd_mirc_mode',
    'mosadd_mirc_position',
    'mosadd_mirc_skin',
    'mosadd_mirc_locale',
    'mosadd_mirc_auto_inject',
];

foreach ($options as $opt) {
    delete_option($opt);
    // Network-wide cleanup (multisite installs).
    if (is_multisite()) {
        delete_site_option($opt);
    }
}
