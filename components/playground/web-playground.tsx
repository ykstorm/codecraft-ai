"use client";

import "@xterm/xterm/css/xterm.css";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getWebContainer } from "@/lib/webcontainer";
import { nextjsStarterTree } from "@/data/templates/nextjs-starter";
import { useMetrics } from "@/lib/metrics-store";

/**
 * <WebPlayground> — boots a real WebContainer, mounts the nextjs-starter tree,
 * runs `npm install && npm run dev`, streams output into an xterm terminal and
 * shows the live dev server in an iframe once `server-ready` fires.
 */
export function WebPlayground({ name }: { name: string }) {
  const termHost = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("booting WebContainer…");
  const setBoot = useMetrics((s) => s.setWebcontainerBootMs);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

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
          write("cross-origin isolation is off — WebContainer cannot boot.\r\n");
          setStatus("unavailable");
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
          setStatus(`install failed (${code})`);
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
        write(`\r\nerror: ${e instanceof Error ? e.message : String(e)}\r\n`);
        setStatus("error");
      }
    };

    void run();

    return () => {
      disposed = true;
      if (term) term.dispose();
    };
  }, [setBoot]);

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
          {!serverUrl && status !== "error" && status !== "unavailable" && (
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
          )}
          <span className="text-cyan-300">{name}</span>
          <span className="text-muted-foreground">· {status}</span>
        </div>
      </div>

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
              waiting for dev server…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
