import { useSyncExternalStore } from "react";

// Tiny shared store for the measured WebContainer boot time. The // SHELL demo
// writes it; the // LIVE TELEMETRY panel reads it. Module-level so the two
// sibling components share one value without a state-management dependency.
let bootMs: number | null = null;
const listeners = new Set<() => void>();

export function setWebcontainerBootMs(ms: number): void {
  bootMs = ms;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe to the measured boot time (null until the shell demo runs). */
export function useWebcontainerBootMs(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => bootMs,
    () => null
  );
}
