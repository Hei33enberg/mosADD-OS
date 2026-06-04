import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mIRL',
  description: 'Live-stream after-party — turn a YouTube/TikTok/Twitch stream into a persistent mosadd room the creator owns and can monetize.',
};

export default function MirlPage() {
  return (
    <Prose>
      <H1>mIRL</H1>
      <Lead>Live-stream after-party — a stream&apos;s audience keeps talking in a room the creator owns and can monetize.</Lead>

      <P>
        <code className="font-mono text-radar-green">mIRL</code> spins up a room attached to a running live stream
        (YouTube, TikTok, Twitch, Kick). Viewers join with a no-account guest link mid-stream; when the broadcast ends,
        the conversation continues in the room for hours or days. The creator owns the audience and can charge for it.
      </P>

      <Callout type="warn">
        <strong>Status: design.</strong> mIRL rides the same Cloudflare Worker + Durable Object backbone as mIRC and
        mROOM (already proven at scale), so the transport is solved — the platform auto-detection and creator
        monetization layer are the build. Specced, not yet shipped.
      </Callout>

      <H2>Tools (planned surface)</H2>

      <H3>mIRL_create_after_party</H3>
      <Pre lang="ts">{`mIRL_create_after_party({
  stream_url: string,             // YT / TikTok / Twitch / Kick
  duration_after_seconds: number, // how long the room lives past stream end
  features?: { txt, ptt, voice, super_chat },
})
→ { room_id, join_link, qr_code_data }`}</Pre>

      <H3>mIRL_list_attendees</H3>
      <Pre lang="ts">{`mIRL_list_attendees({ room_id })
→ { attendees: [{ nick, joined_at, stream_position_at_join }] }`}</Pre>

      <H2>Why it works</H2>
      <Ul>
        <li>Auto-detects the platform from the stream URL; bridges chat history in at room launch.</li>
        <li>Guest join (no account) like mROOM — zero friction for viewers mid-stream.</li>
        <li>Monetization (Phase 2): paid after-party tier + super-chat tips via Stripe Connect, creator keeps the majority.</li>
      </Ul>

      <P>
        <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
