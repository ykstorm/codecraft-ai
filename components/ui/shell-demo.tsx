"use client";

import { useEffect, useRef, useState } from "react";
import { useMetrics } from "@/lib/metrics-store";

// Module-level guard: WebContainer.boot() may run only once per page.
let booted = false;

/**
 * <ShellDemo> — embedded read-only WebContainer running `ls && node -v`.
 * Streams output into a faux terminal and records boot time into the
 * shared metrics store for the // LIVE TELEMETRY section. Degrades to a
 * static transcript if cross-origin isolation / WebContainer is unavailable.
 */
export function ShellDemo() {
  const [lines, setLines] = useState<string[]>([
    "$ ls && node -v",
  ]);
  const setBoot = useMetrics((s) => s.setWebcontainerBootMs);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const append = (s: string) =>
      setLines((prev) => [...prev, ...s.split("\n").filter(Boolean)]);

    const run = async () => {
      if (booted) return;
      if (typeof window === "undefined" || !window.crossOriginIsolated) {
        append("[info] cross-origin isolation off — static transcript");
        append("data  node_modules  package.json  README.md");
        append("v20.x");
        return;
      }
      try {
        booted = true;
        const t0 = performance.now();
        const { WebContainer } = await import("@webcontainer/api");
        const wc = await WebContainer.boot();
        const bootMs = Math.round(performance.now() - t0);
        setBoot(bootMs);
        await wc.mount({
          "package.json": {
            file: { contents: '{"name":"codecraft-shell","type":"module"}' },
          },
          "README.md": { file: { contents: "# codecraft" } },
        });
        const proc = await wc.spawn("sh", ["-c", "ls && node -v"]);
        proc.output.pipeTo(
          new WritableStream({
            write(chunk) {
              append(String(chunk));
            },
          })
        );
        await proc.exit;
        append(`[boot ${bootMs}ms]`);
      } catch (err) {
        append(`[warn] ${err instanceof Error ? err.message : "shell unavailable"}`);
      }
    };

    void run();
  }, [setBoot]);

  return (
    <div className="cc-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-cyan-400/40" />
        <span className="font-mono text-xs text-muted-foreground">
          read-only · webcontainer
        </span>
      </div>
      <pre className="max-h-56 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("$") ? "text-cyan-400" : ""}>
            {l}
          </div>
        ))}
      </pre>
    </div>
  );
}
