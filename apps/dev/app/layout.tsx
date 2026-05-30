import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from './_components/SiteHeader';
import { SiteFooter } from './_components/SiteFooter';

export const metadata: Metadata = {
  metadataBase: new URL('https://mosadd.dev'),
  title: {
    default: 'mosadd.dev — A human OS. Add.',
    template: '%s · mosadd.dev',
  },
  description:
    'Developer portal for the mosadd OS. MCP server, channels, SDK, skills — open-source under Apache-2.0. Build communication on a human OS.',
  openGraph: {
    title: 'mosadd.dev',
    description: 'A human OS. Add. — operating system for human communications.',
    url: 'https://mosadd.dev',
    siteName: 'mosadd.dev',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'mosadd.dev',
    description: 'A human OS. Add.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
