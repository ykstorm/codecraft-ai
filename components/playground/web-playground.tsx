"use client";

import "@xterm/xterm/css/xterm.css";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getWebContainer } from "@/lib/webcontainer";
import { nextjsStarterTree } from "@/data/templates/nextjs-starter";
import { useMetrics } from "@/lib/metrics-store";

/**
 * <WebPlayground> — boots a real WebContainer, mounts the nextjs-starter tree,
 * runs `npm install && npm run dev`, streams output into an xterm terminal and
 * shows the live dev server in an iframe once `server-ready` fires.
 *
 * WebContainers stream their Node runtime and every npm package from the
 * *.staticblitz.com CDN. When a content blocker, VPN, or flaky connection cuts
 * that off, the boot/install throws — we surface a readable reason plus a retry
 * instead of a silently dead terminal.
 */
export function WebPlayground({ name }: { name: string }) {
  const termHost = useRef<HTMLDivElement>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("booting WebContainer…");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const setBoot = useMetrics((s) => s.setWebcontainerBootMs);

  useEffect(() => {
    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let term: any;

    const run = async () => {
      const { Terminal } = await import("@xterm/xterm");
      term = new Terminal({
        convertEol: true,
        fontSize: 12,
        fontFamily: "ui-monospace, monospace",
        cursorBlink: true,
        theme: { background: "#050505", foreground: "#e5e7eb", cursor: "#22d3ee" },
      });
      if (termHost.current) term.open(termHost.current);
      const write = (s: string) => term.write(s);

      try {
        if (typeof window === "undefined" || !window.crossOriginIsolated) {
          setStatus("unavailable");
          setError(
            "Cross-origin isolation is off, so WebContainer can't boot. It needs COOP/COEP headers and a Chromium-based browser (Chrome/Edge/Brave)."
          );
          write("cross-origin isolation is off — WebContainer cannot boot.\r\n");
          return;
        }

        const t0 = performance.now();
        const wc = await getWebContainer();
        setBoot(Math.round(performance.now() - t0));

        setStatus("mounting files…");
        write("$ mount nextjs-starter\r\n");
        await wc.mount(nextjsStarterTree);

        setStatus("npm install…");
        write("$ npm install\r\n");
        const install = await wc.spawn("npm", ["install"]);
        install.output.pipeTo(new WritableStream({ write: (d) => write(d) }));
        const code = await install.exit;
        if (disposed) return;
        if (code !== 0) {
          setStatus("install failed");
          setError(
            `npm install exited ${code}. This usually means the *.staticblitz.com CDN was unreachable mid-install (blocker / VPN / unstable network). Retry on a stable connection.`
          );
          write(`\r\nnpm install exited ${code}\r\n`);
          return;
        }

        setStatus("starting dev server…");
        write("\r\n$ npm run dev\r\n");
        wc.on("server-ready", (port, url) => {
          if (disposed) return;
          setServerUrl(url);
          setStatus(`ready on :${port}`);
        });
        const dev = await wc.spawn("npm", ["run", "dev"]);
        dev.output.pipeTo(new WritableStream({ write: (d) => write(d) }));
      } catch (e) {
        if (disposed) return;
        const raw = e instanceof Error ? e.message : String(e);
        const networky = /fetch|network|disconnect|ERR_INTERNET|staticblitz|webcontainer-api/i.test(raw);
        setError(
          networky
            ? "Can't reach the WebContainer runtime CDN (*.staticblitz.com). A browser content blocker, a VPN/proxy, or an unstable connection is the usual cause. Disable blockers for this site and retry."
            : raw
        );
        setStatus("error");
        write(`\r\nerror: ${raw}\r\n`);
      }
    };

    void run();

    return () => {
      disposed = true;
      if (term) term.dispose();
    };
  }, [setBoot, attempt]);

  function retry() {
    setError(null);
    setServerUrl(null);
    setStatus("booting WebContainer…");
    setAttempt((a) => a + 1);
  }

  const failed = status === "error" || status === "unavailable" || status === "install failed";

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/playgrounds"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" /> playgrounds
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs">
          {!serverUrl && !failed && (
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
          )}
          <span className="text-cyan-300">{name}</span>
          <span className="text-muted-foreground">· {status}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="font-mono text-xs leading-relaxed text-amber-200/90">{error}</p>
          </div>
          <button
            onClick={retry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-amber-500/40 px-2.5 py-1 font-mono text-xs text-amber-200 transition-colors hover:bg-amber-500/10"
          >
            <RefreshCw className="h-3 w-3" /> retry
          </button>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="cc-card overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
            terminal · webcontainer
          </div>
          <div ref={termHost} className="h-[60vh] w-full bg-[#050505] p-2" />
        </div>

        <div className="cc-card overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
            preview {serverUrl ? "· live" : "· waiting"}
          </div>
          {serverUrl ? (
            <iframe
              title="preview"
              src={serverUrl}
              className="h-[60vh] w-full bg-white"
            />
          ) : (
            <div className="flex h-[60vh] items-center justify-center font-mono text-xs text-muted-foreground">
              {failed ? "dev server not running" : "waiting for dev server…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
