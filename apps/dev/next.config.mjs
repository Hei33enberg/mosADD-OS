/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  distDir: '.next-build',
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      // KEEP — external + still live. murl.mosadd.com is a separate consumer site,
      // and these are the Chrome-Web-Store privacy/abuse links that MUST keep
      // resolving. They stay ABOVE the catch-all (Next matches the first hit).
      { source: '/murl', destination: 'https://murl.mosadd.com', permanent: true },
      { source: '/murl/:path*', destination: 'https://murl.mosadd.com/:path*', permanent: true },
      { source: '/channel0', destination: 'https://murl.mosadd.com', permanent: true },
      { source: '/channel0/:path*', destination: 'https://murl.mosadd.com/:path*', permanent: true },
      // ⛔ The 2026-07-15 "retire mosadd.dev" catch-all (301 everything →
      // mosadd.com/developers) is REMOVED. It was committed but never deployed;
      // on 2026-07-20 the founder explicitly ruled mosadd.dev LIVE ("the Realm")
      // and the LP footer links out to it — a domain-wide redirect contradicts
      // that standing decision. It briefly went live on 2026-08-01 when a fresh
      // deploy carried it by accident; reverted the same hour. Do not re-add a
      // catch-all here without the founder's explicit say-so.
    ];
  },
};

export default config;
