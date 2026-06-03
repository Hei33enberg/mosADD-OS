// Handles the magic-link redirect (?code=…) from Supabase, exchanges it for a
// session cookie via SSR helper, then sends the user to /dashboard.
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const sb = await serverClient();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/dashboard", url));
}
