import { describe, expect, it } from "vitest";
import {
  BridgeNotImplementedError,
  bridges,
  DiscordBridge,
  getBridge,
  MatrixBridge,
  TelegramBridge,
} from "../index.js";

describe("@m0ssad/bridges", () => {
  describe("registry", () => {
    it("includes the 3 Phase 1 P0 bridges", () => {
      expect(Object.keys(bridges)).toEqual(["matrix", "discord", "telegram"]);
    });

    it("each entry implements BridgeProvider", () => {
      for (const [network, bridge] of Object.entries(bridges)) {
        expect(bridge.network).toBe(network);
        expect(typeof bridge.displayName).toBe("string");
        expect(typeof bridge.verifyConfig).toBe("function");
        expect(typeof bridge.sendMessage).toBe("function");
        expect(typeof bridge.listMessages).toBe("function");
        expect(typeof bridge.resolveHandle).toBe("function");
      }
    });
  });

  describe("getBridge", () => {
    it("returns the requested bridge", () => {
      expect(getBridge("matrix")).toBeInstanceOf(MatrixBridge);
      expect(getBridge("discord")).toBeInstanceOf(DiscordBridge);
      expect(getBridge("telegram")).toBeInstanceOf(TelegramBridge);
    });

    it("throws informatively for unknown network", () => {
      expect(() => getBridge("zoom")).toThrow(/Unknown bridge network "zoom"/);
    });
  });

  describe("MatrixBridge config validation", () => {
    const bridge = new MatrixBridge();
    const validConfig = {
      homeserver: "https://matrix.example.com",
      access_token: "tk-1",
      user_id: "@bot:matrix.example.com",
    };

    it("network/displayName are set", () => {
      expect(bridge.network).toBe("matrix");
      expect(bridge.displayName).toBe("Matrix");
    });

    it("throws on missing config", async () => {
      await expect(bridge.verifyConfig({})).rejects.toThrow(/MatrixBridge requires/);
    });

    it("throws BridgeNotImplementedError when called with valid config", async () => {
      await expect(bridge.verifyConfig(validConfig)).rejects.toBeInstanceOf(
        BridgeNotImplementedError,
      );
      await expect(bridge.sendMessage(validConfig, { to: "!r:x", text: "hi" })).rejects.toBeInstanceOf(
        BridgeNotImplementedError,
      );
    });
  });

  describe("DiscordBridge config validation", () => {
    const bridge = new DiscordBridge();

    it("throws on missing token", async () => {
      await expect(bridge.verifyConfig({})).rejects.toThrow(/DiscordBridge requires/);
    });

    it("not-implemented with valid config", async () => {
      await expect(bridge.verifyConfig({ token: "t" })).rejects.toBeInstanceOf(
        BridgeNotImplementedError,
      );
    });
  });

  describe("TelegramBridge dual-mode config", () => {
    const bridge = new TelegramBridge();

    it("accepts bot mode", async () => {
      await expect(bridge.verifyConfig({ bot_token: "abc" })).rejects.toBeInstanceOf(
        BridgeNotImplementedError,
      );
    });

    it("accepts user mode", async () => {
      await expect(
        bridge.verifyConfig({ api_id: "1", api_hash: "h", session: "s" }),
      ).rejects.toBeInstanceOf(BridgeNotImplementedError);
    });

    it("rejects empty config", async () => {
      await expect(bridge.verifyConfig({})).rejects.toThrow(/TelegramBridge requires/);
    });

    it("rejects partial user-mode config", async () => {
      await expect(bridge.verifyConfig({ api_id: "1" })).rejects.toThrow(
        /TelegramBridge requires/,
      );
    });
  });

  describe("BridgeNotImplementedError", () => {
    it("mentions the operation and links to LINEAR-2168", () => {
      const err = new BridgeNotImplementedError("matrix", "sendMessage");
      expect(err.message).toContain("matrix");
      expect(err.message).toContain("sendMessage");
      expect(err.message).toContain("LINEAR-2168");
      expect(err.name).toBe("BridgeNotImplementedError");
    });
  });
});
