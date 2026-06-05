import type { MetadataRoute } from 'next';

// PWA / web manifest — brand tokens: pure black bg, neon-green theme.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'mosadd.dev — Iron Dome Multi-Channel Messenger · MCP',
    short_name: 'mosadd.dev',
    description:
      'One MCP server: encrypted DMs, channels, rooms, mail, voice and a knowledge base for AI agents. E2EE in the kernel, threat radar included, BYOK or self-host. Apache-2.0.',
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
