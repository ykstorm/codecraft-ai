"use client";

import { useEffect, useState } from "react";

import playgroundsData from "@/data/playgrounds.json";

const PLAYGROUND_COUNT = (playgroundsData as unknown[]).length;

// Built inside the effect so the isolation line reports the tab's real
// window.crossOriginIsolated value.
function bootLines(isolated: boolean): string[] {
  return [
    "$ codecraft --boot",
    "[ ok ] mounting /dev/webcontainer",
    "[ ok ] linking monaco-editor",
    isolated
      ? "[ ok ] cross-origin isolation: enabled"
      : "[ warn ] cross-origin isolation: disabled",
    `[ ok ] loading playgrounds … ${PLAYGROUND_COUNT} found`,
    "[ ready ] codecraft",
  ];
}

const SESSION_KEY = "cc_boot_played";

/**
 * One-time-per-session boot overlay. Gated on sessionStorage so it plays once,
 * then not again until a new tab/session.
 */
export function AsciiBoot() {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  // StrictMode (dev) runs effect → cleanup → effect. The cleanup clears the
  // first run's interval, so no "already started" guard is needed, and one
  // would stop the second run from playing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return; // already played this session

    const all = bootLines(window.crossOriginIsolated);
    let line = 0;
    const id = window.setInterval(() => {
      line += 1;
      setLines(all.slice(0, line));
      if (line >= all.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, "1");
          setDone(true);
        }, 650);
      }
    }, 260);

    return () => window.clearInterval(id);
  }, []);

  // Nothing before the first tick, and nothing once the sequence has finished.
  if (done || lines.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      role="status"
      aria-label="boot sequence"
    >
      <pre className="font-mono text-sm leading-relaxed text-[#22d3ee]">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <span className="inline-block h-4 w-2 animate-pulse bg-[#22d3ee] align-middle" />
      </pre>
    </div>
  );
}
