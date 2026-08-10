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
      // ⭐ CATCH-ALL RESTORED 2026-08-09 — ON THE FOUNDER'S EXPLICIT ORDER, which is the one
      // condition the previous note demanded before re-adding it. He sent the mosadd.dev URL and
      // said: "a to wyłącz, bo od devów tak czy siak jest mosadd.com i github mosADD-OS."
      //
      // History, so nobody flips this a fourth time:
      //   2026-07-15  catch-all added, committed, never deployed
      //   2026-07-20  founder ruled mosadd.dev LIVE ("the Realm") → catch-all removed
      //   2026-08-01  it went live by accident on a fresh deploy → reverted the same hour
      //   2026-08-09  founder ordered the domain OFF → restored here, deliberately
      //   2026-08-10  mosadd.com side already cleaned: the LP footer's realm link is gone and the
      //               only remaining in-app link sits on /next, whose route is OFF. So nothing we
      //               ship points a visitor here any more — this redirect catches the leftovers
      //               (old links, bookmarks, search results) instead of showing them a second,
      //               unmaintained developer site.
      //
      // ⛔ The four rules above stay ABOVE this one: Next matches the first hit, and those are the
      // Chrome-Web-Store privacy/abuse URLs that MUST keep resolving to murl.mosadd.com.
      // Reversal is one deletion — but it needs the founder's word, same as this addition did.
      { source: '/', destination: 'https://mosadd.com/developers', permanent: true },
      { source: '/:path*', destination: 'https://mosadd.com/developers', permanent: true },
    ];
  },
};

export default config;
