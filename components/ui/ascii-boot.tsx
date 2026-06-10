"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  "$ codecraft --boot",
  "[ ok ] mounting /dev/webcontainer",
  "[ ok ] linking monaco-editor",
  "[ ok ] cross-origin isolation: enabled",
  "[ ok ] loading playgrounds … 4 found",
  "[ ready ] welcome, operator",
];

const SESSION_KEY = "cc_boot_played";

/**
 * <AsciiBoot> — one-time-per-session boot sequence overlay. Gated on
 * sessionStorage so it plays once, then never again until a new tab/session.
 */
export function AsciiBoot() {
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return; // already played this session
    setActive(true);

    let line = 0;
    const id = window.setInterval(() => {
      line += 1;
      setShown(line);
      if (line >= BOOT_LINES.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, "1");
          setActive(false);
        }, 650);
      }
    }, 260);

    return () => window.clearInterval(id);
  }, []);

  if (!active) return null;

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
