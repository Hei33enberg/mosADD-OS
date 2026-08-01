# @mosadd/providers

Provider **contracts** — the transport-agnostic interfaces the `m*` modules
plug their backends into. What ships in this package today:

- `VoiceProvider` (`src/voice.ts`) — the half-duplex mTALK floor-control
  contract (who holds the walkie-talkie floor, join tickets, PTT
  press/release). The default network implementation (LiveKit-service media +
  an authoritative floor table) lives in [`@mosadd/mcp`](../mcp); a hardware
  host can inject a radio-backed implementation instead.
- `DmProvider` (`src/dm.ts`) — the DM delivery contract.

**Honest status: interfaces only.** There are no vendor adapter
implementations in this package yet — the mosADD backend today is the Supabase
project that [`@mosadd/mcp`](../mcp) talks to (hosted, or your own via BYOK
env). Additional pluggable backends are roadmap items, described only when
they ship — see [docs/roadmap.md](../../docs/roadmap.md).

## License

[Apache-2.0](../../LICENSE).
