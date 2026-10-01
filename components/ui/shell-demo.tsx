"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { useMetrics } from "@/lib/metrics-store";
import { getWebContainer } from "@/lib/webcontainer";

/**
 * <ShellDemo> — a read-only WebContainer that runs `ls && node -v` on demand.
 * It boots only when the visitor clicks "run" (booting a WebContainer on page
 * load would spin up a VM nobody asked for), streams output into a faux
 * terminal, and records the boot time into the shared metrics store for the
 * // LIVE TELEMETRY section. Degrades to a static transcript if cross-origin
 * isolation / WebContainer is unavailable.
 */
export function ShellDemo() {
  const [lines, setLines] = useState<string[]>(["$ ls && node -v"]);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const setBoot = useMetrics((s) => s.setWebcontainerBootMs);
  const startedRef = useRef(false);

  const append = (s: string) =>
    setLines((prev) => [...prev, ...s.split("\n").filter(Boolean)]);

  const run = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);
    setRunning(true);

    try {
      if (typeof window === "undefined" || !window.crossOriginIsolated) {
        append("[info] cross-origin isolation off — static transcript");
        append("data  node_modules  package.json  README.md");
        append("v20.x");
        return;
      }
      const t0 = performance.now();
      const wc = await getWebContainer();
      const bootMs = Math.round(performance.now() - t0);
      setBoot(bootMs);
      await wc.mount({
        "package.json": {
          file: { contents: '{"name":"codecraft-shell","type":"module"}' },
        },
        "index.js": {
          file: { contents: 'console.log("codecraft shell");\n' },
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
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="cc-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-cyan-400/40" />
          <span className="font-mono text-xs text-muted-foreground">
            read-only · webcontainer
          </span>
        </div>
        {!started && (
          <button
            onClick={run}
            className="inline-flex items-center gap-1.5 rounded border border-cyan-400/40 px-2.5 py-1 font-mono text-xs text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
          >
            <Play className="h-3 w-3" /> run
          </button>
        )}
        {running && (
          <span className="font-mono text-xs text-muted-foreground">running…</span>
        )}
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
