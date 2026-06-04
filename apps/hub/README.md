# `@mosadd/hub` — self-serve hub portal

The dashboard where a developer signs up, gets a `mosadd_sk_live_…` key, and starts using the 42 MCP tools. Stripe TEST checkout for Pro/Team. Lives at `hub.mosadd.com` (DNS in Vercel — see deploy section).

## Architecture (MVP — LINEAR-2603)
- **Auth:** Supabase magic-link (no password). User signs in → cookie session via `@supabase/ssr`.
- **Keys:** dashboard calls `hub-keys` Supabase edge fn with the user JWT (POST/GET/DELETE) — shows the plaintext key ONCE.
- **Billing:** `create-checkout-session` Supabase edge fn → Stripe checkout on the dedicated mosADD account `acct_1TeaGi` (one account for mosadd.com + mosadd.dev; separate from CYMRU). Dev products `prod_UdsRp5…` Pro ($9) / `prod_UdsRtF…` Team ($29) / `prod_UdsRsS…` Brand-removal ($3). The EF reads `STRIPE_SECRET_KEY_MOSADD`, never the bare key.
- **No DB writes from this app** — all state lives in Supabase via edge fns; portal is a thin shell.

## Routes
- `/` — landing (redirects to /dashboard when signed in)
- `/login` — magic-link form
- `/auth/callback` — Supabase OAuth code → session
- `/auth/signout` — clear session
- `/dashboard` — keys + plan upgrade

## Deploy (Vercel)
Push to main → Vercel auto-deploys (assumes a Vercel project pointed at `apps/hub`). DNS `hub.mosadd.com` lives in Vercel (same as `mosadd.com` / `mosadd.dev`). Owner gates:
1. Create Vercel project for `apps/hub` (or add to existing mosadd Vercel org).
2. Add domain `hub.mosadd.com`.
3. Flip Stripe to **LIVE** mode (env vars in Supabase edge fns) when ready for real money.

## Local dev
```sh
npm install
NEXT_PUBLIC_SUPABASE_URL=https://rooffhgbxafyjcwmwpsy.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon> \
npm run dev
```
