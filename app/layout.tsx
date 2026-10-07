import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const PRODUCT_DESC =
  "An in-browser IDE. A real Vite + React dev server runs in the browser tab via WebContainers, with a Monaco editor, an xterm terminal, and a live preview.";

export const metadata: Metadata = {
  title: "Codecraft, in-browser IDE",
  description: PRODUCT_DESC,
  openGraph: {
    title: "Codecraft, in-browser IDE",
    description: PRODUCT_DESC,
    url: "https://codecraft-ai-tau.vercel.app",
    siteName: "Codecraft",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Codecraft, in-browser IDE",
    description: PRODUCT_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* With no stored choice the system setting picks the palette. */}
        <ThemeProvider attribute="data-theme" defaultTheme="system" disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
