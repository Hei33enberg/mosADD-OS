/**
 * `mosadd login` / `logout` / `whoami` — session helper.
 *
 * Removes the "copy a JWT from mosadd.com DevTools" hack: signs in with
 * Supabase email+password (BYOK project URL + anon key) and stores the session
 * at ~/.mosadd/session.json, which the MCP server reads automatically.
 *
 * Credentials resolution (first found wins): CLI flags → env → interactive
 * prompt. URL/anon also fall back to a previously saved session.
 */

import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";
import { loadSession, saveSession, clearSession, sessionPath, isSessionExpired } from "../config.js";

function parseFlags(args: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[(i += 1)] : "true";
      out[key] = val;
    }
  }
  return out;
}

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Mute echoed characters for password entry.
      const ro = rl as unknown as { _writeToOutput: (s: string) => void; output?: NodeJS.WriteStream };
      let first = true;
      ro._writeToOutput = (s: string) => {
        if (first) {
          process.stdout.write(question);
          first = false;
        } else if (s.includes("\n")) {
          process.stdout.write("\n");
        }
      };
    }
    rl.question(hidden ? "" : question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function login(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const prev = loadSession();

  const url =
    flags.url || process.env.M0SSAD_SUPABASE_URL || prev?.url || (await prompt("Supabase URL: "));
  const anonKey =
    flags.anon ||
    process.env.M0SSAD_SUPABASE_ANON_KEY ||
    prev?.anonKey ||
    (await prompt("Supabase anon key: "));
  const email = flags.email || process.env.MOSADD_EMAIL || (await prompt("Email: "));
  const password = flags.password || process.env.MOSADD_PASSWORD || (await prompt("Password: ", true));

  if (!url || !anonKey || !email || !password) {
    console.error("\nmosadd login: need Supabase URL, anon key, email and password.");
    process.exit(1);
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error(`\nmosadd login failed: ${error?.message ?? "no session returned"}`);
    process.exit(1);
  }

  saveSession({
    url,
    anonKey,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    email: data.user?.email ?? email,
  });

  const when = data.session.expires_at
    ? new Date(data.session.expires_at * 1000).toISOString()
    : "unknown";
  console.log(`\n✓ Signed in as ${data.user?.email ?? email}`);
  console.log(`  Session saved to ${sessionPath()} (token expires ${when}).`);
  console.log(`  The mosadd MCP server will now use it automatically — no env vars needed.`);
}

function whoami(): void {
  const s = loadSession();
  if (!s) {
    console.log("Not logged in. Run `mosadd login`.");
    process.exit(1);
  }
  const expired = isSessionExpired(s);
  console.log(`Logged in as ${s.email ?? "(unknown)"} @ ${s.url}`);
  console.log(`Token: ${expired ? "EXPIRED — run `mosadd login` again" : "valid"}`);
}

function logout(): void {
  console.log(clearSession() ? "✓ Logged out (session cleared)." : "No session to clear.");
}

export async function runAuthCommand(cmd: string, args: string[]): Promise<void> {
  switch (cmd) {
    case "login":
      await login(args);
      break;
    case "whoami":
      whoami();
      break;
    case "logout":
      logout();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }
}
