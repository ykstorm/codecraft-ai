import Link from "next/link";
import { Metadata } from "next";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { isAuthConfigured } from "@/lib/env-validate";

export const metadata: Metadata = {
  title: "Codecraft, in-browser IDE",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-mono text-sm font-semibold text-cyan-400">
            ~/codecraft
          </Link>
          <nav className="flex items-center gap-5 font-mono text-xs text-muted-foreground">
            <Link href="/playgrounds" className="hover:text-cyan-400">
              playgrounds
            </Link>
            {/* Only when sign-in can work. This layout is static, so the
                check runs when the page is built; Vercel builds with the
                same variables it runs with. */}
            {isAuthConfigured() && (
              <Link href="/dashboard" className="hover:text-cyan-400">
                dashboard
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
