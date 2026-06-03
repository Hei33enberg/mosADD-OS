// Sign out → clear Supabase session cookie → redirect to landing.
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const sb = await serverClient();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
