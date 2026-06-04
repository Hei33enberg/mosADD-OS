import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'mURL — talk to the people who are on this website right now';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000',
          padding: '72px',
          fontFamily: 'monospace',
          // faint green grid
          backgroundImage:
            'linear-gradient(rgba(0,255,127,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, color: '#f2f2f2' }}>
            m<span style={{ color: '#00ff7f' }}>URL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8c8c8c', fontSize: 20 }}>
            <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#00ff7f' }} />
            live · anonymous · free
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, color: '#f2f2f2', lineHeight: 1.05, maxWidth: 980 }}>
            Talk to the people <span style={{ color: '#00ff7f' }}>on this website</span> right now.
          </div>
          <div style={{ fontSize: 26, color: '#8c8c8c', maxWidth: 900 }}>
            A free browser extension. Every site becomes a live, anonymous room.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8c8c8c', fontSize: 22 }}>
          <span>murl.mosadd.com</span>
          <span>
            powered by <span style={{ color: '#f2f2f2', fontWeight: 700 }}>mos<span style={{ color: '#00ff7f' }}>ADD</span></span>
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
