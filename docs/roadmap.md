# Roadmap

Full plan + tickets: [Linear M5 milestone](https://linear.app/ip-ra/project/mosadd-deaa4bef6de8) · Epic [LINEAR-2138](https://linear.app/ip-ra/issue/LINEAR-2138).

## Phase 1 — Public OS core (6-7 months)

- [x] Monorepo scaffold + Apache-2.0 + governance
- [ ] `@mosadd/crypto` ported from m0ssad-3 ([LINEAR-2142](https://linear.app/ip-ra/issue/LINEAR-2142))
- [ ] `@mosadd/protocol` ported ([LINEAR-2142](https://linear.app/ip-ra/issue/LINEAR-2142))
- [ ] `@mosadd/mcp` stub with `mDM_send` working ([LINEAR-2143](https://linear.app/ip-ra/issue/LINEAR-2143))
- [ ] Provider abstraction ([LINEAR-2144](https://linear.app/ip-ra/issue/LINEAR-2144))
- [ ] Control plane / data plane separation ([LINEAR-2145](https://linear.app/ip-ra/issue/LINEAR-2145))
- [ ] Fork LiveKit → `mosadd-fabric` ([LINEAR-2169](https://linear.app/ip-ra/issue/LINEAR-2169))
- [ ] Anonymous identity recovery ([LINEAR-2170](https://linear.app/ip-ra/issue/LINEAR-2170))
- [ ] Anti-abuse PoW + rate limits ([LINEAR-2171](https://linear.app/ip-ra/issue/LINEAR-2171))
- [ ] mCALL stack: Routr + multi-provider ([LINEAR-2172](https://linear.app/ip-ra/issue/LINEAR-2172))
- [ ] Messaging backbone: nwaku + Dendrite ([LINEAR-2173](https://linear.app/ip-ra/issue/LINEAR-2173))
- [ ] Native channels: mDM, mAIL, mIRC, **mTALK (kill feature)**, mROOM, mCALL, mIRL ([LINEAR-2146](https://linear.app/ip-ra/issue/LINEAR-2146)-[2152](https://linear.app/ip-ra/issue/LINEAR-2152))
- [ ] Bridge Provider Pack: mMATRIX, mDISCORD, mTELEGRAM ([LINEAR-2168](https://linear.app/ip-ra/issue/LINEAR-2168))
- [ ] SDK adapters: Vercel AI SDK + LangChain + OpenAI Agents + Anthropic Agents ([LINEAR-2153](https://linear.app/ip-ra/issue/LINEAR-2153))
- [ ] Claude Code plugin + Anthropic Skills bundle ([LINEAR-2154](https://linear.app/ip-ra/issue/LINEAR-2154))
- [ ] 4 example apps ([LINEAR-2155](https://linear.app/ip-ra/issue/LINEAR-2155))
- [ ] Community: CONTRIBUTING, GOVERNANCE, RFC, Discord ([LINEAR-2156](https://linear.app/ip-ra/issue/LINEAR-2156))
- [ ] Submit to 5 MCP registries ([LINEAR-2157](https://linear.app/ip-ra/issue/LINEAR-2157))

## Phase 2 — Commercial Hub (3-4 months)

Operated by mosadd commercial entity at [hub.mosadd.com](https://hub.mosadd.com).

- [ ] Hosted MCP `mcp.mosadd.com` with OAuth ([LINEAR-2158](https://linear.app/ip-ra/issue/LINEAR-2158))
- [ ] BYOK key brokerage ([LINEAR-2159](https://linear.app/ip-ra/issue/LINEAR-2159))
- [ ] **167-event threat radar middleware (THE MOAT)** ([LINEAR-2160](https://linear.app/ip-ra/issue/LINEAR-2160))
- [ ] Stripe pricing tiers ([LINEAR-2161](https://linear.app/ip-ra/issue/LINEAR-2161))
- [ ] SaaS dashboard ([LINEAR-2162](https://linear.app/ip-ra/issue/LINEAR-2162))

## Phase 3 — Shells (3-4 months)

- [ ] LP `mosadd.com` rebuild with OS framing ([LINEAR-2163](https://linear.app/ip-ra/issue/LINEAR-2163))
- [ ] Consumer app rebuild on new SDK ([LINEAR-2164](https://linear.app/ip-ra/issue/LINEAR-2164))
- [ ] PWA + Android + iOS + Electron + macOS — **global PTT keybind in Electron = killer feature** ([LINEAR-2165](https://linear.app/ip-ra/issue/LINEAR-2165))

## Phase 4 — Migration & cleanup

- [ ] Strangler fig from m0ssad-3 ([LINEAR-2166](https://linear.app/ip-ra/issue/LINEAR-2166))
- [ ] Tech debt cleanup ([LINEAR-2167](https://linear.app/ip-ra/issue/LINEAR-2167))

## Not in 3.0.0

- Real "10-min number" PSTN rotation (regulatory 6-10 months)
- Full RVC vocoder (pitch-shift on MVP)
- WhatsApp + iMessage bridges (legal review in Phase 2)
- mIRL stream platform federations (Phase 2)
- "Market leader" position — that's v4.0.0+
