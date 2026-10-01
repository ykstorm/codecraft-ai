import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/providers/theme-providers";
import { Toaster } from "@/components/ui/sonner";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const PRODUCT_DESC =
  "An in-browser IDE. A real Vite + React dev server runs in the browser tab via WebContainers — Monaco editor, xterm terminal, and a live preview.";

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
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Toaster />
            <div className="flex-1">{children}</div>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
