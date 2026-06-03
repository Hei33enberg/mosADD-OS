/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Env that's safe to expose to the browser. SUPABASE_URL is public; the anon
  // key is also public-by-design (RLS protects data). The service role is NEVER
  // exposed here — Stripe writes etc. go through the Supabase edge functions.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rooffhgbxafyjcwmwpsy.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
};
export default nextConfig;
