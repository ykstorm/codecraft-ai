"use client";

import { useWebcontainerBootMs } from "@/lib/metrics-store";

/**
 * <LiveTelemetry> — shows the real WebContainer boot time measured elsewhere on
 * the page. It does not boot a WebContainer itself (booting a VM just to render a
 * number on page load is wasteful); it reads the value the // SHELL demo records
 * in the shared metrics store when the visitor runs it. Until then it shows the
 * "···" placeholder. No number is ever hardcoded.
 */
export function LiveTelemetry() {
  const bootMs = useWebcontainerBootMs();

  const fmt = (v: number | null) => (v == null ? "··· ms" : `${v} ms`);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="cc-card p-5">
        <p className="font-mono text-xs text-muted-foreground">webcontainer.boot()</p>
        <p className="mt-2 font-mono text-2xl text-cyan-300">{fmt(bootMs)}</p>
        {bootMs == null && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            run the // SHELL demo above to measure
          </p>
        )}
      </div>
    </div>
  );
}
