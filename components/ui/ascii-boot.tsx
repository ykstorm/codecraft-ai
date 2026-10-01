"use client";

import { useEffect, useRef, useState } from "react";

import playgroundsData from "@/data/playgrounds.json";

const PLAYGROUND_COUNT = (playgroundsData as unknown[]).length;

const BOOT_LINES = [
  "$ codecraft --boot",
  "[ ok ] mounting /dev/webcontainer",
  "[ ok ] linking monaco-editor",
  "[ ok ] cross-origin isolation: enabled",
  `[ ok ] loading playgrounds … ${PLAYGROUND_COUNT} found`,
  "[ ready ] codecraft",
];

const SESSION_KEY = "cc_boot_played";

/**
 * One-time-per-session boot overlay. Gated on sessionStorage so it plays once,
 * then not again until a new tab/session.
 */
export function AsciiBoot() {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (startedRef.current) return;
    startedRef.current = true;
    if (sessionStorage.getItem(SESSION_KEY)) return; // already played this session

    let line = 0;
    const id = window.setInterval(() => {
      line += 1;
      setShown(line);
      if (line >= BOOT_LINES.length) {
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
  if (done || shown === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      role="status"
      aria-label="boot sequence"
    >
      <pre className="font-mono text-sm leading-relaxed text-[#22d3ee]">
        {BOOT_LINES.slice(0, shown).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <span className="inline-block h-4 w-2 animate-pulse bg-[#22d3ee] align-middle" />
      </pre>
    </div>
  );
}
