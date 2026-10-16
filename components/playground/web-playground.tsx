"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Panel as Pane, PanelGroup as PaneGroup } from "react-resizable-panels";

import { ResizeHandle } from "@/components/playground/resize-handle";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusLine, type StatusTone } from "@/components/ui/status-line";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useViteWebContainer,
  type BootPhase,
} from "@/hooks/use-vite-webcontainer";

// Monaco and xterm are browser-only (they touch `window`, workers, and the DOM
// on import), so they are loaded client-side with no SSR pass.
const CodeEditor = dynamic(
  () => import("@/components/playground/code-editor").then((m) => m.CodeEditor),
  { ssr: false }
);
const InteractiveTerminal = dynamic(
  () =>
    import("@/components/playground/interactive-terminal").then(
      (m) => m.InteractiveTerminal
    ),
  { ssr: false }
);

const PHASE_LABEL: Record<BootPhase, string> = {
  idle: "Starting",
  booting: "Booting the WebContainer",
  mounting: "Mounting the template",
  "restoring-snapshot": "Restoring the snapshot",
  installing: "Installing dependencies",
  "starting-dev": "Starting the dev server",
  ready: "Running",
  error: "Error",
  unavailable: "Unavailable",
};

function statusText(phase: BootPhase, exitCode: number | null): string {
  if (phase === "error" && exitCode != null) return `Error, exit code ${exitCode}`;
  return PHASE_LABEL[phase];
}

/** The boot stopped: it failed, or this browser cannot run it at all. */
function isFailedPhase(phase: BootPhase): boolean {
  return phase === "error" || phase === "unavailable";
}

function statusTone(phase: BootPhase): StatusTone {
  if (phase === "ready") return "ok";
  return isFailedPhase(phase) ? "bad" : "neutral";
}

/** The measured time from page start to a running dev server. */
function timingText(totalMs: number, fromSnapshot: boolean): string {
  const seconds = (totalMs / 1000).toFixed(1);
  return fromSnapshot
    ? `Ready in ${seconds} s from the snapshot`
    : `Ready in ${seconds} s, cold install`;
}

/** The boot time, shown once the dev server is running and it was measured. */
function ReadyTime({
  phase,
  totalMs,
  fromSnapshot,
}: {
  phase: BootPhase;
  totalMs: number | null;
  fromSnapshot: boolean;
}) {
  if (phase !== "ready" || totalMs == null) return null;
  return <p className="meta mono">{timingText(totalMs, fromSnapshot)}</p>;
}

function previewLabel(serverUrl: string | null, failed: boolean): string {
  if (serverUrl) return "live";
  return failed ? "stopped" : "waiting for the dev server";
}

/** The live preview, or a line saying why there is none yet. */
function PreviewPane({
  serverUrl,
  failed,
  status,
}: {
  serverUrl: string | null;
  failed: boolean;
  status: string;
}) {
  return (
    <section className="pane" aria-label="Preview">
      <p className="pane-label">
        <span className="pane-name">Preview</span>{" "}
        {previewLabel(serverUrl, failed)}
      </p>
      {serverUrl ? (
        <iframe
          title="preview"
          src={serverUrl}
          className="preview"
          // Sandbox the untrusted preview. It may run scripts, use its
          // own origin, post forms, open modals and popups, but it must
          // not navigate or redirect the top-level window, and it gets no
          // downloads. `allow=""` denies every powerful feature; the
          // no-referrer policy keeps our URL out of its requests.
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          allow=""
        />
      ) : (
        <p className="pane-empty">
          {failed ? "The dev server is not running." : status}
        </p>
      )}
    </section>
  );
}

export function WebPlayground({ name }: { name: string }) {
  const isMobile = useIsMobile();
  const {
    phase,
    error,
    exitCode,
    serverUrl,
    timings,
    container,
    shell,
    writeFile,
    readFile,
    reset,
    onOutput,
  } = useViteWebContainer();

  const failed = isFailedPhase(phase);
  const containerReady = container != null && !failed;
  const status = statusText(phase, exitCode);

  if (isMobile) {
    return <MobileFallback name={name} />;
  }

  return (
    <div className="ide">
      <header className="bar">
        <Link href="/playgrounds">Playgrounds</Link>
        <h1 className="bar-title">{name}</h1>
        <StatusLine tone={statusTone(phase)}>{status}</StatusLine>
        <div className="bar-end">
          <ReadyTime
            phase={phase}
            totalMs={timings.totalMs}
            fromSnapshot={timings.fromSnapshot}
          />
          <Button
            onClick={reset}
            title="Delete the stored snapshot and install again from the template"
          >
            {failed ? "Retry" : "Reset"}
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="ide-error">
          {error}
        </p>
      )}

      <main className="panes">
        <PaneGroup direction="horizontal">
          {/* Left column: editor on top, terminal below */}
          <Pane defaultSize={55} minSize={25}>
            <PaneGroup direction="vertical">
              <Pane defaultSize={65} minSize={20}>
                <CodeEditor
                  containerReady={containerReady}
                  writeFile={writeFile}
                  readFile={readFile}
                />
              </Pane>
              <ResizeHandle label="Resize the editor and the terminal" />
              <Pane defaultSize={35} minSize={15}>
                <InteractiveTerminal shell={shell} registerSink={onOutput} />
              </Pane>
            </PaneGroup>
          </Pane>

          <ResizeHandle label="Resize the code and the preview" />

          {/* Right column: live preview */}
          <Pane defaultSize={45} minSize={20}>
            <PreviewPane serverUrl={serverUrl} failed={failed} status={status} />
          </Pane>
        </PaneGroup>
      </main>
    </div>
  );
}

function MobileFallback({ name }: { name: string }) {
  return (
    <main className="page">
      <h1>{name}</h1>
      <Panel title="Desktop only">
        <p>
          The playground puts a code editor, a terminal and a live preview side
          by side, which needs a screen at least 768 px wide. Open this page on a
          laptop or desktop in a current Chrome, Edge or Firefox.
        </p>
        <p>
          <Link href="/playgrounds">Back to the playgrounds</Link>
        </p>
      </Panel>
    </main>
  );
}
