/** @type {import('next').NextConfig} */
//
// hub.mosadd.com is being retired in favour of mosadd.dev/hub (LINEAR-3143 /
// A7). One domain = docs + panel = best funnel; maintaining two SSR Next apps
// for the same job bled features (the embed addon was invisible on .dev, plan
// limits drifted) and operations.
//
// Until the DNS flip happens, this app responds to every request with a
// permanent (308) redirect to https://mosadd.dev/hub. The auth callback
// (/auth/callback) and login (/login) routes redirect too — Supabase OAuth /
// magic-link redirect URLs should already be moving to mosadd.dev/hub as part
// of A4 (LINEAR-3140).
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Specific high-value paths -> /hub root on the canonical domain
      { source: "/", destination: "https://mosadd.dev/hub", permanent: true },
      { source: "/dashboard", destination: "https://mosadd.dev/hub", permanent: true },
      { source: "/embed", destination: "https://mosadd.dev/embed/new", permanent: true },
      { source: "/embed/new", destination: "https://mosadd.dev/embed/new", permanent: true },
      { source: "/login", destination: "https://mosadd.dev/hub", permanent: true },
      // Catch-all for anything else
      { source: "/:path*", destination: "https://mosadd.dev/hub", permanent: true },
    ];
  },
};
export default nextConfig;
