/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  distDir: '.next-build',
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      // The mURL extension (internal codename "channel0") links to /channel0/*,
      // but the site serves those pages under /murl/*. Keep old/extension links
      // alive so the Chrome Web Store privacy/abuse links never 404.
      { source: '/channel0', destination: '/murl', permanent: true },
      { source: '/channel0/:path*', destination: '/murl/:path*', permanent: true },
      // Skin Shop deferred — point any stale /skins link at the embed landing.
      { source: '/skins', destination: '/embed', permanent: false },
      { source: '/skins/:path*', destination: '/embed', permanent: false },
    ];
  },
};

export default config;
