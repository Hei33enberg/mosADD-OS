// Mocked "trending rooms" ranking for the launch/investor demo (gated by
// DEMO_MODE in site.ts). Curated from the world's most-visited sites, with
// "online now" counts roughly scaled to global popularity — plus a few
// deliberate exceptions where a smaller site punches above its weight
// (strajkpolski.org, where we actually seed/test). Believable, not absurd.

export interface MockRoom { domain: string; online: number }

export const MOCK_ROOMS: MockRoom[] = [
  { domain: 'youtube.com',      online: 4812 },
  { domain: 'google.com',       online: 4377 },
  { domain: 'facebook.com',     online: 3940 },
  { domain: 'instagram.com',    online: 3611 },
  { domain: 'tiktok.com',       online: 3208 },
  { domain: 'x.com',            online: 2986 },
  { domain: 'strajkpolski.org', online: 2741 }, // ← exception: small site, hot room
  { domain: 'amazon.com',       online: 2502 },
  { domain: 'reddit.com',       online: 2274 },
  { domain: 'chatgpt.com',      online: 2010 },
  { domain: 'netflix.com',      online: 1788 },
  { domain: 'whatsapp.com',     online: 1542 },
  { domain: 'wikipedia.org',    online: 1361 },
  { domain: 'twitch.tv',        online: 1190 },
  { domain: 'allegro.pl',       online: 1043 }, // ← PL exception, strong
  { domain: 'aliexpress.com',   online: 932 },
  { domain: 'booking.com',      online: 818 },
  { domain: 'ebay.com',         online: 704 },
  { domain: 'spotify.com',      online: 651 },
  { domain: 'olx.pl',           online: 588 },
  { domain: 'nike.com',         online: 512 },
  { domain: 'zalando.pl',       online: 447 },
  { domain: 'onet.pl',          online: 392 },
  { domain: 'wp.pl',            online: 268 },
];

// sort desc by online
export const TOP_ROOMS: MockRoom[] = [...MOCK_ROOMS].sort((a, b) => b.online - a.online);

/** Small bounded random walk so counts gently tick during the demo. */
export function jitter(n: number): number {
  const delta = Math.round((Math.random() - 0.5) * Math.max(2, n * 0.012));
  return Math.max(1, n + delta);
}
