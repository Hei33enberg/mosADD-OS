// 15.11.2026 — odbiorca głosówki przez MCP widział sam podpis. message-list (mosADD) oddaje już
// transcript / audio_url / duration_ms; mDM_list ma je przekazać w polu `voice`.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { voiceFields } from "../tools/voice-format.js";

describe("voiceFields", () => {
  it("głosówka z transkryptem i adresem → pole voice", () => {
    expect(voiceFields({ messageType: "voice", transcript: "raz dwa", audioUrl: "https://x/a.ogg", durationMs: 4500 }))
      .toEqual({ voice: { transcript: "raz dwa", audio_url: "https://x/a.ogg", duration_ms: 4500 } });
  });
  it("tekst → brak pola voice", () => {
    expect(voiceFields({ messageType: "text" })).toEqual({});
  });
  it("głosówka bez transkryptu → null, nie znika", () => {
    expect(voiceFields({ messageType: "ptt" })).toEqual({ voice: { transcript: null, audio_url: null, duration_ms: null } });
  });
  it("provider i mDM_list przenoszą pola z message-list", () => {
    const prov = readFileSync(new URL("../providers/supabase-dm.ts", import.meta.url), "utf8");
    const tool = readFileSync(new URL("../tools/mdm.ts", import.meta.url), "utf8");
    expect(prov).toContain("transcript: m.transcript ?? null");
    expect(tool).toContain("...voiceFields(m)");
  });
});
