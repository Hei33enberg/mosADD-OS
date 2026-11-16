import { z } from "zod";
import { copyViolations, usesMosaddName } from "./honesty";
import { Backdrop, ChannelColors, FONT_ALLOWLIST, ThemeTokens, type Messenger, type Theme } from "./schema";
import { themeIssues, type Issue } from "./validate";

/**
 * Skin package (RFC 0006 companion): a skin is a set of design tokens laid over the one mosADD design
 * system. It changes colours, type, corners, density, the backdrop, the name and the logo, and nothing
 * else. Blocks, layout and behaviour belong to the app and cannot be changed by a skin.
 *
 * A package is two files: `skin.json` (the Skin) and `manifest.json` (SkinManifest: who, which version,
 * the SHA-256 of skin.json and of every asset, and an Ed25519 signature over the manifest). The app
 * downloads both, verifies hash and signature, validates the skin like a messenger theme (WCAG AA),
 * and only then applies it. The signing key lives on the server of the publisher, never in a chat.
 *
 * Crypto is WebCrypto (browser and Node >= 20): SHA-256 and Ed25519.
 */

export const SKIN_FORMAT = "mosadd.skin" as const;
export const SKIN_MANIFEST_FORMAT = "mosadd.skin.manifest" as const;
export const SKIN_FORMAT_VERSION = 1 as const;
export const SKIN_SCHEMA_URL = "https://mosadd.dev/schema/skin/1.json";
export const SKIN_MANIFEST_SCHEMA_URL = "https://mosadd.dev/schema/skin-manifest/1.json";

const Mode = z.enum(["dark", "light"]);
const slug = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/, "lower-case letters, digits and dashes, 1-40 characters");
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, "semver MAJOR.MINOR.PATCH");
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, "a lower-case hex SHA-256");
const base64 = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/, "standard base64");
const assetPath = z.string().regex(/^[A-Za-z0-9_./-]+\.(png|jpe?g|svg|woff2)$/, "a relative .png, .jpg, .svg or .woff2 path inside the package");

/** The look. Nothing here can name a block, a route, a script or a stylesheet. */
export const Skin = z.strictObject({
  $schema: z.string().optional(),
  format: z.literal(SKIN_FORMAT),
  formatVersion: z.literal(SKIN_FORMAT_VERSION),
  /** The name shown in the app header. Not the mosADD name unless the package is signed by mosADD. */
  name: z.string().min(1).max(30),
  /** Logo asset inside the package (.svg or .png). */
  logo: assetPath.optional(),
  defaultMode: Mode,
  modes: z.array(Mode).min(1).max(2),
  tokens: z.strictObject({ dark: ThemeTokens.optional(), light: ThemeTokens.optional() }),
  channels: z.strictObject({ dark: ChannelColors.optional(), light: ChannelColors.optional() }).optional(),
  fonts: z.strictObject({ text: z.enum(FONT_ALLOWLIST), headings: z.enum(FONT_ALLOWLIST) }),
  radius: z.enum(["square", "soft", "round"]).default("soft"),
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
  backdrop: Backdrop.default({ kind: "lidar" }),
});
export type Skin = z.infer<typeof Skin>;

export const SkinAsset = z.strictObject({
  path: assetPath,
  mime: z.enum(["image/png", "image/jpeg", "image/svg+xml", "font/woff2"]),
  bytes: z.number().int().min(1).max(5_000_000),
  sha256,
  /** Required for fonts: the licence that lets the package carry the font. */
  license: z.string().min(1).max(60).optional(),
});
export type SkinAsset = z.infer<typeof SkinAsset>;

export const SkinManifest = z.strictObject({
  $schema: z.string().optional(),
  format: z.literal(SKIN_MANIFEST_FORMAT),
  formatVersion: z.literal(SKIN_FORMAT_VERSION),
  id: slug,
  name: z.string().min(1).max(30),
  version: semver,
  description: z.string().max(160).default(""),
  author: z.strictObject({ name: z.string().min(1).max(60), id: z.string().max(80).optional() }),
  /** Licence of the skin itself, free text such as "MIT", "CC-BY-4.0" or "proprietary". */
  license: z.string().min(1).max(60),
  /** Preview picture, one of the assets. */
  preview: assetPath.optional(),
  createdAt: z.string().datetime(),
  skinSha256: sha256,
  assets: z.array(SkinAsset).max(12).default([]),
  signature: z.strictObject({ alg: z.literal("ed25519"), publicKey: base64, value: base64 }),
});
export type SkinManifest = z.infer<typeof SkinManifest>;

export function skinJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(Skin, { io: "input", target: "draft-2020-12" }) as Record<string, unknown>;
  return { $id: SKIN_SCHEMA_URL, title: "mosADD skin", ...schema };
}
export function skinManifestJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(SkinManifest, { io: "input", target: "draft-2020-12" }) as Record<string, unknown>;
  return { $id: SKIN_MANIFEST_SCHEMA_URL, title: "mosADD skin manifest", ...schema };
}

// ---------------------------------------------------------------- bytes, hashes, keys

const enc = new TextEncoder();
const subtle = (): SubtleCrypto => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error("WebCrypto is not available in this runtime");
  return s;
};
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const view = (u: Uint8Array): ArrayBuffer => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

/** JSON with sorted keys and no whitespace: the same value always gives the same bytes. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  return toHex(await subtle().digest("SHA-256", typeof data === "string" ? enc.encode(data) : view(data)));
}

export interface SkinKeyPair {
  /** Raw 32-byte Ed25519 public key, base64. Goes in the manifest and in the publisher's trusted list. */
  publicKey: string;
  /** Stays on the publisher's server. Never serialised by this package. */
  privateKey: CryptoKey;
}

export async function generateSkinKeyPair(): Promise<SkinKeyPair> {
  const pair = (await subtle().generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  return { publicKey: toB64(await subtle().exportKey("raw", pair.publicKey)), privateKey: pair.privateKey };
}

// ---------------------------------------------------------------- build and sign

export interface SkinMeta {
  id: string;
  version: string;
  description?: string;
  author: { name: string; id?: string };
  license: string;
  preview?: string;
  createdAt?: string;
}
export interface AssetInput {
  path: string;
  mime: SkinAsset["mime"];
  bytes: Uint8Array;
  license?: string;
}

/** Hashes the skin and assets, fills the manifest and signs it. Returns the two files of the package. */
export async function signSkinPack(
  skin: Skin,
  meta: SkinMeta,
  assets: readonly AssetInput[],
  key: SkinKeyPair,
): Promise<{ skin: Skin; manifest: SkinManifest }> {
  const unsigned = {
    format: SKIN_MANIFEST_FORMAT,
    formatVersion: SKIN_FORMAT_VERSION,
    id: meta.id,
    name: skin.name,
    version: meta.version,
    description: meta.description ?? "",
    author: meta.author,
    license: meta.license,
    ...(meta.preview ? { preview: meta.preview } : {}),
    createdAt: meta.createdAt ?? new Date().toISOString(),
    skinSha256: await sha256Hex(canonicalJson(skin)),
    assets: await Promise.all(
      assets.map(async (a) => ({ path: a.path, mime: a.mime, bytes: a.bytes.byteLength, sha256: await sha256Hex(a.bytes), ...(a.license ? { license: a.license } : {}) })),
    ),
  };
  const sig = await subtle().sign({ name: "Ed25519" }, key.privateKey, enc.encode(canonicalJson(unsigned)));
  const manifest = { ...unsigned, signature: { alg: "ed25519" as const, publicKey: key.publicKey, value: toB64(sig) } } as SkinManifest;
  return { skin, manifest };
}

// ---------------------------------------------------------------- verify

export interface VerifyOptions {
  /** Base64 public keys the installer trusts. When given, any other signer is an error; when absent, a valid but unknown signer is a warning. */
  trustedKeys?: readonly string[];
  /** The asset files, keyed by path. When given, each is hashed against the manifest. */
  assetBytes?: Readonly<Record<string, Uint8Array>>;
  /** Lets a package signed by a trusted key use the mosADD name (the official skins). */
  allowMosaddName?: boolean;
}
export interface SkinVerification {
  ok: boolean;
  issues: Issue[];
  skin?: Skin;
  manifest?: SkinManifest;
  /** Base64 public key that signed the package, set only when the signature checked out. */
  signedBy?: string;
}

const zodIssues = (e: z.ZodError, base: string): Issue[] =>
  e.issues.map((i) => ({ level: "error", path: base + (i.path.length ? "/" + i.path.join("/") : ""), code: "SHAPE", message: i.message }));

/** Turns a skin into the theme shape the shared accessibility checks read. */
export function skinAsTheme(skin: Skin): Theme {
  return {
    id: "skin", version: "1.0.0", base: "mosadd-august", defaultMode: skin.defaultMode, modes: skin.modes, tokens: skin.tokens,
    fonts: skin.fonts, radius: skin.radius, density: skin.density, channels: skin.channels, backdrop: skin.backdrop,
  } as Theme;
}

/** Validates a skin alone (shape, WCAG contrast, honest copy), without hashes or a signature. */
export function validateSkin(input: unknown, opts: { allowMosaddName?: boolean } = {}): { ok: boolean; issues: Issue[]; skin?: Skin } {
  const parsed = Skin.safeParse(input);
  if (!parsed.success) return { ok: false, issues: zodIssues(parsed.error, "/skin") };
  const skin = parsed.data;
  const issues = themeIssues(skinAsTheme(skin), "/skin");
  for (const mode of skin.modes)
    if (!skin.tokens[mode]) issues.push({ level: "error", path: `/skin/tokens/${mode}`, code: "TOKENS_MISSING", message: `mode "${mode}" is listed but has no tokens` });
  if (skin.channels) for (const mode of ["dark", "light"] as const) if (skin.channels[mode] && !skin.modes.includes(mode))
    issues.push({ level: "warning", path: `/skin/channels/${mode}`, code: "CHANNELS_UNUSED_MODE", message: `channel colours for "${mode}" are set, but the skin does not list that mode` });
  if (!opts.allowMosaddName && usesMosaddName(skin.name))
    issues.push({ level: "error", path: "/skin/name", code: "TRADEMARK", message: "a skin needs its own name; the mosADD name is reserved for official skins" });
  for (const rule of copyViolations(skin.name))
    issues.push({ level: "error", path: "/skin/name", code: "HONESTY", message: rule.why });
  return { ok: !issues.some((i) => i.level === "error"), issues, skin };
}

export async function verifySkinPack(pack: { skin: unknown; manifest: unknown }, opts: VerifyOptions = {}): Promise<SkinVerification> {
  const issues: Issue[] = [];
  const err = (path: string, code: string, message: string, hint?: string) => issues.push({ level: "error", path, code, message, hint });
  const warn = (path: string, code: string, message: string, hint?: string) => issues.push({ level: "warning", path, code, message, hint });

  const m = SkinManifest.safeParse(pack.manifest);
  if (!m.success) return { ok: false, issues: zodIssues(m.error, "/manifest") };
  const manifest = m.data;
  const s = Skin.safeParse(pack.skin);
  if (!s.success) return { ok: false, issues: zodIssues(s.error, "/skin"), manifest };
  const skin = s.data;

  // 1. hash of the skin file, 2. signature over the manifest
  if ((await sha256Hex(canonicalJson(skin))) !== manifest.skinSha256)
    err("/manifest/skinSha256", "HASH_MISMATCH", "skin.json does not match the hash in the manifest", "The skin was changed after it was signed.");

  const { signature, ...unsigned } = manifest;
  let signedBy: string | undefined;
  try {
    const pub = await subtle().importKey("raw", view(fromB64(signature.publicKey)), { name: "Ed25519" }, false, ["verify"]);
    const good = await subtle().verify({ name: "Ed25519" }, pub, view(fromB64(signature.value)), enc.encode(canonicalJson(unsigned)));
    if (good) signedBy = signature.publicKey;
    else err("/manifest/signature", "SIGNATURE_INVALID", "the signature does not match the manifest");
  } catch {
    err("/manifest/signature", "SIGNATURE_INVALID", "the signature or public key cannot be read");
  }
  if (signedBy) {
    if (opts.trustedKeys) {
      if (!opts.trustedKeys.includes(signedBy)) err("/manifest/signature/publicKey", "UNTRUSTED_KEY", "the package is signed by a publisher this installation does not trust");
    } else warn("/manifest/signature/publicKey", "UNKNOWN_PUBLISHER", "the signature is valid, but no list of trusted publishers was given");
  }

  // 3. assets: declared, referenced, hashed, licensed
  const declared = new Set(manifest.assets.map((a) => a.path));
  const used = new Set<string>([skin.logo, manifest.preview, skin.backdrop.kind === "image" ? skin.backdrop.asset : undefined].filter((x): x is string => !!x));
  for (const p of used) if (!declared.has(p)) err("/manifest/assets", "ASSET_MISSING", `"${p}" is used by the skin but not listed in the manifest`);
  for (const a of manifest.assets) {
    if (!used.has(a.path) && a.mime !== "font/woff2") warn("/manifest/assets", "ASSET_UNUSED", `"${a.path}" is listed but nothing uses it`);
    if (a.mime === "font/woff2" && !a.license) err("/manifest/assets", "FONT_LICENSE", `font "${a.path}" needs a licence that allows shipping it`);
    const bytes = opts.assetBytes?.[a.path];
    if (opts.assetBytes && !bytes) err("/manifest/assets", "ASSET_MISSING", `the file for "${a.path}" is not in the package`);
    else if (bytes && ((await sha256Hex(bytes)) !== a.sha256 || bytes.byteLength !== a.bytes)) err("/manifest/assets", "ASSET_HASH", `"${a.path}" does not match its hash in the manifest`);
  }
  if (manifest.name !== skin.name) warn("/manifest/name", "NAME_DIFFERS", "the manifest name differs from the name inside skin.json");

  // 4. the skin itself, with the same accessibility and honesty checks as a messenger theme
  const official = !!opts.allowMosaddName && !!signedBy && !!opts.trustedKeys?.includes(signedBy);
  issues.push(...validateSkin(skin, { allowMosaddName: official }).issues);

  return { ok: !issues.some((i) => i.level === "error"), issues, skin, manifest, signedBy };
}

// ---------------------------------------------------------------- messenger.json <-> skin

/** The skin a messenger.json currently wears (theme + name). The logo is not carried: assets are not in messenger.json. */
export function skinFromMessenger(m: Messenger): Skin {
  return Skin.parse({
    format: SKIN_FORMAT,
    formatVersion: SKIN_FORMAT_VERSION,
    name: m.brand.name,
    defaultMode: m.theme.defaultMode,
    modes: m.theme.modes,
    tokens: m.theme.tokens,
    channels: m.theme.channels,
    fonts: m.theme.fonts,
    radius: m.theme.radius,
    density: m.theme.density,
    backdrop: m.theme.backdrop,
  });
}

/** Returns a copy of the messenger description wearing the skin. Blocks, layout, releases and the rest are untouched. */
export function applySkin<T extends Record<string, any>>(messenger: T, skin: Skin, skinId?: { id: string; version: string }): T {
  const doc: any = JSON.parse(JSON.stringify(messenger));
  doc.brand = { ...doc.brand, name: skin.name };
  doc.theme = {
    ...doc.theme,
    ...(skinId ? { id: skinId.id, version: skinId.version } : {}),
    defaultMode: skin.defaultMode,
    modes: skin.modes,
    tokens: skin.tokens,
    fonts: skin.fonts,
    radius: skin.radius,
    density: skin.density,
    backdrop: skin.backdrop,
  };
  if (skin.channels) doc.theme.channels = skin.channels;
  else delete doc.theme.channels;
  return doc;
}
