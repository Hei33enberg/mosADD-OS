// Single source of truth for the murl-www site constants.
// When the Chrome Web Store listing is live, swap CHROME_STORE_URL.

export const SITE_DOMAIN = 'murl.mosadd.com';
export const SITE_URL = `https://${SITE_DOMAIN}`;

// Chrome Web Store listing — placeholder until the extension is published.
// Until then, point at the GitHub source for the sideload build.
export const CHROME_STORE_URL =
  'https://github.com/Hei33enberg/mosadd-os/tree/main/apps/channel0-ext';
export const CHROME_STORE_LIVE = false; // flip true once the CWS listing exists

// Live trending/activity — the deployed channel0-trending edge fn (prod).
export const TRENDING_URL =
  'https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/channel0-trending';

export const MOSADD_DEV = 'https://mosadd.dev';
export const MOSADD_COM = 'https://mosadd.com';
export const GITHUB_URL = 'https://github.com/Hei33enberg/mosadd-os';

export const INSTALL_LABEL = CHROME_STORE_LIVE ? 'Add to Chrome — free' : 'Get the extension — free';
