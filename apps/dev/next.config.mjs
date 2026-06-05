/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  distDir: '.next-build',
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      // mURL now has its own consumer home at murl.mosadd.com. Send the old
      // mosadd.dev/murl/* (and the legacy /channel0/* extension links) there so
      // there is a single canonical site and CWS privacy/abuse links resolve.
      { source: '/murl', destination: 'https://murl.mosadd.com', permanent: true },
      { source: '/murl/:path*', destination: 'https://murl.mosadd.com/:path*', permanent: true },
      { source: '/channel0', destination: 'https://murl.mosadd.com', permanent: true },
      { source: '/channel0/:path*', destination: 'https://murl.mosadd.com/:path*', permanent: true },
      // Skin Shop deferred — point any stale /skins link at the embed landing.
      { source: '/skins', destination: '/embed', permanent: false },
      { source: '/skins/:path*', destination: '/embed', permanent: false },
      // mCALL (no carrier) + mIRL (design) are not part of the current release —
      // de-listed from the site for now. Send any stale deep links to the modules index.
      { source: '/docs/modules/mcall', destination: '/docs/modules', permanent: false },
      { source: '/docs/modules/mirl', destination: '/docs/modules', permanent: false },
    ];
  },
};

export default config;
