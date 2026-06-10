import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import playgroundsData from "@/data/playgrounds.json";
import { AsciiBoot } from "@/components/ui/ascii-boot";
import { BinaryBackground } from "@/components/ui/binary-background";
import { ProjectCard, type Playground } from "@/components/ui/project-card";
import { TechBadge } from "@/components/ui/tech-badge";
import { ShellDemo } from "@/components/ui/shell-demo";
import { LiveTelemetry } from "@/components/ui/live-telemetry";
import { TerminalContact } from "@/components/ui/terminal-contact";
import { ResumeButton } from "@/components/ui/resume-button";

const playgrounds = playgroundsData as Playground[];

const ARSENAL = [
  "TypeScript",
  "Node.js",
  "Python",
  "Rust",
  "Go",
  "PostgreSQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Terraform",
  "Next.js",
  "WebContainers",
  "Prisma",
  "gRPC",
  "CI/CD",
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="cc-label">
      {"// "}
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <AsciiBoot />

      <div className="mx-auto max-w-5xl px-4">
        {/* ── // IDENTIFY ──────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24">
          <BinaryBackground />
          <div className="relative z-10">
            <SectionLabel>IDENTIFY</SectionLabel>
            <h1 className="mt-4 font-mono text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              Lakshyaraj Singh Rao
            </h1>
            <p className="mt-4 font-mono text-lg text-cyan-300">
              Backend Engineer · AI Infrastructure · DevOps
            </p>
            <p className="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
              I build in-browser developer environments — WebContainer-powered
              playgrounds, Monaco editors, and the infrastructure that keeps them
              fast. Everything here runs live in your browser.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/playgrounds"
                className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 font-mono text-sm text-cyan-300 transition-colors hover:border-cyan-400"
              >
                launch playgrounds
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <ResumeButton />
            </div>
          </div>
        </section>

        {/* ── // PLAYGROUNDS ───────────────────────────────────── */}
        <section className="border-t border-border py-20">
          <SectionLabel>PLAYGROUNDS</SectionLabel>
          <h2 className="mt-3 font-mono text-2xl font-bold text-foreground">
            Live environments
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {playgrounds.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>

        {/* ── // SHELL ─────────────────────────────────────────── */}
        <section className="border-t border-border py-20">
          <SectionLabel>SHELL</SectionLabel>
          <h2 className="mt-3 font-mono text-2xl font-bold text-foreground">
            Read-only WebContainer
          </h2>
          <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">
            A real WebContainer boots in your browser and runs{" "}
            <span className="text-cyan-300">ls &amp;&amp; node -v</span>.
          </p>
          <div className="mt-8 max-w-2xl">
            <ShellDemo />
          </div>
        </section>

        {/* ── // TECHNICAL ARSENAL ─────────────────────────────── */}
        <section className="border-t border-border py-20">
          <SectionLabel>TECHNICAL ARSENAL</SectionLabel>
          <h2 className="mt-3 font-mono text-2xl font-bold text-foreground">
            Stack
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {ARSENAL.map((s) => (
              <TechBadge key={s} label={s} />
            ))}
          </div>
        </section>

        {/* ── // LIVE TELEMETRY ────────────────────────────────── */}
        <section className="border-t border-border py-20">
          <SectionLabel>LIVE TELEMETRY</SectionLabel>
          <h2 className="mt-3 font-mono text-2xl font-bold text-foreground">
            Measured in your browser
          </h2>
          <div className="mt-8 max-w-2xl">
            <LiveTelemetry />
          </div>
        </section>

        {/* ── // ESTABLISH CONNECTION ──────────────────────────── */}
        <section className="border-t border-border py-20">
          <SectionLabel>ESTABLISH CONNECTION</SectionLabel>
          <h2 className="mt-3 font-mono text-2xl font-bold text-foreground">
            Open a channel
          </h2>
          <div className="mt-8 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            <TerminalContact />
            <div className="flex flex-col justify-center gap-4">
              <p className="font-mono text-sm text-muted-foreground">
                Prefer the static route? Grab the resume or jump straight into a
                playground.
              </p>
              <ResumeButton />
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-10 font-mono text-xs text-muted-foreground">
          <span className="text-cyan-400">{"//"}</span> codecraft — built live in
          the browser
        </footer>
      </div>
    </>
  );
}
