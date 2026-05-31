# Phase 3 — Shells (apps + packaging)

> **Status:** design draft. Implementation starts after Phase 1 is npm-published and v3.0.0-alpha has feedback from ≥10 community users.

mosadd-os exposes the OS layer. **Shells** are the end-user faces of that OS — what someone who doesn't write code installs to use mosadd themselves. mosadd.com is one shell; the desktop/mobile apps are others.

## Two distinct shells

### Shell A — mosadd.com (Web, end-user)

Existing app at `m0ssad-3/apps/web`. Today: Vite + React + Capacitor wraps for mobile. After Phase 3:

- **Radar home** — every contact rendered as an avatar floating on the threat radar, glow color = mode with new activity
- **DECK footer (left)** — global event log + vocoder settings
- **CALL footer (right)** — retro phone icon (already shipped) → PSTN dialer
- **Contact panel** — opens inline on click, fullscreen on mobile, draggable window on desktop
- **Multi-thread per contact** (USP) — same data shape MCP uses, finally visible in UI
- **Long-press / right-click** — Talk/Call/DM/mAIL/Archive/Hide/Block/Delete

Tracking in [LINEAR-2164](https://linear.app/ip-ra/issue/LINEAR-2164).

### Shell B — Desktop & mobile native packaging

Wrap apps/web with the right runtime per platform:

| Platform | Stack | Notes |
|---|---|---|
| PWA | Service Worker + manifest | Already in apps/web (verify via `npm run test:pwa:offline`) |
| Android | Capacitor (already configured) | EAS / Gradle build, signed with our keystore |
| iOS | Capacitor | Xcode build via EAS, App Store Connect |
| Electron | New: wraps apps/web for desktop | **Global PTT keybind = killer feature** (e.g. Cmd-`) — talk-to-anyone-from-any-app |
| macOS native | Electron OR Swift wrapper | Swift wrapper better for Menu Bar / Notification Center; Electron faster to ship |

Tracking in [LINEAR-2165](https://linear.app/ip-ra/issue/LINEAR-2165).

## Sequencing within Phase 3

Within shells we sequence by **leverage / risk ratio**:

1. **apps/web rebuild on top of @mosadd/mcp** (`LINEAR-2164`) — most leverage, least risk. Same backend, new UI layer, same dataset. Catches issues with the MCP API in dogfood.

2. **PWA** — almost free with apps/web rebuild. Service Worker + manifest + offline caching. Ship as soon as web is good.

3. **Electron desktop** — for the **global PTT keybind**. This is the differentiator: install mosadd on macOS/Windows, press the keybind from any app (Slack, VSCode, browser), hold to talk into a mosadd PTT channel. No competitor has this. Ship after PWA.

4. **Android** — Capacitor + EAS. Google Play has fewer policy issues than iOS for the radar/threat features. Ship 4th.

5. **iOS** — Capacitor + Apple App Store. App Store review may flag the radar / anonymous identity / vocoder features — expect 2-3 review rejections. Ship 5th, allow buffer time.

6. **macOS** — Electron build is essentially free if Windows Electron works. Native Swift wrapper is a v3.1 thing.

## What's intentionally NOT in Phase 3

- **Watch app (Apple Watch / Wear OS)** — wait until Phase 4
- **Smart TV** — never
- **Linux package** (deb/rpm/AppImage) — Electron output already runs on Linux; we won't make a dedicated package until install volume justifies maintenance
- **Self-host Docker images for the apps/web shell** — enterprise-only ask, deferred

## Distribution

| Shell | Distribution channel |
|---|---|
| Web | mosadd.com (Vercel) |
| PWA | mosadd.com → install prompt |
| Android | Google Play (primary) + APK direct download (backup) |
| iOS | App Store |
| Electron | GitHub Releases (.dmg / .exe / .AppImage) + Homebrew Cask + Winget |
| macOS | Same as Electron for v3.0.x. Native bundle in v3.1+ via Mac App Store. |

## Build pipeline

All from a single source: `m0ssad-3/apps/web`.

```
apps/web (Vite + React)
    │
    ├── build → dist/                 → Vercel deploy → mosadd.com
    │                                 → PWA served from same origin
    │
    ├── + Capacitor wrap → ios/        → Xcode → App Store
    │                   → android/    → Gradle → Play Store
    │
    └── + Electron wrap → packages/electron-shell  → electron-builder
                          (new package in m0ssad-3 monorepo)
                                      → .dmg / .exe / .AppImage
                                      → GitHub Releases
```

Single Vite build feeds all five outputs. Platform-specific glue (Capacitor plugins, Electron main process, native menus) lives in tiny wrappers — no separate codebase per platform.

## Dependencies on Phase 2 hub

Shells are functional standalone if user has their own Supabase backend (BYOK). The hub adds:
- Single-sign-on across shells (OAuth via `hub.mosadd.com`)
- Cross-device sync of channels/threads/contacts
- Billing for hosted PSTN minutes / hosted PTT minutes
- 167-event radar evaluation server-side

A user can run apps/web today against their own Supabase without ever touching the hub. The hub is a convenience product.

## Timeline

Phase 3 work starts when:
1. Phase 1 hits 1000+ npm weekly downloads (or equivalent GitHub Releases pulls)
2. Phase 2 hub MVP at `hub.mosadd.com` is live for paying users
3. Identity recovery story is decided ([LINEAR-2170](https://linear.app/ip-ra/issue/LINEAR-2170)) — anonymous-identity recovery for mass-market vs paid

ETA: **6-8 months from today.** Apps/web rebuild can start in parallel sooner since it builds on existing Supabase backend, not the hosted hub.

## Linear

- [LINEAR-2163](https://linear.app/ip-ra/issue/LINEAR-2163) — LP `mosadd.com` rebuild (Phase 3 P0)
- [LINEAR-2164](https://linear.app/ip-ra/issue/LINEAR-2164) — apps/web rebuild on new SDK (Phase 3 P0)
- [LINEAR-2165](https://linear.app/ip-ra/issue/LINEAR-2165) — PWA + Android + iOS + Electron + macOS packaging (Phase 3 P1)
