import { ImageResponse } from 'next/og';

// Favicon — brand mark: neon-green "m" on pure black, mono, with the
// signature green underline accent. Matches opengraph-image / global.css tokens.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          color: '#00ff7f',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          borderBottom: '3px solid #00ff7f',
        }}
      >
        m
      </div>
    ),
    { ...size },
  );
}
