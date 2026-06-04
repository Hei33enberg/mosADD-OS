import { ImageResponse } from 'next/og';

export const alt = 'mosADD — Irondome Multi-Channel Messenger · MCP';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Brand: pure black (#000) + neon green (hsl 145 100% 50% ≈ #00ff6a), mono.
const GREEN = '#00ff6a';
const MONO = 'ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          color: '#f2f2f2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          fontFamily: MONO,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,255,106,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,106,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: 30, letterSpacing: '0.22em', fontWeight: 700 }}>
          <span>mos</span>
          <span style={{ color: GREEN }}>ADD</span>
          <span style={{ color: GREEN, fontSize: 16, marginLeft: 4 }}>™</span>
          <span style={{ color: '#666', fontSize: 22, marginLeft: 16, letterSpacing: '0.3em' }}>/DEV</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.0, letterSpacing: '0.02em', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 116 }}>IRONDOME</span>
            <span style={{ color: GREEN, fontSize: 50, letterSpacing: '0.04em' }}>MULTI-CHANNEL MESSENGER · MCP</span>
          </div>
          <div style={{ fontSize: 26, color: '#9a9a9a', maxWidth: 980, lineHeight: 1.35 }}>
            Threat-aware, zero-knowledge comms for AI agents. E2EE in the kernel · BYOK or self-host.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 20, color: '#777' }}>
          <div style={{ display: 'flex', gap: 22 }}>
            <span>Apache-2.0</span>
            <span>·</span>
            <span>55 MCP tools</span>
            <span>·</span>
            <span>BYOK</span>
          </div>
          <div style={{ color: GREEN, fontSize: 22 }}>mosadd.dev</div>
        </div>

        <div style={{ position: 'absolute', top: 28, left: 28, width: 26, height: 26, borderTop: `2px solid ${GREEN}`, borderLeft: `2px solid ${GREEN}`, opacity: 0.7, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 28, right: 28, width: 26, height: 26, borderBottom: `2px solid ${GREEN}`, borderRight: `2px solid ${GREEN}`, opacity: 0.7, display: 'flex' }} />
      </div>
    ),
    size,
  );
}
