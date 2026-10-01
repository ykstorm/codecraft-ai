"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

import { getWebContainer } from "@/lib/webcontainer";
import { loadSnapshot, saveSnapshot, clearSnapshot } from "@/lib/snapshot-cache";
import { viteReactTree } from "@/data/templates/vite-react";
import { withTimeout, TimeoutError } from "@/lib/timeout";

/** npm install is killed if it hasn't exited within this wall-clock budget. */
const INSTALL_TIMEOUT_MS = 180_000;
/** Don't persist snapshots larger than this — they blow the IndexedDB budget. */
const MAX_SNAPSHOT_BYTES = 200 * 1024 * 1024;
/** Don't persist a snapshot if it would push storage past this share of quota. */
const MAX_QUOTA_SHARE = 0.5;

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

/** FNV-1a hash of the template so a changed template invalidates old snapshots. */
function hashTree(tree: unknown): string {
  const s = JSON.stringify(tree);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const SNAPSHOT_KEY = `${SLUG}-${hashTree(viteReactTree)}`;

type Emit = (s: string) => void;

/** A boot failure whose message is already fit to show the user. */
class BootError extends Error {}

/** Turn an unexpected thrown error into a user-facing message. */
function classifyBootError(err: unknown): string {
  if (err instanceof BootError) return err.message;
  const raw = err instanceof Error ? err.message : String(err);
  const networky =
    /fetch|network|disconnect|ERR_INTERNET|staticblitz|webcontainer-api/i.test(
      raw
    );
  return networky
    ? "Can't reach the WebContainer runtime CDN (*.staticblitz.com). A browser content blocker, a VPN/proxy, or an unstable connection is the usual cause. Disable blockers for this site and retry."
    : raw;
}

/** Export the FS and cache it, but only when it fits the storage budget. */
async function cacheSnapshot(
  wc: WebContainer,
  key: string,
  emit: Emit
): Promise<void> {
  try {
    const exported = (await wc.export("/", { format: "binary" })) as Uint8Array;
    if (await snapshotFitsBudget(exported.byteLength, emit)) {
      await saveSnapshot(key, exported);
      emit("$ snapshot cached for fast reboot\r\n");
    }
  } catch (err) {
    // Surface, don't swallow: a quota/export failure is useful signal.
    const msg = err instanceof Error ? err.message : String(err);
    emit(`\r\n[warn] snapshot not cached: ${msg}\r\n`);
  }
}

/** Reject a snapshot that's over the hard cap or would overrun the quota. */
async function snapshotFitsBudget(bytes: number, emit: Emit): Promise<boolean> {
  if (bytes > MAX_SNAPSHOT_BYTES) {
    emit(
      `\r\n[info] snapshot ${(bytes / 1024 / 1024).toFixed(0)}MB exceeds ${
        MAX_SNAPSHOT_BYTES / 1024 / 1024
      }MB cap — not cached\r\n`
    );
    return false;
  }
  try {
    const est = await navigator.storage?.estimate?.();
    const quota = est?.quota ?? 0;
    const usage = est?.usage ?? 0;
    if (quota > 0 && (usage + bytes) / quota > MAX_QUOTA_SHARE) {
      emit(
        `\r\n[info] caching snapshot would exceed ${
          MAX_QUOTA_SHARE * 100
        }% of storage quota — not cached\r\n`
      );
      return false;
    }
  } catch {
    // estimate() unavailable — fall through and let the size cap be the guard.
  }
  return true;
}

/** Boot (or reuse) the shared WebContainer and return it plus the boot time. */
async function bootContainer(
  emit: Emit
): Promise<{ wc: WebContainer; bootMs: number }> {
  emit("$ boot webcontainer\r\n");
  const bootStart = performance.now();
  const wc = await getWebContainer();
  return { wc, bootMs: Math.round(performance.now() - bootStart) };
}

/**
 * Either restore the cached node_modules snapshot (fast path) or mount the
 * template and run `npm install` (cold path, then cache the result).
 */
async function restoreOrInstall(
  wc: WebContainer,
  opts: { forceCold: boolean; emit: Emit; setPhase: (p: BootPhase) => void }
): Promise<{ fromSnapshot: boolean; installMs: number | null }> {
  const { forceCold, emit, setPhase } = opts;
  const snapshot = forceCold ? null : await loadSnapshot(SNAPSHOT_KEY);

  if (snapshot) {
    setPhase("restoring-snapshot");
    emit("$ restore cached node_modules snapshot\r\n");
    await wc.mount(snapshot);
    return { fromSnapshot: true, installMs: null };
  }

  setPhase("mounting");
  emit(`$ mount ${SLUG}\r\n`);
  await wc.mount(viteReactTree);

  setPhase("installing");
  emit("$ npm install\r\n");
  const installStart = performance.now();
  const install = await wc.spawn("npm", ["install"]);
  install.output.pipeTo(new WritableStream({ write: (d) => emit(d) }));

  let code: number;
  try {
    // Bound the install: a wedged npm (unreachable CDN mid-stream) must not hang
    // the boot forever. On timeout, kill the process and fail.
    code = await withTimeout(install.exit, INSTALL_TIMEOUT_MS, "npm install", () =>
      install.kill()
    );
  } catch (err) {
    if (err instanceof TimeoutError) {
      emit("\r\nerror: npm install timed out — stopped\r\n");
      throw new BootError(
        `npm install did not finish within ${
          INSTALL_TIMEOUT_MS / 1000
        }s and was stopped. This usually means the *.staticblitz.com CDN stalled mid-install (content blocker / VPN / unstable network). Retry on a stable connection.`
      );
    }
    throw err;
  }
  if (code !== 0) {
    throw new BootError(
      `npm install exited ${code}. This usually means the *.staticblitz.com CDN was unreachable mid-install (content blocker / VPN / unstable network). Retry on a stable connection.`
    );
  }

  await cacheSnapshot(wc, SNAPSHOT_KEY, emit);
  return { fromSnapshot: false, installMs: Math.round(performance.now() - installStart) };
}

/** Start the Vite dev server and an interactive `jsh` shell. */
async function startDevAndShell(
  wc: WebContainer,
  emit: Emit
): Promise<{ dev: WebContainerProcess; shell: WebContainerProcess }> {
  emit("$ npm run dev\r\n");
  const dev = await wc.spawn("npm", ["run", "dev"]);
  dev.output.pipeTo(new WritableStream({ write: (d) => emit(d) }));
  const shell = await wc.spawn("jsh", [], { terminal: { cols: 80, rows: 24 } });
  return { dev, shell };
}

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

  // Long-lived child processes. The WebContainer singleton is kept for the
  // session, but the dev server and interactive shell it spawns must be killed
  // on unmount (and on reset) so they don't leak across navigations.
  const devProcRef = useRef<WebContainerProcess | null>(null);
  const shellProcRef = useRef<WebContainerProcess | null>(null);

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
    void clearSnapshot(SNAPSHOT_KEY);
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
          "Cross-origin isolation is off, so WebContainer can't boot. It needs the COOP/COEP headers and a current Chrome, Edge, or Firefox with cross-origin isolation."
        );
        return;
      }

      try {
        setPhase("booting");
        const bootStart = performance.now();
        const { wc, bootMs } = await bootContainer(emit);
        if (disposed) return;
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

        const { fromSnapshot, installMs } = await restoreOrInstall(wc, {
          forceCold,
          emit,
          setPhase,
        });
        if (disposed) return;
        setTimings((t) => ({ ...t, fromSnapshot, installMs: installMs ?? t.installMs }));

        setPhase("starting-dev");
        const { dev, shell: sh } = await startDevAndShell(wc, emit);
        if (disposed) {
          dev.kill();
          sh.kill();
          return;
        }
        devProcRef.current = dev;
        shellProcRef.current = sh;
        setShell(sh);
      } catch (e) {
        if (disposed) return;
        setPhase("error");
        setError(classifyBootError(e));
        const raw = e instanceof Error ? e.message : String(e);
        emit(`\r\nerror: ${raw}\r\n`);
      }
    }

    void boot();

    return () => {
      disposed = true;
      // Kill the dev server and interactive shell. The WebContainer singleton
      // itself is kept (see lib/webcontainer.ts) so navigations can reuse it.
      for (const ref of [devProcRef, shellProcRef]) {
        try {
          ref.current?.kill();
        } catch {
          /* already exited */
        }
        ref.current = null;
      }
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
