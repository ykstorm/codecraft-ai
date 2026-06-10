import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TechBadge } from "@/components/ui/tech-badge";

export type Playground = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  demo?: string;
  featured?: boolean;
};

/**
 * <ProjectCard> — playground card. Mechanical hover (scale 1.02 + cyan border,
 * no shadow) via .cc-card. Flagship variant adds cyan ring + glow via .cc-flagship.
 * Always links to a real /playground/<slug> — never undefined.
 */
export function ProjectCard({ project }: { project: Playground }) {
  return (
    <Link
      href={`/playground/${project.slug}`}
      className={`group block p-6 no-underline ${
        project.featured ? "cc-card cc-flagship" : "cc-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-mono text-base font-semibold text-foreground transition-colors group-hover:text-cyan-400">
            {project.name}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {project.tagline}
          </p>
        </div>
        {project.featured ? (
          <span className="shrink-0 rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
            FLAGSHIP
          </span>
        ) : (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-400" />
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <TechBadge key={tag} label={tag} />
        ))}
      </div>
    </Link>
  );
}
