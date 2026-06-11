"use client";

import { useEffect, useState } from "react";
import { getWebContainer } from "@/lib/webcontainer";

/**
 * <LiveTelemetry> — measures the real WebContainer boot time. Times from just
 * before getWebContainer() to when the shared boot promise resolves, then renders
 * the delta. Shows the "···" placeholder until the measurement lands. Monaco is
 * intentionally NOT timed here — we don't load a 2MB editor on the home page.
 */
export function LiveTelemetry() {
  const [bootMs, setBootMs] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.crossOriginIsolated) return;
    let cancelled = false;
    const t0 = performance.now();
    getWebContainer()
      .then(() => {
        if (!cancelled) setBootMs(Math.round(performance.now() - t0));
      })
      .catch(() => {
        /* boot failed — leave placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (v: number | null) => (v == null ? "··· ms" : `${v} ms`);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="cc-card p-5">
        <p className="font-mono text-xs text-muted-foreground">webcontainer.boot()</p>
        <p className="mt-2 font-mono text-2xl text-cyan-300">{fmt(bootMs)}</p>
      </div>
    </div>
  );
}
