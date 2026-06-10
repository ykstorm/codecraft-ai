import { Download } from "lucide-react";

/**
 * <ResumeButton> — cyan-outline link to the resume. Mono, mechanical hover.
 */
export function ResumeButton({ href = "/resume.pdf" }: { href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-transparent px-4 py-2 font-mono text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
    >
      <Download className="h-4 w-4" />
      resume.pdf
    </a>
  );
}
