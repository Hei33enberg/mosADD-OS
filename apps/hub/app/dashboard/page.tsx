import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase-server";
import KeysClient from "./keys-client";

// Dashboard. Server-side: confirm we have a user (otherwise → /login). Then
// hand the JWT to the client component, which talks to Supabase edge fns
// (hub-keys, create-checkout-session) directly with the user's token.
export default async function Dashboard() {
  const sb = await serverClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <span className="text-sm font-black tracking-[0.25em]">
            mosadd<span className="text-primary" style={{ verticalAlign: "super", fontSize: "0.55em", marginLeft: "0.1em" }}>™</span> hub
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition px-3 py-2">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="container py-8">
        <h1 className="text-2xl font-black tracking-widest uppercase mb-2">Your dashboard</h1>
        <p className="text-xs text-muted-foreground mb-8">
          Signed in as <code>{session.user.email}</code>
        </p>

        <KeysClient jwt={session.access_token} email={session.user.email ?? ""} />
      </section>
    </main>
  );
}
