"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

import { getWebContainer } from "@/lib/webcontainer";
import { loadSnapshot, saveSnapshot, clearSnapshot } from "@/lib/snapshot-cache";
import { viteReactTree } from "@/data/templates/vite-react";

export type BootPhase =
  | "idle"
  | "booting"
  | "mounting"
  | "restoring-snapshot"
  | "installing"
  | "starting-dev"
  | "ready"
  | "error"
  | "unavailable";

export type BootTimings = {
  bootMs: number | null;
  installMs: number | null;
  devReadyMs: number | null;
  /** wall-clock from first effect to server-ready */
  totalMs: number | null;
  /** true when this boot mounted a cached snapshot instead of running install */
  fromSnapshot: boolean;
};

type UseViteWebContainer = {
  phase: BootPhase;
  error: string | null;
  serverUrl: string | null;
  timings: BootTimings;
  /** the live WebContainer once booted, else null */
  container: WebContainer | null;
  /** the interactive shell process (jsh) once spawned, else null */
  shell: WebContainerProcess | null;
  /** write a file into the WebContainer FS (HMR picks it up) */
  writeFile: (path: string, contents: string) => Promise<void>;
  /** read a file from the WebContainer FS */
  readFile: (path: string) => Promise<string>;
  /** wipe the cached snapshot + re-mount the pristine template, reinstall */
  reset: () => void;
  /** attach an output sink for terminal streaming (boot logs + shell) */
  onOutput: (sink: (chunk: string) => void) => void;
};

const SLUG = "vite-react-starter";

/**
 * Boots a WebContainer, mounts the Vite + React template, and either restores a
 * cached node_modules snapshot (fast path) or runs `npm install` (cold path),
 * then starts the Vite dev server and spawns an interactive `jsh` shell.
 *
 * All real timings are measured with performance.now() — nothing hardcoded.
 */
export function useViteWebContainer(): UseViteWebContainer {
  const [phase, setPhase] = useState<BootPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [shell, setShell] = useState<WebContainerProcess | null>(null);
  const [timings, setTimings] = useState<BootTimings>({
    bootMs: null,
    installMs: null,
    devReadyMs: null,
    totalMs: null,
    fromSnapshot: false,
  });
  const [attempt, setAttempt] = useState(0);
  const [forceCold, setForceCold] = useState(false);

  const outputSinkRef = useRef<((chunk: string) => void) | null>(null);
  const emit = useCallback((s: string) => outputSinkRef.current?.(s), []);

  const onOutput = useCallback((sink: (chunk: string) => void) => {
    outputSinkRef.current = sink;
  }, []);

  const writeFile = useCallback(
    async (path: string, contents: string) => {
      if (!container) return;
      await container.fs.writeFile(path, contents);
    },
    [container]
  );

  const readFile = useCallback(
    async (path: string) => {
      if (!container) throw new Error("container not ready");
      return container.fs.readFile(path, "utf-8");
    },
    [container]
  );

  const reset = useCallback(() => {
    void clearSnapshot(SLUG);
    setServerUrl(null);
    setShell(null);
    setError(null);
    setForceCold(true);
    setPhase("idle");
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let disposed = false;
    const t0 = performance.now();

    async function boot() {
      if (typeof window === "undefined" || !window.crossOriginIsolated) {
        setPhase("unavailable");
        setError(
          "Cross-origin isolation is off, so WebContainer can't boot. It needs COOP/COEP headers and a Chromium-based browser (Chrome / Edge / Brave / Firefox)."
        );
        return;
      }

      try {
        setPhase("booting");
        emit("$ boot webcontainer\r\n");
        const bootStart = performance.now();
        const wc = await getWebContainer();
        if (disposed) return;
        const bootMs = Math.round(performance.now() - bootStart);
        setContainer(wc);
        setTimings((t) => ({ ...t, bootMs }));

        // Wire the live preview URL before anything spawns a dev server.
        wc.on("server-ready", (port, url) => {
          if (disposed) return;
          setServerUrl(url);
          setPhase("ready");
          setTimings((t) => ({
            ...t,
            devReadyMs: Math.round(performance.now() - bootStart),
            totalMs: Math.round(performance.now() - t0),
          }));
          emit(`\r\n[ready] dev server on :${port}\r\n`);
        });

        const snapshot = forceCold ? null : await loadSnapshot(SLUG);

        if (snapshot) {
          setPhase("restoring-snapshot");
          emit("$ restore cached node_modules snapshot\r\n");
          await wc.mount(snapshot);
          if (disposed) return;
          setTimings((t) => ({ ...t, fromSnapshot: true }));
        } else {
          setPhase("mounting");
          emit("$ mount vite-react-starter\r\n");
          await wc.mount(viteReactTree);
          if (disposed) return;

          setPhase("installing");
          emit("$ npm install\r\n");
          const installStart = performance.now();
          const install = await wc.spawn("npm", ["install"]);
          install.output.pipeTo(
            new WritableStream({ write: (d) => emit(d) })
          );
          const code = await install.exit;
          if (disposed) return;
          if (code !== 0) {
            setPhase("error");
            setError(
              `npm install exited ${code}. This usually means the *.staticblitz.com CDN was unreachable mid-install (content blocker / VPN / unstable network). Retry on a stable connection.`
            );
            return;
          }
          setTimings((t) => ({
            ...t,
            installMs: Math.round(performance.now() - installStart),
          }));

          // Cache node_modules for sub-20s return-visit boots.
          try {
            const exported = await wc.export("/", { format: "binary" });
            await saveSnapshot(SLUG, exported as Uint8Array);
            emit("$ snapshot cached for fast reboot\r\n");
          } catch {
            /* snapshot is an optimization; ignore failures */
          }
        }

        if (disposed) return;
        setPhase("starting-dev");
        emit("$ npm run dev\r\n");
        const dev = await wc.spawn("npm", ["run", "dev"]);
        dev.output.pipeTo(new WritableStream({ write: (d) => emit(d) }));

        // Spawn an interactive shell so the user can type real commands.
        const sh = await wc.spawn("jsh", [], {
          terminal: { cols: 80, rows: 24 },
        });
        if (disposed) {
          sh.kill();
          return;
        }
        setShell(sh);
      } catch (e) {
        if (disposed) return;
        const raw = e instanceof Error ? e.message : String(e);
        const networky =
          /fetch|network|disconnect|ERR_INTERNET|staticblitz|webcontainer-api/i.test(
            raw
          );
        setPhase("error");
        setError(
          networky
            ? "Can't reach the WebContainer runtime CDN (*.staticblitz.com). A browser content blocker, a VPN/proxy, or an unstable connection is the usual cause. Disable blockers for this site and retry."
            : raw
        );
        emit(`\r\nerror: ${raw}\r\n`);
      }
    }

    void boot();

    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return {
    phase,
    error,
    serverUrl,
    timings,
    container,
    shell,
    writeFile,
    readFile,
    reset,
    onOutput,
  };
}
