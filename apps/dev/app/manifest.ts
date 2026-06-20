import type { MetadataRoute } from 'next';

// PWA / web manifest — brand tokens: pure black bg, neon-green theme.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'mosadd.dev — the human-in-the-loop layer for AI agents · MCP',
    short_name: 'mosadd.dev',
    description:
      'One MCP server to pull a human into the loop with your agent: a private 1:1 E2EE DM (X3DH + Double Ratchet; operator cannot read content) and push-to-talk voice — plus a real inbox and a defensive threat engine. BYOK or self-host. Apache-2.0.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#00ff7f',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
