import { z } from "zod";

/** The format this package writes and validates. Bump only on a breaking change (RFC 0006). */
export const CURRENT_FORMAT_VERSION = 1 as const;
export const FORMAT_NAME = "mosadd.messenger" as const;
export const SCHEMA_URL = "https://mosadd.dev/schema/messenger/1.json";

/** Block ids: RFC 0001 module names in lower case, plus identity and offline. */
export const BLOCK_IDS = [
  "identity",
  "mtalk",
  "mirc",
  "mdm",
  "madd",
  "mkeeper",
  "mrag",
  "mayl",
  "murl",
  "offline",
] as const;
export type BlockId = (typeof BLOCK_IDS)[number];

/** Fonts the build may bundle (open licences). Fonts are never loaded from a remote host. */
export const FONT_ALLOWLIST = [
  "Inter",
  "IBM Plex Sans",
  "IBM Plex Mono",
  "Space Grotesk",
  "JetBrains Mono",
  "Atkinson Hyperlegible",
  "Nunito",
  "Noto Sans",
] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/, "lower-case letters, digits and dashes, 1-40 characters");
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, "semver MAJOR.MINOR.PATCH");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "a #rrggbb colour");
const url = z.string().url().startsWith("https://", "an https:// address");
const assetPath = z.string().regex(/^[A-Za-z0-9_./-]+\.png$/, "a relative .png path inside the project");
const lang = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, "a language tag such as pl or pt-BR");
const channelName = z.string().regex(/^#[a-z0-9][a-z0-9_-]{0,31}$/, "#name: lower case, digits, - and _");

const blockBase = { enabled: z.boolean() };

const IdentityBlock = z.strictObject({
  id: z.literal("identity"),
  ...blockBase,
  settings: z
    .strictObject({
      login: z.array(z.enum(["email-code", "device-key"])).min(1).default(["email-code"]),
      namespace: slug,
      joining: z.enum(["invite-only", "link", "open"]).default("invite-only"),
    }),
});

const MtalkBlock = z.strictObject({
  id: z.literal("mtalk"),
  ...blockBase,
  settings: z
    .strictObject({
      button: z.enum(["large-bottom", "floating"]).default("large-bottom"),
      queue: z.boolean().default(true),
      recordings: z.boolean().default(true),
      transcripts: z.boolean().default(false),
      maxSeconds: z.number().int().min(5).max(300).default(60),
      inChannels: z.boolean().default(true),
    })
    .default({ button: "large-bottom", queue: true, recordings: true, transcripts: false, maxSeconds: 60, inChannels: true }),
});

const MircBlock = z.strictObject({
  id: z.literal("mirc"),
  ...blockBase,
  settings: z
    .strictObject({
      startChannels: z.array(channelName).max(20).default([]),
      whoCreatesChannels: z.enum(["admins", "everyone"]).default("admins"),
    })
    .default({ startChannels: [], whoCreatesChannels: "admins" }),
});

const MdmBlock = z.strictObject({
  id: z.literal("mdm"),
  ...blockBase,
  settings: z
    .strictObject({
      calls: z.boolean().default(true),
      files: z.boolean().default(true),
      disappearingHours: z.number().int().min(0).max(8760).default(0),
    })
    .default({ calls: true, files: true, disappearingHours: 0 }),
});

const HomeAgent = z.strictObject({
  name: z.string().min(1).max(30),
  role: z.string().min(1).max(200),
  model: z.enum(["mosadd/flash", "mosadd/pro", "own-key"]).default("mosadd/flash"),
  voice: z.string().max(40).optional(),
});

const MaddBlock = z.strictObject({
  id: z.literal("madd"),
  ...blockBase,
  settings: z
    .strictObject({
      homeAgents: z.array(HomeAgent).max(10).default([]),
      usersBringOwnAgents: z.boolean().default(false),
    })
    .default({ homeAgents: [], usersBringOwnAgents: false }),
});

const MkeeperBlock = z.strictObject({
  id: z.literal("mkeeper"),
  ...blockBase,
  settings: z
    .strictObject({
      jobs: z
        .array(
          z.strictObject({
            name: slug,
            cron: z.string().regex(/^(\S+\s+){4}\S+$/, "five cron fields"),
            does: z.string().min(1).max(200),
          }),
        )
        .max(20)
        .default([]),
    })
    .default({ jobs: [] }),
});

const MragBlock = z.strictObject({
  id: z.literal("mrag"),
  ...blockBase,
  settings: z
    .strictObject({
      scope: z.enum(["team-channels", "off"]).default("team-channels"),
      limitMbPerUser: z.number().int().min(1).max(2000).default(100),
    })
    .default({ scope: "team-channels", limitMbPerUser: 100 }),
});

const SimpleBlock = <T extends "mayl" | "murl">(id: T) =>
  z.strictObject({ id: z.literal(id), ...blockBase, settings: z.strictObject({}).default({}) });

const OfflineBlock = z.strictObject({
  id: z.literal("offline"),
  ...blockBase,
  settings: z
    .strictObject({
      storeAndForward: z.boolean().default(true),
      localNetwork: z.boolean().default(false),
      bluetooth: z.boolean().default(false),
      lora: z.boolean().default(false),
    })
    .default({ storeAndForward: true, localNetwork: false, bluetooth: false, lora: false }),
});

export const Block = z.discriminatedUnion("id", [
  IdentityBlock,
  MtalkBlock,
  MircBlock,
  MdmBlock,
  MaddBlock,
  MkeeperBlock,
  MragBlock,
  SimpleBlock("mayl"),
  SimpleBlock("murl"),
  OfflineBlock,
]);
export type Block = z.infer<typeof Block>;

export const TOKEN_NAMES = [
  "background",
  "surface",
  "border",
  "text",
  "textMuted",
  "accent",
  "onAccent",
  "warning",
  "error",
  "pttTransmit",
  "pttListen",
] as const;

export const ThemeTokens = z.strictObject(
  Object.fromEntries(TOKEN_NAMES.map((n) => [n, hex])) as Record<(typeof TOKEN_NAMES)[number], typeof hex>,
);
export type ThemeTokens = z.infer<typeof ThemeTokens>;

const Mode = z.enum(["dark", "light"]);

/** The four channel accents the app draws (mDM, mIRC, mAYL, mURL), one set per mode. */
export const ChannelColors = z.strictObject({ mDM: hex, mIRC: hex, mAYL: hex, mURL: hex });
export type ChannelColors = z.infer<typeof ChannelColors>;

/** What sits behind the screens: the lidar/radar field, a plain fill, or an image from the project. */
export const Backdrop = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("lidar") }),
  z.strictObject({ kind: z.literal("plain") }),
  z.strictObject({
    kind: z.literal("image"),
    asset: z.string().regex(/^[A-Za-z0-9_./-]+\.(png|jpe?g)$/, "a relative .png or .jpg path inside the project"),
    /** How much of the theme background is laid over the image, 0 to 0.9. */
    dim: z.number().min(0).max(0.9).default(0.5),
  }),
]);
export type Backdrop = z.infer<typeof Backdrop>;

export const Theme = z.strictObject({
  id: slug,
  version: semver,
  base: z.enum(["mosadd-august"]).default("mosadd-august"),
  defaultMode: Mode,
  modes: z.array(Mode).min(1).max(2),
  tokens: z.strictObject({ dark: ThemeTokens.optional(), light: ThemeTokens.optional() }),
  fonts: z.strictObject({ text: z.enum(FONT_ALLOWLIST), headings: z.enum(FONT_ALLOWLIST) }),
  radius: z.enum(["square", "soft", "round"]).default("soft"),
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
  channels: z.strictObject({ dark: ChannelColors.optional(), light: ChannelColors.optional() }).optional(),
  backdrop: Backdrop.default({ kind: "lidar" }),
  css: z.string().regex(/^[A-Za-z0-9_./-]+\.css$/).optional(),
});
export type Theme = z.infer<typeof Theme>;

export const Releases = z.strictObject({
  android: z.strictObject({
    enabled: z.boolean(),
    package: z
      .string()
      .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/, "reverse-DNS package name, e.g. app.portradio.crew"),
    shell: z.enum(["bundled", "remote"]).default("bundled"),
    signing: z.enum(["creator-key", "creator-local"]).default("creator-key"),
    autoSignSecurityPatches: z.boolean().default(false),
    channels: z.array(z.enum(["direct-apk", "mosadd-store", "store-pack"])).min(1).default(["direct-apk"]),
    push: z.enum(["unifiedpush", "fcm", "none"]).default("unifiedpush"),
  }),
  desktop: z.strictObject({
    enabled: z.boolean(),
    systems: z.array(z.enum(["windows", "linux", "macos"])).min(1),
    signing: z.enum(["mosadd", "creator-certificate"]).default("mosadd"),
  }),
  web: z.strictObject({
    enabled: z.boolean(),
    address: slug,
    customDomain: z
      .string()
      .regex(/^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/, "a domain name such as radio.example.org")
      .nullable()
      .default(null),
  }),
  channel: z.enum(["stable", "beta"]).default("beta"),
});

export const Messenger = z.strictObject({
  $schema: z.string().optional(),
  format: z.literal(FORMAT_NAME),
  formatVersion: z.literal(CURRENT_FORMAT_VERSION),
  id: slug,
  revision: z.number().int().min(1),
  appVersion: semver,
  template: z.string().regex(/^[a-z0-9-]+@\d+$/).optional(),
  brand: z.strictObject({
    name: z.string().min(1).max(30),
    shortName: z.string().min(1).max(12),
    description: z.string().min(1).max(160),
    icon: assetPath,
    splash: assetPath.optional(),
    languages: z.array(lang).min(1),
    defaultLanguage: lang,
    website: url.optional(),
    privacyPolicy: url,
    supportContact: z.string().max(120).optional(),
    poweredBy: z.enum(["splash", "about"]).default("about"),
  }),
  core: z.strictObject({
    line: z.literal("mosadd-core@1"),
    channel: z.enum(["stable", "beta"]).default("stable"),
  }),
  blocks: z.array(Block).min(1),
  layout: z.strictObject({
    tabs: z.array(z.enum(BLOCK_IDS)).min(1).max(5),
    home: z.enum(BLOCK_IDS),
  }),
  theme: Theme,
  releases: Releases,
  instance: z.strictObject({
    hosting: z.enum(["mosadd", "anywhere", "mixed"]).default("mosadd"),
    network: z.strictObject({ listedInMosaddDirectory: z.boolean().default(false) }),
    cloudServices: z.array(z.enum(["madd", "ptt-transcripts", "mrag", "mail", "push-relay"])).default([]),
  }),
  budget: z.strictObject({
    monthlyUsd: z.number().min(0).max(100000),
    overBudget: z.enum(["text-only", "pause-agents", "stop"]).default("text-only"),
  }),
  privacy: z.strictObject({
    telemetry: z.enum(["none", "anonymous-counts"]).default("none"),
    crashReports: z.enum(["off", "opt-in"]).default("opt-in"),
  }),
});
export type Messenger = z.infer<typeof Messenger>;
/** The input shape (defaults not yet applied). */
export type MessengerInput = z.input<typeof Messenger>;

/** JSON Schema 2020-12 of the input shape, as published at SCHEMA_URL. */
export function messengerJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(Messenger, { io: "input", target: "draft-2020-12" }) as Record<string, unknown>;
  return { $id: SCHEMA_URL, title: "mosADD messenger description", ...schema };
}
