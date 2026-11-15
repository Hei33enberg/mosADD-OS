// 15.11.2026 — pokój PTT z etykietą ma właściciela w nazwie (bramka: mosADD livekit-token/labelRoom.ts).
// Było `mosadd-room-<etykieta>`: jedna nazwa dla wszystkich kont, bez właściciela → 403 dla każdego,
// a wersja „pierwszy wchodzący zajmuje” pozwalała obcemu przejąć pokój.
import { describe, expect, it } from "vitest";
import { labelRoomId } from "../providers/supabase-voice.js";

const G = "68f326ac-3e8b-468e-9bac-328a930de541";

describe("labelRoomId", () => {
  it("etykieta → mosadd-room-<id otwierającego>-<slug>", () => {
    expect(labelRoomId(G, "Field Team")).toBe(`mosadd-room-${G}-field-team`);
  });
  it("bez etykiety → pokój osobisty (goły id, jak dotąd)", () => {
    expect(labelRoomId(G)).toBe(`mosadd-room-${G}`);
  });
  it("dwa konta z tą samą etykietą dostają RÓŻNE pokoje (koniec wspólnej nazwy dla wszystkich)", () => {
    expect(labelRoomId(G, "ops")).not.toBe(labelRoomId("1acbb607-9f66-4074-8295-17c4fb84832c", "ops"));
  });
  it("etykieta z samych znaków specjalnych nie robi z pokoju osobistego", () => {
    expect(labelRoomId(G, "!!!")).toBe(`mosadd-room-${G}-room`);
  });
});
