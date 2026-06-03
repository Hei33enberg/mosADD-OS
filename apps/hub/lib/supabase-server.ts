// Server-side Supabase — reads the user JWT from cookies so RLS sees the user.
// Used in route handlers + server components for "who am I".
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieKV { name: string; value: string; options?: CookieOptions }

export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(values: CookieKV[]) {
          try {
            values.forEach(({ name, value, options }: CookieKV) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies — only Route Handlers / Server Actions can. Ignore.
          }
        },
      },
    },
  );
}
