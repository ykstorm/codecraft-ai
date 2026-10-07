"use client";

import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import type { WebContainerProcess } from "@webcontainer/api";

import { codeGround } from "@/lib/code-ground";

export function InteractiveTerminal({
  shell,
  registerSink,
}: {
  shell: WebContainerProcess | null;
  /** the parent calls this with a writer it can push boot/dev output through */
  registerSink: (sink: (chunk: string) => void) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
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
        scrollback: 2000,
        theme: {
          background: codeGround(),
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

      cleanupRef.current = () => {
        window.removeEventListener("resize", onResize);
        term.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      termRef.current = null;
      fitRef.current = null;
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
    <section className="pane" aria-label="Terminal">
      <p className="pane-label">
        <span className="pane-name">Terminal</span>{" "}
        {shell ? "jsh, takes input" : "boot output"}
      </p>
      <div ref={hostRef} className="code-pane terminal" />
    </section>
  );
}
