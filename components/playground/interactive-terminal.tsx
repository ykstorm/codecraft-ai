"use client";

import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import type { WebContainerProcess } from "@webcontainer/api";

/**
 * <InteractiveTerminal> — an xterm.js terminal wired to a real WebContainer
 * shell process (`jsh`). Boot/install logs stream in via `registerSink`; once a
 * `shell` is provided, keystrokes are piped to the shell's stdin so the user can
 * run `ls`, `cat package.json`, `npm install dayjs`, etc. and see real output.
 */
export function InteractiveTerminal({
  shell,
  registerSink,
}: {
  shell: WebContainerProcess | null;
  /** the parent calls this with a writer it can push boot/dev output through */
  registerSink: (sink: (chunk: string) => void) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const termRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fitRef = useRef<any>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);

  // Create the terminal once.
  useEffect(() => {
    let disposed = false;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (disposed) return;

      const term = new Terminal({
        convertEol: true,
        fontSize: 12,
        fontFamily: "ui-monospace, monospace",
        cursorBlink: true,
        theme: {
          background: "#050505",
          foreground: "#e5e7eb",
          cursor: "#22d3ee",
        },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      if (hostRef.current) {
        term.open(hostRef.current);
        try {
          fit.fit();
        } catch {
          /* host not laid out yet */
        }
      }
      termRef.current = term;
      fitRef.current = fit;

      // Stream boot/dev output from the parent into this terminal.
      registerSink((chunk: string) => term.write(chunk));

      const onResize = () => {
        try {
          fit.fit();
        } catch {
          /* ignore */
        }
      };
      window.addEventListener("resize", onResize);

      // Stash cleanup on the term instance.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (term as any)._cleanup = () => {
        window.removeEventListener("resize", onResize);
        term.dispose();
      };
    })();

    return () => {
      disposed = true;
      const term = termRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (term?._cleanup) (term as any)._cleanup();
      termRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bind the terminal to the shell process once it exists.
  useEffect(() => {
    const term = termRef.current;
    if (!term || !shell) return;

    let cancelled = false;

    // shell stdout/stderr → terminal
    shell.output.pipeTo(
      new WritableStream({
        write(chunk) {
          if (!cancelled) term.write(chunk);
        },
      })
    );

    // terminal keystrokes → shell stdin
    const writer = shell.input.getWriter();
    writerRef.current = writer;
    const sub = term.onData((data: string) => {
      writer.write(data).catch(() => {});
    });

    return () => {
      cancelled = true;
      sub.dispose();
      try {
        writer.releaseLock();
      } catch {
        /* ignore */
      }
      writerRef.current = null;
    };
  }, [shell]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
        terminal · webcontainer {shell ? "· interactive" : ""}
      </div>
      <div ref={hostRef} className="min-h-0 flex-1 bg-[#050505] p-2" />
    </div>
  );
}
