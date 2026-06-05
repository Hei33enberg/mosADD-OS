import { ImageResponse } from 'next/og';

// Apple touch / PWA icon — neon-green "m" wordmark on pure black with the
// engineering-grid backdrop + corner brackets, matching the OG card.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const GREEN = '#00ff7f';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: GREEN,
          fontSize: 120,
          fontWeight: 800,
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,255,127,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            display: 'flex',
          }}
        />
        <span style={{ position: 'relative' }}>m</span>
        <div style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTop: `4px solid ${GREEN}`, borderLeft: `4px solid ${GREEN}`, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottom: `4px solid ${GREEN}`, borderRight: `4px solid ${GREEN}`, display: 'flex' }} />
      </div>
    ),
    { ...size },
  );
}
