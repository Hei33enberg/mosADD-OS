// Single source of truth for the murl-www site constants.

export const SITE_DOMAIN = 'murl.mosadd.com';
export const SITE_URL = `https://${SITE_DOMAIN}`;

// DEMO MODE — launch/investor demo. When true, the trending board shows a
// believable mocked top-sites ranking instead of the (currently sparse) live
// channel0-trending feed. Flip to false once real rooms have traffic.
export const DEMO_MODE = true;

// Live trending/activity — the deployed channel0-trending edge fn (prod).
export const TRENDING_URL =
  'https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/channel0-trending';

export const MOSADD_DEV = 'https://mosadd.dev';
export const MOSADD_COM = 'https://mosadd.com';
export const GITHUB_URL = 'https://github.com/Hei33enberg/mosadd-os';
// Sideload / source — shown ONLY in /developers, never to consumers.
export const GITHUB_EXT_URL = `${GITHUB_URL}/tree/main/apps/channel0-ext`;

// Per-browser install targets. `live:false` → button renders in a tasteful
// "soon" state (the extension isn't published yet). Flip `live` + set `url`
// per browser when the store listing exists — buttons activate automatically.
export interface BrowserTarget {
  id: 'chrome' | 'edge' | 'firefox' | 'brave' | 'opera';
  label: string;       // button label
  store: string;       // store name (for the "soon" tooltip)
  url: string;         // store URL when live
  live: boolean;
  chromium: boolean;   // Chromium browsers share the Chrome Web Store listing
}

export const BROWSERS: BrowserTarget[] = [
  { id: 'chrome',  label: 'Chrome',  store: 'Chrome Web Store', url: '', live: false, chromium: true },
  { id: 'edge',    label: 'Edge',    store: 'Chrome Web Store', url: '', live: false, chromium: true },
  { id: 'brave',   label: 'Brave',   store: 'Chrome Web Store', url: '', live: false, chromium: true },
  { id: 'opera',   label: 'Opera',   store: 'Chrome Web Store', url: '', live: false, chromium: true },
  { id: 'firefox', label: 'Firefox', store: 'Firefox Add-ons',  url: '', live: false, chromium: false },
];

// True once at least one browser store listing is live.
export const ANY_STORE_LIVE = BROWSERS.some((b) => b.live);
