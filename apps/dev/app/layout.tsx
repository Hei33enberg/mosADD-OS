import './global.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from './_components/SiteHeader';
import { SiteFooter } from './_components/SiteFooter';
import { PostHogProvider } from './_components/PostHogProvider';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mosadd.dev'),
  title: {
    default: 'mosADD MCP — Iron Dome Multi-Channel Messenger for AI agents',
    template: '%s · mosadd.dev',
  },
  description:
    'One MCP server: encrypted DMs, channels, rooms, mail, voice and knowledge base for AI agents. E2EE in the kernel, threat radar included, BYOK or self-host. Apache-2.0.',
  applicationName: 'mosadd.dev',
  openGraph: {
    title: 'mosADD MCP — Iron Dome Multi-Channel Messenger · MCP',
    description: 'Threat-aware, zero-knowledge comms for AI agents. One MCP server, every channel — your keys or self-host. Apache-2.0. TRUST NO TRACE.',
    url: 'https://mosadd.dev',
    siteName: 'mosadd.dev',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mosADD MCP — Iron Dome Multi-Channel Messenger · MCP',
    description: 'Threat-aware, zero-knowledge comms for AI agents. One MCP server, every channel. Apache-2.0.',
  },
};

export const viewport: Viewport = {
  themeColor: '#00ff7f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable} dark`} suppressHydrationWarning>
      <body className="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
        {/* Fixed brand backdrop: faint engineering grid behind everything */}
        <div aria-hidden className="grid-bg pointer-events-none fixed inset-0 z-0 opacity-60" />
        <Suspense fallback={null}>
          <PostHogProvider>
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </PostHogProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
