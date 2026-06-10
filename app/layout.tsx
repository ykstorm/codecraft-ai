import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { ThemeProvider } from "@/components/providers/theme-providers";
import { Toaster } from "@/components/ui/sonner";
import { assertEnv } from "@/lib/env-validate";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codecraft — Backend Engineer · AI Infrastructure · DevOps",
  description:
    "Codecraft: WebContainer-powered playgrounds, live telemetry, and an in-browser coding environment by Lakshyaraj Singh Rao.",
};

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Deferred env check — runs at request time, not build time
  let envOk = false
  try {
    assertEnv()
    envOk = true
  } catch {
    // env missing during build prerender — skip auth for this render
    // Client will hit a proper auth error at request time
  }

  const session = envOk ? await auth().catch(() => null) : null

  return (
    <SessionProvider session={session}>
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} font-mono antialiased`}
      >
         <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Toaster/>
    <div className="flex-1">
{children}
    </div>
            </div>
        
        </ThemeProvider>
      </body>
    </html>
    </SessionProvider>
  );
}
