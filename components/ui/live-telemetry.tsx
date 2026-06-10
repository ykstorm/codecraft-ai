"use client";

import { useEffect } from "react";
import { loader } from "@monaco-editor/react";
import { useMetrics } from "@/lib/metrics-store";

/**
 * <LiveTelemetry> — reads the WebContainer boot time (set by <ShellDemo>) and
 * measures Monaco editor load time on mount. Renders both as mono read-outs.
 */
export function LiveTelemetry() {
  const bootMs = useMetrics((s) => s.webcontainerBootMs);
  const monacoMs = useMetrics((s) => s.monacoLoadMs);
  const setMonaco = useMetrics((s) => s.setMonacoLoadMs);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    loader
      .init()
      .then(() => {
        if (!cancelled) setMonaco(Math.round(performance.now() - t0));
      })
      .catch(() => {
        /* offline / blocked — leave as pending */
      });
    return () => {
      cancelled = true;
    };
  }, [setMonaco]);

  const fmt = (v: number | null) => (v == null ? "··· ms" : `${v} ms`);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="cc-card p-5">
        <p className="font-mono text-xs text-muted-foreground">webcontainer.boot()</p>
        <p className="mt-2 font-mono text-2xl text-cyan-300">{fmt(bootMs)}</p>
      </div>
      <div className="cc-card p-5">
        <p className="font-mono text-xs text-muted-foreground">monaco.load()</p>
        <p className="mt-2 font-mono text-2xl text-cyan-300">{fmt(monacoMs)}</p>
      </div>
    </div>
  );
}
