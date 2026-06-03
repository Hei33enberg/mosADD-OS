import { redirect } from "next/navigation";
import Link from "next/link";
import { serverClient } from "@/lib/supabase-server";
import NewEmbedKeyForm from "./new-form";

export default async function NewEmbedKey() {
  const sb = await serverClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) redirect("/login?next=/embed/new");

  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <Link href="/" className="text-sm font-black tracking-[0.25em]">
            mosadd<span className="text-primary" style={{ verticalAlign: "super", fontSize: "0.55em", marginLeft: "0.1em" }}>™</span> hub
          </Link>
          <Link href="/embed" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground px-3 py-2">
            ← All embeds
          </Link>
        </div>
      </header>

      <section className="container py-8 max-w-2xl">
        <h1 className="text-2xl font-black tracking-widest uppercase mb-2">New embed</h1>
        <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
          Pick a channel name, list the domain(s) you&apos;ll embed on, click create. You&apos;ll see the snippet to paste
          + the publishable key (shown ONCE — copy it now).
        </p>

        <NewEmbedKeyForm jwt={session.access_token} />
      </section>
    </main>
  );
}
