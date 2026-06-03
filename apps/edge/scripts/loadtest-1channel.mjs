#!/usr/bin/env node
/**
 * Load test: 1 channel, N concurrent WS writers, measure broadcast latency.
 * Usage:
 *   EDGE=https://mosadd-edge.<acct>.workers.dev node scripts/loadtest-1channel.mjs [N] [duration_ms]
 *
 * Each client connects, sends one message every ~1s, listens for broadcasts.
 * We measure: connect-time, end-to-end fan-out latency (sender→receiver), errors.
 *
 * For E1: prove that ONE ChannelDO sustains low-thousands of concurrent WS
 * clients without latency cliff. Scale-out (many channels) is automatic — that's
 * the architectural point of DO-per-channel.
 */
import { WebSocket } from "ws";

const EDGE = process.env.EDGE;
if (!EDGE) { console.error("set EDGE=https://...workers.dev"); process.exit(2); }
const N = Number(process.argv[2] ?? 200);
const DURATION = Number(process.argv[3] ?? 30_000);
const CHANNEL = `loadtest-${Math.random().toString(36).slice(2, 8)}`;

const wsUrl = EDGE.replace(/^http/, "ws") + `/c/${CHANNEL}/ws`;
console.log(`channel=${CHANNEL} clients=${N} duration=${DURATION}ms`);

const stats = { connects: 0, sent: 0, received: 0, errors: 0, latencies: [] };
const clients = [];

for (let i = 0; i < N; i++) {
  const ws = new WebSocket(wsUrl);
  ws.on("open", () => stats.connects++);
  ws.on("error", () => stats.errors++);
  ws.on("message", (data) => {
    stats.received++;
    try {
      const msg = JSON.parse(data.toString());
      const ts = Number(msg.ts);
      if (ts) stats.latencies.push(Date.now() - ts);
    } catch {}
  });
  clients.push(ws);
  // Stagger connects so we don't slam the upgrade endpoint
  if (i % 50 === 49) await new Promise((r) => setTimeout(r, 100));
}

// Wait for connections to settle
await new Promise((r) => setTimeout(r, 2000));
console.log(`connected: ${stats.connects}/${N}, errors: ${stats.errors}`);

const stopAt = Date.now() + DURATION;
const sendTimers = clients.map((ws, i) =>
  setInterval(() => {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({ text: `c${i} ${Date.now()}`, from: `c${i}` }));
    stats.sent++;
  }, 1000 + (i % 1000))
);

while (Date.now() < stopAt) await new Promise((r) => setTimeout(r, 1000));
sendTimers.forEach(clearInterval);
clients.forEach((ws) => { try { ws.close(); } catch {} });

const sorted = stats.latencies.sort((a, b) => a - b);
const pct = (p) => sorted[Math.floor((sorted.length - 1) * p)] ?? 0;
console.log(JSON.stringify({
  channel: CHANNEL,
  clients: N,
  connects: stats.connects,
  errors: stats.errors,
  sent: stats.sent,
  received: stats.received,
  fanout_ratio: stats.received / Math.max(1, stats.sent),
  latency_ms: { p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: sorted[sorted.length - 1] ?? 0, samples: sorted.length },
}, null, 2));
