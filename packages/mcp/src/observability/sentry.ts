/**
 * Sentry init for @m0ssad/mcp.
 *
 * Optional. The MCP server runs entirely as user-supplied stdio — most
 * operators won't want their tool errors phoning home. We expose an opt-in
 * env var (M0SSAD_SENTRY_DSN) so power users / hub-operators can attach.
 *
 * Setup (one-time, hub operators):
 *   1. Create a project in https://papugai.sentry.io named "mosadd-mcp"
 *      with platform = Node.
 *   2. Export M0SSAD_SENTRY_DSN before running the server.
 *
 * Without the env var, this module is an inert no-op.
 */

const DSN = process.env.M0SSAD_SENTRY_DSN;
const ENV =
  process.env.M0SSAD_SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "production";
const RELEASE = process.env.M0SSAD_SENTRY_RELEASE;

let initialized = false;
// @sentry/node is an OPTIONAL peer — operators install it only if they opt in
// via M0SSAD_SENTRY_DSN. Typed as `any` + loaded via a non-literal specifier so
// the package compiles and ships without the dependency present.
let sentryRef: any = null;

export async function initSentry(): Promise<void> {
  if (initialized || !DSN) return;
  try {
    // Lazy, optional import (variable specifier => tsc won't require the module).
    const spec = "@sentry/node";
    const Sentry: any = await import(spec).catch(() => null);
    if (!Sentry) return;
    Sentry.init({
      dsn: DSN,
      environment: ENV,
      release: RELEASE,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      beforeSend(event: any) {
        // Strip Authorization header / BYOK env values if they sneak in.
        if (event.extra) {
          for (const k of Object.keys(event.extra)) {
            if (/auth|token|key|secret/i.test(k)) {
              event.extra[k] = "[redacted]";
            }
          }
        }
        return event;
      },
    });
    sentryRef = Sentry;
    initialized = true;
  } catch {
    // Init failures are non-fatal. MCP servers must keep serving.
  }
}

/**
 * Capture an exception with optional tool context. Safe to call before init —
 * no-ops when DSN is unset.
 */
export function captureToolError(
  err: unknown,
  ctx: { tool?: string; user_id?: string } = {}
): void {
  if (!sentryRef) return;
  try {
    sentryRef.withScope((scope: any) => {
      if (ctx.tool) scope.setTag("tool", ctx.tool);
      if (ctx.user_id) scope.setUser({ id: ctx.user_id });
      sentryRef!.captureException(err);
    });
  } catch {
    // ignore
  }
}
