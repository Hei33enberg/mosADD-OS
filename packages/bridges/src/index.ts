/**
 * @m0ssad/bridges — Bridge Provider Pack
 *
 * Reach contacts on existing networks (Matrix, Discord, Telegram, Slack, Signal,
 * WhatsApp, iMessage) WITHOUT forcing them to sign up for mosadd. Solves
 * mosadd's chicken-and-egg adoption problem.
 *
 * Design adopted from the Hermes Agent `gateway/platforms/` pattern
 * (Nous Research, MIT — see /NOTICE for attribution).
 */

export * from "./base.js";
export { MatrixBridge, type MatrixConfig } from "./matrix/index.js";
export { DiscordBridge, type DiscordConfig } from "./discord/index.js";
export { TelegramBridge, type TelegramConfig } from "./telegram/index.js";

import type { BridgeProvider } from "./base.js";
import { MatrixBridge } from "./matrix/index.js";
import { DiscordBridge } from "./discord/index.js";
import { TelegramBridge } from "./telegram/index.js";

/**
 * Registry of all built-in bridge adapters. Lookup by `network` id.
 *
 *   bridges.get("matrix").sendMessage(config, { to: "!room:...", text: "hi" })
 */
export const bridges = {
  matrix: new MatrixBridge(),
  discord: new DiscordBridge(),
  telegram: new TelegramBridge(),
} as const;

export type BridgeNetwork = keyof typeof bridges;

export function getBridge(network: string): BridgeProvider {
  const b = (bridges as Record<string, BridgeProvider>)[network];
  if (!b) {
    throw new Error(
      `Unknown bridge network "${network}". Built-in: ${Object.keys(bridges).join(", ")}`,
    );
  }
  return b;
}
