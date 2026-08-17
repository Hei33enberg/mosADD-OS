// Single source of truth for the package version at RUNTIME.
// ⛔ Never hand-type the version anywhere else (server.ts carried a hardcoded
// "3.0.0-alpha.32" while package.json said alpha.34 — serverInfo lied to every
// connected client). tsup bundles this JSON import, so the constant always
// equals the version that was actually published.
import pkg from "../package.json" with { type: "json" };

export const PKG_VERSION: string = (pkg as { version: string }).version;
