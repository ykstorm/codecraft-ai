import { create } from "zustand";

type MetricsState = {
  webcontainerBootMs: number | null;
  monacoLoadMs: number | null;
  setWebcontainerBootMs: (ms: number) => void;
  setMonacoLoadMs: (ms: number) => void;
};

/** Shared live-telemetry store. ShellDemo writes the WebContainer boot time,
 *  the telemetry section reads it; Monaco load time is written on first load. */
export const useMetrics = create<MetricsState>((set) => ({
  webcontainerBootMs: null,
  monacoLoadMs: null,
  setWebcontainerBootMs: (ms) => set({ webcontainerBootMs: ms }),
  setMonacoLoadMs: (ms) => set({ monacoLoadMs: ms }),
}));
