# @mosadd/providers

Vendor adapters. Pluggable. Choose your transport per channel, or let mosadd auto-route.

Planned adapters:
- `supabase` — Phase 1 strangler-fig adapter pointing at the m0ssad-3 backend
- `livekit-fork` — voice/PTT/rooms (our `m0ssad-fabric` fork)
- `routr` — SIP control plane for PSTN
- `telnyx`, `twilio` — PSTN dumb pipes
- `nwaku` — p2p messaging backbone
- `dendrite` — Matrix federation
- `resend` — email outbound
- `elevenlabs` — voice (TTS, vocoder)

Status: pre-alpha. Interfaces land in v3.0.0-alpha.1.

## License

[Apache-2.0](../../LICENSE).
