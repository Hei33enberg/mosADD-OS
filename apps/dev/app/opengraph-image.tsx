import { ImageResponse } from 'next/og';

export const alt = 'mosadd — A human OS. Add.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          color: '#ebebeb',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          position: 'relative',
        }}
      >
        {/* Top bar — small brand mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 22,
            color: '#5af082',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span>m·os·add</span>
          <span style={{ color: '#666', fontSize: 18 }}>/dev</span>
        </div>

        {/* Hero text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>A human OS.</span>
            <span style={{ color: '#5af082' }}>Add.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#a8a8a8',
              maxWidth: 900,
              lineHeight: 1.35,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Operating system for human communications. mDM · mTALK · mAIL · mCALL · mIRC · mIRL · mROOM
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 20,
            color: '#666',
          }}
        >
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ color: '#888' }}>Apache-2.0</span>
            <span>·</span>
            <span>MCP-native</span>
            <span>·</span>
            <span>Vendor-agnostic</span>
          </div>
          <div style={{ color: '#5af082', fontSize: 22 }}>mosadd.dev</div>
        </div>

        {/* Subtle radar accent (top-right) */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            border: '2px solid #2a3a2f',
            borderRadius: '50%',
            opacity: 0.6,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 160,
            height: 160,
            border: '1px solid #5af082',
            borderRadius: '50%',
            opacity: 0.3,
            display: 'flex',
          }}
        />
      </div>
    ),
    size,
  );
}
