"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase-browser";

// Magic-link sign-in via Supabase auth. No password setup; user gets an email
// with a one-click link → /auth/callback → /dashboard.
export default function LoginPage() {
  const sb = browserClient();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setErr("");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setState("error");
      setErr(error.message);
      return;
    }
    setState("sent");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border p-6 bg-card">
        <h1 className="text-xl font-black tracking-widest uppercase mb-2">Sign in</h1>
        <p className="text-xs text-muted-foreground mb-6">
          One-click magic link. No password. We send an email — click the link, you're in.
        </p>

        {state === "sent" ? (
          <div className="text-sm">
            <p className="text-primary font-bold mb-2">CHECK YOUR EMAIL</p>
            <p className="text-muted-foreground text-xs">
              Sent a sign-in link to <code>{email}</code>. Click it to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="bg-primary text-primary-foreground px-4 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition"
              style={state === "sending" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {state === "sending" ? "Sending…" : "Send magic link →"}
            </button>
            {state === "error" && <p className="text-xs text-destructive">{err}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
