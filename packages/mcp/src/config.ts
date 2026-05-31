/**
 * Local session config for the mosadd CLI (`mosadd login`).
 *
 * Stores the authenticated session at `~/.mosadd/session.json` so the MCP
 * server can pick up credentials without the user pasting an expiring JWT
 * from mosadd.com DevTools into env vars. Env vars still take precedence.
 *
 * The file holds a Supabase session (BYOK): the project URL + anon key (both
 * public, RLS-gated) and the user's access/refresh tokens.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync } from "node:fs";

export interface MosaddSession {
  url: string;
  anonKey: string;
  accessToken: string;
  refreshToken?: string;
  /** Unix seconds when the access token expires. */
  expiresAt?: number;
  email?: string;
}

export function configDir(): string {
  return join(homedir(), ".mosadd");
}

export function sessionPath(): string {
  return join(configDir(), "session.json");
}

export function loadSession(): MosaddSession | null {
  try {
    const raw = readFileSync(sessionPath(), "utf8");
    const s = JSON.parse(raw) as MosaddSession;
    if (s && typeof s.url === "string" && typeof s.anonKey === "string") return s;
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: MosaddSession): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(sessionPath(), JSON.stringify(session, null, 2), "utf8");
  // Best-effort tighten perms (no-op on platforms that ignore it).
  try {
    chmodSync(sessionPath(), 0o600);
  } catch {
    /* ignore */
  }
}

export function clearSession(): boolean {
  if (!existsSync(sessionPath())) return false;
  rmSync(sessionPath());
  return true;
}

/** True if the stored token is past (or within 30s of) its expiry. */
export function isSessionExpired(session: MosaddSession): boolean {
  if (!session.expiresAt) return false;
  return Date.now() / 1000 >= session.expiresAt - 30;
}
