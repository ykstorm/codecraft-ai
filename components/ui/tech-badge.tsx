/**
 * <TechBadge> — monospace skill badge. Cyan-on-transparent, no gradient.
 */
export function TechBadge({ label }: { label: string }) {
  return (
    <span className="rounded border border-cyan-400/30 bg-cyan-400/5 px-2 py-1 font-mono text-xs text-cyan-300">
      {label}
    </span>
  );
}
