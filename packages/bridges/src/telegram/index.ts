/**
 * mTELEGRAM bridge.
 *
 * Two flavours: Bot API (simple, no MTProto required) and MTProto user
 * sessions (full client power, can post as the user, message group chats
 * they're in, etc.). Phase 1 alpha defines both shapes; real wiring lands
 * when we vendor `telegraf` (bot) and/or `gram.js` / `mtproto-core` (user).
 *
 * Env (BYOK):
 *   - MOSADD_TELEGRAM_BOT_TOKEN     bot token from @BotFather (bot mode)
 *   - MOSADD_TELEGRAM_API_ID        MTProto api_id (user mode)
 *   - MOSADD_TELEGRAM_API_HASH      MTProto api_hash (user mode)
 *   - MOSADD_TELEGRAM_SESSION       serialized MTProto session string (user mode)
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

export type TelegramConfig =
  | { mode: "bot"; bot_token: string }
  | { mode: "user"; api_id: string; api_hash: string; session: string };

export class TelegramBridge implements BridgeProvider {
  readonly network = "telegram";
  readonly displayName = "Telegram";

  async verifyConfig(config: BridgeConfig): Promise<{ ok: true; remote_user?: string }> {
    this.assertConfig(config);
    // Bot mode: GET https://api.telegram.org/bot{token}/getMe
    // User mode: MTProto users.getFullUser(self)
    throw new BridgeNotImplementedError(this.network, "verifyConfig");
  }

  async sendMessage(
    config: BridgeConfig,
    _input: SendBridgeMessageInput,
  ): Promise<SendBridgeMessageResult> {
    this.assertConfig(config);
    // Bot mode: POST sendMessage
    // User mode: messages.sendMessage MTProto call
    throw new BridgeNotImplementedError(this.network, "sendMessage");
  }

  async listMessages(
    config: BridgeConfig,
    _input: ListMessagesInput,
  ): Promise<ListMessagesResult> {
    this.assertConfig(config);
    // Bot mode: getUpdates loop (limited history)
    // User mode: messages.getHistory MTProto call
    throw new BridgeNotImplementedError(this.network, "listMessages");
  }

  async resolveHandle(
    config: BridgeConfig,
    _handle: string,
  ): Promise<{ id: string; display_name?: string }> {
    this.assertConfig(config);
    // Bot mode: no resolve — bots cannot search users by @handle freely
    // User mode: contacts.resolveUsername MTProto call
    throw new BridgeNotImplementedError(this.network, "resolveHandle");
  }

  private assertConfig(config: BridgeConfig): TelegramConfig {
    const c = config as Record<string, unknown>;
    if (typeof c?.bot_token === "string") {
      return { mode: "bot", bot_token: c.bot_token };
    }
    if (
      typeof c?.api_id === "string" &&
      typeof c?.api_hash === "string" &&
      typeof c?.session === "string"
    ) {
      return {
        mode: "user",
        api_id: c.api_id,
        api_hash: c.api_hash,
        session: c.session,
      };
    }
    throw new Error(
      "TelegramBridge requires either { bot_token } (bot mode) or { api_id, api_hash, session } (user mode) — see env MOSADD_TELEGRAM_*",
    );
  }
}
