import type { MetadataRoute } from 'next';

const BASE = 'https://mosadd.dev';

// Kept in sync with the route tree. lastModified is a build-time constant
// (Date.now() is unavailable in some build sandboxes; a stable date is fine
// for a docs portal and avoids churn in the generated sitemap).
const LAST_MODIFIED = '2026-06-03';

const ROUTES: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, freq: 'weekly' },
  { path: '/docs', priority: 0.9, freq: 'weekly' },
  { path: '/docs/quickstart', priority: 0.9, freq: 'weekly' },
  { path: '/docs/auth', priority: 0.8, freq: 'monthly' },
  { path: '/docs/mcp', priority: 0.9, freq: 'weekly' },
  { path: '/docs/modules', priority: 0.7, freq: 'monthly' },
  { path: '/docs/modules/mdm', priority: 0.6, freq: 'monthly' },
  { path: '/docs/modules/mirc', priority: 0.6, freq: 'monthly' },
  { path: '/docs/modules/mroom', priority: 0.6, freq: 'monthly' },
  { path: '/docs/modules/mail', priority: 0.6, freq: 'monthly' },
  { path: '/docs/modules/mtalk', priority: 0.5, freq: 'monthly' },
  { path: '/docs/sdk', priority: 0.8, freq: 'monthly' },
  { path: '/docs/rfcs', priority: 0.5, freq: 'monthly' },
  { path: '/docs/security', priority: 0.6, freq: 'monthly' },
  { path: '/blog', priority: 0.7, freq: 'weekly' },
  { path: '/blog/mosadd-vs-twilio-agent-connect', priority: 0.7, freq: 'monthly' },
  { path: '/blog/channel0-every-domain-is-a-room', priority: 0.85, freq: 'monthly' },
  { path: '/channel0/privacy', priority: 0.4, freq: 'monthly' },
  { path: '/examples', priority: 0.8, freq: 'weekly' },
  { path: '/download', priority: 0.8, freq: 'weekly' },
  { path: '/community', priority: 0.6, freq: 'monthly' },
  { path: '/changelog', priority: 0.6, freq: 'weekly' },
  { path: '/pricing', priority: 0.5, freq: 'monthly' },
  { path: '/embed', priority: 0.9, freq: 'weekly' },
  { path: '/embed/install', priority: 0.85, freq: 'weekly' },
  { path: '/embed/wordpress', priority: 0.9, freq: 'weekly' },
  { path: '/channel0', priority: 0.95, freq: 'weekly' },
  { path: '/domains', priority: 0.85, freq: 'weekly' },
  { path: '/c/zalando.pl', priority: 0.6, freq: 'monthly' },
  { path: '/c/allegro.pl', priority: 0.6, freq: 'monthly' },
  { path: '/c/github.com', priority: 0.6, freq: 'monthly' },
  { path: '/skins', priority: 0.7, freq: 'weekly' },
  { path: '/skins/editor', priority: 0.5, freq: 'monthly' },
  { path: '/status', priority: 0.3, freq: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
