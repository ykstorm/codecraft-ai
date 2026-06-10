import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Friendly 200 page for unknown template slugs (e.g. /playground/test).
 * Replaces the old 500. Text "Template not found" is asserted by the gate.
 */
export function TemplateNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="cc-label">{`// 404`}</p>
        <div className="text-2xl text-cyan-200">Template not found</div>
        <p className="text-sm text-muted-foreground">
          &gt; that template slug does not exist
        </p>
        <div className="pt-4">
          <Link
            href="/playgrounds"
            className="inline-flex items-center gap-2 rounded border border-cyan-400/40 px-4 py-2 text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
          >
            Browse all templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
