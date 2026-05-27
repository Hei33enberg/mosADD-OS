/**
 * mMATRIX bridge — Matrix.org federation.
 *
 * The first bridge we ship because:
 *   - Apache-2.0 client SDK (matrix-bot-sdk) — clean license
 *   - mautrix-style bot accounts are well-understood
 *   - Matrix homeservers federate, so reaching anyone on the public Matrix
 *     network requires just one bot user (mosadd-bridge@mosadd.com)
 *   - Encryption-by-default story aligns with mosadd's privacy framing
 *
 * Phase 1 alpha is the scaffold + env contract; protocol wiring lands when
 * we vendor matrix-bot-sdk (or @types/matrix-js-sdk if we choose that
 * client) and stand up the bot account.
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

/**
 * Matrix-specific config shape.
 *
 * Env (BYOK):
 *   - M0SSAD_MATRIX_HOMESERVER   e.g. https://matrix.example.com
 *   - M0SSAD_MATRIX_ACCESS_TOKEN bot account access token
 *   - M0SSAD_MATRIX_USER_ID      e.g. @mosadd-bridge:matrix.org
 */
export interface MatrixConfig {
  homeserver: string;
  access_token: string;
  user_id: string;
  /** Enable E2E encryption (requires libolm). Default false. */
  e2e_enabled?: boolean;
}

export class MatrixBridge implements BridgeProvider {
  readonly network = "matrix";
  readonly displayName = "Matrix";

  async verifyConfig(config: BridgeConfig): Promise<{ ok: true; remote_user?: string }> {
    this.assertConfig(config);
    // Phase 1: real impl will hit /_matrix/client/v3/account/whoami with the access_token
    // and confirm user_id matches. For now we surface the contract.
    // Future:
    //   const whoami = await fetch(`${matrix.homeserver}/_matrix/client/v3/account/whoami`, {
    //     headers: { Authorization: `Bearer ${matrix.access_token}` },
    //   }).then((r) => r.json());
    //   return { ok: true, remote_user: whoami.user_id };
    throw new BridgeNotImplementedError(this.network, "verifyConfig");
  }

  async sendMessage(
    config: BridgeConfig,
    _input: SendBridgeMessageInput,
  ): Promise<SendBridgeMessageResult> {
    this.assertConfig(config);
    // Real impl: PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId}
    throw new BridgeNotImplementedError(this.network, "sendMessage");
  }

  async listMessages(
    config: BridgeConfig,
    _input: ListMessagesInput,
  ): Promise<ListMessagesResult> {
    this.assertConfig(config);
    // Real impl: GET /_matrix/client/v3/rooms/{roomId}/messages?dir=b
    throw new BridgeNotImplementedError(this.network, "listMessages");
  }

  async resolveHandle(
    config: BridgeConfig,
    _handle: string,
  ): Promise<{ id: string; display_name?: string }> {
    this.assertConfig(config);
    // Matrix handles are already canonical (@user:server). resolveHandle becomes a
    // profile fetch + display_name lookup.
    throw new BridgeNotImplementedError(this.network, "resolveHandle");
  }

  private assertConfig(config: BridgeConfig): MatrixConfig {
    if (
      typeof config?.homeserver !== "string" ||
      typeof config?.access_token !== "string" ||
      typeof config?.user_id !== "string"
    ) {
      throw new Error(
        "MatrixBridge requires { homeserver, access_token, user_id } — see env M0SSAD_MATRIX_*",
      );
    }
    return config as unknown as MatrixConfig;
  }
}
