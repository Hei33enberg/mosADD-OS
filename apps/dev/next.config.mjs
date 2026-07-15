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
      // mosadd.dev is retired as a standalone surface — everything else collapses
      // to the builder front door. statusCode:301 (a literal 301; `permanent:true`
      // would emit 308). Fixed destination → every path lands on /developers.
      // The internal /skins, /docs/modules/* redirects are dropped: the catch-all
      // sends them to /developers anyway (no double hops).
      { source: '/:path*', destination: 'https://mosadd.com/developers', statusCode: 301 },
    ];
  },
};

export default config;
