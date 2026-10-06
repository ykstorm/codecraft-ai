import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TechBadge } from "@/components/ui/tech-badge";

export type Playground = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
};

export function ProjectCard({ project }: { project: Playground }) {
  return (
    <Link
      href={`/playground/${project.slug}`}
      className="group block cc-card p-6 no-underline"
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
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-400" />
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
