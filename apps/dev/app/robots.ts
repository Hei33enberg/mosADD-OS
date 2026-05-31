import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow everything — this is a public docs portal we WANT indexed,
      // including by AI crawlers (see /llms.txt).
      { userAgent: '*', allow: '/' },
    ],
    sitemap: 'https://mosadd.dev/sitemap.xml',
    host: 'https://mosadd.dev',
  };
}
