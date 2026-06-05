import './global.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from './_components/SiteHeader';
import { SiteFooter } from './_components/SiteFooter';
import { PostHogProvider } from './_components/PostHogProvider';
import { SkinProvider, SKIN_BOOT_SCRIPT } from './_components/SkinProvider';
import { getAllSkinsCss } from '../lib/skins/registry';
import { SITE_URL } from '../lib/site';

const ALL_SKINS_CSS = getAllSkinsCss();

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'mURL — talk to the people who are on this website right now',
    template: '%s · mURL',
  },
  description:
    'mURL is a free browser extension that drops you into a live, anonymous chat for whatever website you are on. Shopping, reading an article, on a government site — talk to everyone else who is there right now. No account, no email, one click. Powered by mosADD.',
  applicationName: 'mURL',
  keywords: [
    'live chat on any website', 'anonymous chat', 'talk to people on this site',
    'browser extension chat', 'shopping chat', 'article comments', 'mURL', 'mosadd',
  ],
  openGraph: {
    title: 'mURL — talk to the people who are on this website right now',
    description: 'Free, anonymous live chat for every website. One click, no account. Powered by mosADD.',
    url: SITE_URL,
    siteName: 'mURL',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mURL — live, anonymous chat for every website',
    description: 'Talk to everyone who is on the same site as you, right now. Free. No account. Powered by mosADD.',
  },
};

export const viewport: Viewport = {
  themeColor: '#00ff7f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable} dark`} suppressHydrationWarning>
      <head>
        {/* All skin overrides stamped once — the active one is selected via
            the `data-murl-skin` attribute on <html>. */}
        <style id="m-skin-css" dangerouslySetInnerHTML={{ __html: ALL_SKINS_CSS }} />
        {/* Set the data-attribute BEFORE React hydrates to avoid a FOUC. */}
        <script dangerouslySetInnerHTML={{ __html: SKIN_BOOT_SCRIPT }} />
      </head>
      <body className="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
        <div aria-hidden className="grid-bg pointer-events-none fixed inset-0 z-0 opacity-60" />
        <Suspense fallback={null}>
          <PostHogProvider>
            <SkinProvider>
              <div className="relative z-10 flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </div>
            </SkinProvider>
          </PostHogProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
