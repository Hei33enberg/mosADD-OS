/**
 * mDISCORD bridge.
 *
 * Phase 1 alpha is the scaffold. Real protocol wiring lands when we vendor
 * the Discord client (discord.js or discord-api-types).
 *
 * Env (BYOK):
 *   - MOSADD_DISCORD_TOKEN  bot token (Discord Developer Portal)
 *   - MOSADD_DISCORD_GUILD  default guild id (optional)
 */

import {
  BridgeNotImplementedError,
  type BridgeConfig,
  type BridgeProvider,
  type ListMessagesInput,
  type ListMessagesResult,
  type SendBridgeMessageInput,
  type SendBridgeMessageResult,
} from "../base.js";

export interface DiscordConfig {
  token: string;
  guild_id?: string;
}

export class DiscordBridge implements BridgeProvider {
  readonly network = "discord";
  readonly displayName = "Discord";

  async verifyConfig(config: BridgeConfig): Promise<{ ok: true; remote_user?: string }> {
    this.assertConfig(config);
    // Real impl: GET /users/@me with Bot {token}
    throw new BridgeNotImplementedError(this.network, "verifyConfig");
  }

  async sendMessage(
    config: BridgeConfig,
    _input: SendBridgeMessageInput,
  ): Promise<SendBridgeMessageResult> {
    this.assertConfig(config);
    // Real impl: POST /channels/{channel.id}/messages
    throw new BridgeNotImplementedError(this.network, "sendMessage");
  }

  async listMessages(
    config: BridgeConfig,
    _input: ListMessagesInput,
  ): Promise<ListMessagesResult> {
    this.assertConfig(config);
    // Real impl: GET /channels/{channel.id}/messages
    throw new BridgeNotImplementedError(this.network, "listMessages");
  }

  async resolveHandle(
    config: BridgeConfig,
    _handle: string,
  ): Promise<{ id: string; display_name?: string }> {
    this.assertConfig(config);
    // Real impl: GET /users/{user.id} or guild member lookup
    throw new BridgeNotImplementedError(this.network, "resolveHandle");
  }

  private assertConfig(config: BridgeConfig): DiscordConfig {
    if (typeof config?.token !== "string") {
      throw new Error("DiscordBridge requires { token } — see env MOSADD_DISCORD_TOKEN");
    }
    return config as unknown as DiscordConfig;
  }
}
