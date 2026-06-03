import { redirect } from "next/navigation";
import Link from "next/link";
import { serverClient } from "@/lib/supabase-server";
import EmbedKeysClient from "./embed-keys-client";

// /embed — the creator's embed-key dashboard. Same auth pattern as /dashboard:
// server confirms session, hands the JWT to the client component which talks
// to the embed-keys Edge Function directly.
export default async function EmbedDashboard() {
  const sb = await serverClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <Link href="/" className="text-sm font-black tracking-[0.25em]">
            mosadd<span className="text-primary" style={{ verticalAlign: "super", fontSize: "0.55em", marginLeft: "0.1em" }}>™</span> hub
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground px-3 py-2">
              Hub keys
            </Link>
            <Link href="/embed" className="text-xs uppercase tracking-widest text-foreground px-3 py-2 border-b-2 border-primary">
              Embed keys
            </Link>
            <form action="/auth/signout" method="post" className="ml-2">
              <button type="submit" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition px-3 py-2">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="container py-8 max-w-4xl">
        <h1 className="text-2xl font-black tracking-widest uppercase mb-2">Embed keys</h1>
        <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
          Browser-safe publishable keys for the mIRC embed widget on your site. Each key is scoped to one channel +
          an allow-list of domains. The hub key never leaves the server; the browser only ever holds a 5-min scoped JWT.
        </p>

        <EmbedKeysClient jwt={session.access_token} />
      </section>
    </main>
  );
}
