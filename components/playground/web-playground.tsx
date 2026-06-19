"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useEffect } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { useMetrics } from "@/lib/metrics-store";
import {
  useViteWebContainer,
  type BootPhase,
} from "@/hooks/use-vite-webcontainer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { InteractiveTerminal } from "@/components/playground/interactive-terminal";
import { CodeEditor } from "@/components/playground/code-editor";

const PHASE_LABEL: Record<BootPhase, string> = {
  idle: "starting…",
  booting: "booting WebContainer…",
  mounting: "mounting files…",
  "restoring-snapshot": "restoring cached snapshot…",
  installing: "npm install…",
  "starting-dev": "starting dev server…",
  ready: "ready",
  error: "error",
  unavailable: "unavailable",
};

/**
 * <WebPlayground> — boots a real WebContainer, mounts the Vite + React template
 * (or a cached snapshot), runs `npm install && npm run dev`, and presents a real
 * IDE: an editable Monaco editor whose debounced writes hot-reload the preview,
 * an interactive xterm terminal wired to a `jsh` shell, and a live preview
 * iframe — all in resizable panes. Mobile viewports get a desktop-only hint.
 */
export function WebPlayground({ name }: { name: string }) {
  const isMobile = useIsMobile();
  const {
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
  } = useViteWebContainer();

  const setBoot = useMetrics((s) => s.setWebcontainerBootMs);
  useEffect(() => {
    if (timings.bootMs != null) setBoot(timings.bootMs);
  }, [timings.bootMs, setBoot]);

  const failed =
    phase === "error" || phase === "unavailable";
  const containerReady = container != null && !failed;
  const status = PHASE_LABEL[phase];

  if (isMobile) {
    return <MobileFallback name={name} />;
  }

  return (
    <div className="flex h-screen flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/playgrounds"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" /> playgrounds
        </Link>
        <div className="flex items-center gap-3 font-mono text-xs">
          {!serverUrl && !failed && (
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
          )}
          <span className="text-cyan-300">{name}</span>
          <span className="text-muted-foreground">· {status}</span>
          {timings.totalMs != null && (
            <span
              className="text-muted-foreground"
              title="real measured boot time"
            >
              · {timings.fromSnapshot ? "cached" : "cold"}{" "}
              {(timings.totalMs / 1000).toFixed(1)}s
            </span>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-muted-foreground transition-colors hover:border-cyan-400 hover:text-cyan-300"
            title="wipe snapshot + reinstall from the pristine template"
          >
            <RotateCcw className="h-3 w-3" /> reset
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start justify-between gap-4 rounded-md border border-amber-500/40 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="font-mono text-xs leading-relaxed text-amber-200/90">
              {error}
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-amber-500/40 px-2.5 py-1 font-mono text-xs text-amber-200 transition-colors hover:bg-amber-500/10"
          >
            <RefreshCw className="h-3 w-3" /> retry
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup direction="horizontal" className="rounded-md border border-border">
          {/* Left column: editor on top, terminal below */}
          <ResizablePanel defaultSize={55} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65} minSize={20}>
                <div className="h-full overflow-hidden bg-[#1e1e1e]">
                  <CodeEditor
                    containerReady={containerReady}
                    writeFile={writeFile}
                    readFile={readFile}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={15}>
                <InteractiveTerminal shell={shell} registerSink={onOutput} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right column: live preview */}
          <ResizablePanel defaultSize={45} minSize={20}>
            <div className="flex h-full flex-col">
              <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
                preview {serverUrl ? "· live" : "· waiting"}
              </div>
              {serverUrl ? (
                <iframe
                  title="preview"
                  src={serverUrl}
                  className="min-h-0 flex-1 w-full bg-white"
                />
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center font-mono text-xs text-muted-foreground">
                  {failed ? "dev server not running" : `${status}`}
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function MobileFallback({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center font-mono">
      <div className="w-full max-w-md space-y-4">
        <p className="cc-label">{`// ${name.toUpperCase()}`}</p>
        <h1 className="text-xl text-cyan-200">Desktop only</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The editor needs a wider screen. The playground boots a full
          WebContainer dev server with a code editor, an interactive terminal,
          and a live preview side-by-side — that doesn&apos;t fit on a phone.
          Open this on a laptop or desktop in Chrome, Edge, or Firefox.
        </p>
        <div className="overflow-hidden rounded-md border border-border bg-[#050505] p-4 text-left">
          <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            {`┌─ editor ───────┬─ preview ─┐
│ src/App.jsx    │  Vite +   │
│ ...            │  React    │
├─ terminal ─────┤  (live)   │
│ $ npm run dev  │           │
└────────────────┴───────────┘`}
          </pre>
        </div>
        <Link
          href="/playgrounds"
          className="inline-flex items-center gap-2 rounded border border-cyan-400/40 px-4 py-2 text-sm text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-400/10"
        >
          <ArrowLeft className="h-4 w-4" /> browse templates
        </Link>
      </div>
    </div>
  );
}
