import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { isAuthConfigured } from "@/lib/env-validate";

// The column every page outside the playground sits in, with the site links.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <nav aria-label="Site" className="site-nav">
        <Link href="/" className="site-name">
          Codecraft
        </Link>
        <Link href="/playgrounds">Playgrounds</Link>
        {/* Only when sign-in can work. On static pages the check runs when the
            page is built; Vercel builds with the variables it runs with. */}
        {isAuthConfigured() && <Link href="/dashboard">Dashboard</Link>}
        <ThemeToggle />
      </nav>
      <main>{children}</main>
    </div>
  );
}
