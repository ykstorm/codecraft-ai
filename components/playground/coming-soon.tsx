import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Friendly 200 page for templates that aren't wired to a live WebContainer yet
 * (rust-wasm, python-repl, express-api). Never a 500.
 */
export function ComingSoon({
  name,
  tagline,
}: {
  name: string;
  tagline: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="cc-label">{`// ${name.toUpperCase()}`}</p>
        <div className="text-2xl text-cyan-200">$ status</div>
        <p className="text-sm text-muted-foreground">{tagline}</p>
        <p className="text-sm text-muted-foreground">
          &gt; this playground is coming soon
        </p>
        <div className="pt-4">
          <Link
            href="/playgrounds"
            className="inline-flex items-center gap-2 rounded border border-cyan-400/40 px-4 py-2 text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
          >
            <ArrowLeft className="h-4 w-4" /> browse all templates
          </Link>
        </div>
      </div>
    </div>
  );
}
