import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Skin,
  applySkin,
  canonicalJson,
  generateSkinKeyPair,
  sha256Hex,
  signSkinPack,
  skinFromMessenger,
  skinJsonSchema,
  skinManifestJsonSchema,
  validateMessenger,
  validateSkin,
  verifySkinPack,
  type Issue,
  type SkinKeyPair,
} from "../index";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (rel: string) => JSON.parse(readFileSync(join(pkg, rel), "utf8"));
const codes = (issues: Issue[], level?: Issue["level"]) => issues.filter((i) => !level || i.level === level).map((i) => i.code);
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

const crew = () => validateMessenger(load("templates/crew-ptt.json")).messenger!;
const meta = { id: "port-night", version: "1.0.0", author: { name: "Test Author" }, license: "MIT", createdAt: "2026-11-16T03:00:00.000Z" };

let key: SkinKeyPair;
let other: SkinKeyPair;
beforeAll(async () => {
  key = await generateSkinKeyPair();
  other = await generateSkinKeyPair();
});

const pack = async (edit: (s: any) => void = () => {}, assets: Parameters<typeof signSkinPack>[2] = []) => {
  const skin: any = clone(skinFromMessenger(crew()));
  edit(skin);
  return signSkinPack(skin, meta, assets, key);
};

describe("skin from a messenger", () => {
  it("takes the theme and the name, and validates", () => {
    const skin = skinFromMessenger(crew());
    expect(skin.name).toBe("Port Radio");
    expect(skin.tokens.dark?.accent).toBe("#ffb020");
    const r = validateSkin(skin);
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("applySkin changes only the look: blocks, layout and releases stay byte for byte", () => {
    const base = load("templates/community.json");
    const skin = Skin.parse({ ...skinFromMessenger(crew()), name: "Night Crew", radius: "square" });
    const out = applySkin(base, skin, { id: "port-night", version: "1.0.0" });
    expect(out.blocks).toEqual(base.blocks);
    expect(out.layout).toEqual(base.layout);
    expect(out.releases).toEqual(base.releases);
    expect(out.brand.name).toBe("Night Crew");
    expect(out.theme.radius).toBe("square");
    expect(out.theme.id).toBe("port-night");
    expect(validateMessenger(out).ok).toBe(true);
  });
});

describe("a signed package", () => {
  it("verifies, with the publisher trusted", async () => {
    const p = await pack();
    const r = await verifySkinPack(p, { trustedKeys: [key.publicKey] });
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.signedBy).toBe(key.publicKey);
  });

  it("without a trusted list, a valid signature is only a warning about the publisher", async () => {
    const r = await verifySkinPack(await pack());
    expect(r.ok).toBe(true);
    expect(codes(r.issues, "warning")).toEqual(["UNKNOWN_PUBLISHER"]);
  });

  it("is deterministic: the same skin always hashes the same", async () => {
    const a = await pack();
    const b = await pack();
    expect(a.manifest.skinSha256).toBe(b.manifest.skinSha256);
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });
});

// Every guard is proven by sabotage: break the package, expect the specific code.
describe("guards (sabotage)", () => {
  it("HASH_MISMATCH: a token changed after signing", async () => {
    const p = await pack();
    (p.skin as any).tokens.dark.accent = "#ff0000";
    expect(codes((await verifySkinPack(p, { trustedKeys: [key.publicKey] })).issues, "error")).toContain("HASH_MISMATCH");
  });

  it("SIGNATURE_INVALID: the manifest was edited (version bumped) after signing", async () => {
    const p = await pack();
    p.manifest.version = "9.9.9";
    expect(codes((await verifySkinPack(p, { trustedKeys: [key.publicKey] })).issues, "error")).toContain("SIGNATURE_INVALID");
  });

  it("SIGNATURE_INVALID: a skin re-signed by the wrong key but keeping the original public key", async () => {
    const p = await pack();
    const forged = await pack((s) => (s.name = "Forged"));
    p.manifest.signature.value = forged.manifest.signature.value;
    expect(codes((await verifySkinPack(p)).issues, "error")).toContain("SIGNATURE_INVALID");
  });

  it("UNTRUSTED_KEY: valid signature from a publisher that is not on the list", async () => {
    const p = await pack();
    const r = await verifySkinPack(p, { trustedKeys: [other.publicKey] });
    expect(r.ok).toBe(false);
    expect(codes(r.issues, "error")).toEqual(["UNTRUSTED_KEY"]);
  });

  it("CONTRAST: unreadable text is refused even when the signature is fine", async () => {
    const p = await pack((s) => (s.tokens.dark.textMuted = "#222222"));
    const r = await verifySkinPack(p, { trustedKeys: [key.publicKey] });
    expect(r.ok).toBe(false);
    expect(codes(r.issues, "error")).toContain("CONTRAST");
  });

  it("CHANNEL_CONTRAST: a channel colour that disappears into the background", async () => {
    const p = await pack((s) => (s.channels = { dark: { mDM: "#101010", mIRC: "#ff6b6b", mAYL: "#f5a524", mURL: "#4dc3ff" } }));
    const r = await verifySkinPack(p, { trustedKeys: [key.publicKey] });
    expect(codes(r.issues, "error")).toEqual(["CHANNEL_CONTRAST"]);
    expect(r.issues[0]!.path).toBe("/skin/channels/dark/mDM");
  });

  it("SHAPE: a skin cannot carry a stylesheet, a block or a route", async () => {
    for (const extra of [{ css: "x.css" }, { blocks: [] }, { layout: { tabs: ["mirc"] } }]) {
      const r = validateSkin({ ...skinFromMessenger(crew()), ...extra });
      expect(r.ok).toBe(false);
      expect(codes(r.issues)).toContain("SHAPE");
    }
  });

  it("TRADEMARK: the mosADD name is for official skins only", async () => {
    const p = await pack((s) => (s.name = "mosADD Neon"));
    expect(codes((await verifySkinPack(p, { trustedKeys: [key.publicKey] })).issues, "error")).toContain("TRADEMARK");
    expect((await verifySkinPack(p, { trustedKeys: [key.publicKey], allowMosaddName: true })).ok).toBe(true);
    // allowMosaddName without a trusted signer does not open the door
    expect(codes((await verifySkinPack(p, { allowMosaddName: true })).issues, "error")).toContain("TRADEMARK");
  });

  it("HONESTY: a name that promises what no messenger can", () => {
    const r = validateSkin({ ...skinFromMessenger(crew()), name: "Unhackable" });
    expect(codes(r.issues, "error")).toContain("HONESTY");
  });

  it("FONT_LICENSE and ASSET_MISSING and ASSET_HASH", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const withFont = await pack(() => {}, [{ path: "fonts/x.woff2", mime: "font/woff2", bytes }]);
    expect(codes((await verifySkinPack(withFont, { trustedKeys: [key.publicKey] })).issues, "error")).toContain("FONT_LICENSE");

    const logo = await pack((s) => (s.logo = "logo.svg"));
    expect(codes((await verifySkinPack(logo, { trustedKeys: [key.publicKey] })).issues, "error")).toContain("ASSET_MISSING");

    const good = await pack((s) => (s.logo = "logo.png"), [{ path: "logo.png", mime: "image/png", bytes }]);
    expect((await verifySkinPack(good, { trustedKeys: [key.publicKey], assetBytes: { "logo.png": bytes } })).ok).toBe(true);
    const tampered = await verifySkinPack(good, { trustedKeys: [key.publicKey], assetBytes: { "logo.png": new Uint8Array([9, 9, 9, 9]) } });
    expect(codes(tampered.issues, "error")).toEqual(["ASSET_HASH"]);
  });

  it("a background image is allowed but its contrast is flagged as unmeasured", async () => {
    const bytes = new Uint8Array([7, 7, 7]);
    const p = await pack((s) => (s.backdrop = { kind: "image", asset: "bg.jpg", dim: 0.6 }), [{ path: "bg.jpg", mime: "image/jpeg", bytes }]);
    const r = await verifySkinPack(p, { trustedKeys: [key.publicKey] });
    expect(r.ok).toBe(true);
    expect(codes(r.issues, "warning")).toContain("IMAGE_CONTRAST_UNMEASURED");
  });

  it("SHAPE: a manifest with a missing signature is refused", async () => {
    const p: any = await pack();
    delete p.manifest.signature;
    expect(codes((await verifySkinPack(p)).issues)).toContain("SHAPE");
  });

  it("sha256 matches the reference value", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("messenger.json carries the new theme fields", () => {
  it("CHANNEL_CONTRAST also fires on a messenger description", () => {
    const d = load("templates/crew-ptt.json");
    d.theme.channels = { dark: { mDM: "#0c1424", mIRC: "#ff6b6b", mAYL: "#f5a524", mURL: "#4dc3ff" } };
    expect(codes(validateMessenger(d).issues, "error")).toContain("CHANNEL_CONTRAST");
  });

  it("an image backdrop is accepted and defaults dim", () => {
    const d = load("templates/crew-ptt.json");
    d.theme.backdrop = { kind: "image", asset: "assets/bg.jpg" };
    const r = validateMessenger(d);
    expect(r.ok).toBe(true);
    expect((r.messenger!.theme.backdrop as any).dim).toBe(0.5);
  });
});

describe("published JSON Schemas", () => {
  it("skin-1.json and skin-manifest-1.json match the Zod schemas (run `pnpm build && pnpm schema`)", () => {
    expect(skinJsonSchema()).toEqual(load("schema/skin-1.json"));
    expect(skinManifestJsonSchema()).toEqual(load("schema/skin-manifest-1.json"));
  });
});
