import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "mosadd hub — your API keys + billing",
  description:
    "Self-serve dashboard for mosadd.dev: sign in, issue an API key, paste the install snippet into Claude Code / Cursor / your agent. Free + Pro + Team tiers.",
  themeColor: "#000000",
};

// Every route in this app is auth-dependent and reads cookies. Force
// dynamic rendering so the build doesn't try to prerender pages that need
// runtime environment vars (NEXT_PUBLIC_SUPABASE_*) that are only set in Vercel.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "m0ssad-os",
    "operatingSystem": "All",
    "applicationCategory": "DeveloperApplication",
    "description": "Agent-first Operating System and SDK. m0ssad-os is an open-source meta-layer for orchestrating Model Context Protocol servers.",
    "url": "https://m0ssad.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en" className="dark">
      <body className={`${jetbrains.variable} font-mono bg-background text-foreground antialiased`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
