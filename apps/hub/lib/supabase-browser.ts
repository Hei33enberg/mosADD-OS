"use client";
// Browser-side Supabase client — uses anon key. RLS gates everything;
// privileged ops (key issuance, Stripe checkout) go through Supabase edge fns.
import { createBrowserClient } from "@supabase/ssr";

export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
