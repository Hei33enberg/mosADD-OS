import Link from "next/link";
import { serverClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Landing — if signed in, send straight to /dashboard. Otherwise the "your hub"
// pitch + sign-in CTA. Minimal on purpose; the dashboard is the product.
export default async function Home() {
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <span className="text-sm font-black tracking-[0.25em]">
            mosadd<span className="text-primary" style={{ verticalAlign: "super", fontSize: "0.55em", marginLeft: "0.1em" }}>™</span> hub
          </span>
          <Link href="/login" className="px-3 py-2 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-70 transition">
            Sign in
          </Link>
        </div>
      </header>

      <section className="container py-12">
        <h1 className="text-3xl font-black tracking-widest uppercase">Your mosadd hub.</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Self-serve dashboard for <code>@mosadd/mcp</code>. Sign in, issue an API key, paste a one-line install snippet into Claude Code / Cursor / your agent. 64 live MCP tools across 5 live channel modules (mDM, mIRC, mp0st, mTALK, mRAG) plus comms + the defensive threat engine, $0 to start.
        </p>

        <div className="mt-8 flex gap-4">
          <Link href="/login" className="px-4 py-3 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-70 transition">
            Create your free key →
          </Link>
          <Link href="https://mosadd.dev/docs/quickstart" className="px-4 py-3 text-xs uppercase tracking-widest border border-primary text-primary hover:bg-primary/10 transition">
            Docs ↗
          </Link>
        </div>

        <div className="mt-8 grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[
            { plan: "Free", price: "$0/mo", note: "1,000 messages/mo · 1 key" },
            { plan: "Pro", price: "$9/mo", note: "10k messages · 1k RAG · 5 keys" },
            { plan: "Team", price: "$29/mo", note: "100k messages · 10k RAG · white-label" },
          ].map((t) => (
            <div key={t.plan} className="border border-border p-4 bg-card">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t.plan}</div>
              <div className="text-lg font-bold">{t.price}</div>
              <div className="text-xs text-muted-foreground mt-2">{t.note}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Self-host (BYOK) is unlimited, $0 forever. The hosted hub is for zero-setup.
        </p>
      </section>

      <footer className="border-t border-border mt-8">
        <div className="container py-3 text-xs text-muted-foreground flex justify-between">
          <span>mosadd hub · alpha</span>
          <span>
            <Link href="https://mosadd.dev" className="hover:text-primary">mosadd.dev</Link>{" · "}
            <Link href="https://github.com/Hei33enberg/mosadd-os" className="hover:text-primary">GitHub</Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
