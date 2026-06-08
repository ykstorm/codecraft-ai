import Link from "next/link";
import playgroundsData from "@/data/playgrounds.json";

export default function PlaygroundsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-cyan-400 text-xs tracking-widest uppercase font-mono">PLAYGROUNDS</p>
          <h1 className="text-3xl font-bold font-mono">Available Templates</h1>
          <p className="text-muted-foreground text-sm font-mono">
            Select a template to launch a WebContainer-powered playground
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {playgroundsData.map((t) => (
            <Link
              key={t.slug}
              href={`/playground/${t.slug}`}
              className="group border border-border hover:border-cyan-400 rounded-lg p-6 transition-all duration-200 hover:scale-[1.02] no-underline"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono font-semibold text-base group-hover:text-cyan-400 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{t.tagline}</p>
                </div>
                {t.featured && (
                  <span className="text-[10px] font-mono bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded">
                    FLAGSHIP
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}