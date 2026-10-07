"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusLine, type StatusTone } from "@/components/ui/status-line";
import { getWebContainer } from "@/lib/webcontainer";

type Run =
  | { step: "idle" }
  | { step: "booting" }
  | { step: "running"; bootMs: number }
  | { step: "done"; bootMs: number }
  | { step: "failed"; message: string };

function describe(run: Run): { tone: StatusTone; text: string } {
  switch (run.step) {
    case "idle":
      return { tone: "neutral", text: "Not run yet. Nothing boots until you press Run." };
    case "booting":
      return { tone: "neutral", text: "Booting the WebContainer" };
    case "running":
      return { tone: "neutral", text: `Boot time: ${run.bootMs} ms. Running ls && node -v` };
    case "done":
      return { tone: "ok", text: `Boot time: ${run.bootMs} ms` };
    case "failed":
      return { tone: "bad", text: run.message };
  }
}

/**
 * Boots a WebContainer when the visitor presses Run, runs `ls && node -v` in
 * it and shows the output with the measured boot time. Nothing boots before
 * the press. The container is the one the playground uses
 * (lib/webcontainer.ts), so once it is up in this tab the boot time is close
 * to zero.
 */
export function ShellDemo() {
  const [run, setRun] = useState<Run>({ step: "idle" });
  const [output, setOutput] = useState("");

  async function start() {
    setOutput("");
    if (!window.crossOriginIsolated) {
      setRun({
        step: "failed",
        message: "Cross-origin isolation is off in this tab, so the WebContainer cannot boot.",
      });
      return;
    }
    setRun({ step: "booting" });
    try {
      const t0 = performance.now();
      const wc = await getWebContainer();
      const bootMs = Math.round(performance.now() - t0);
      setRun({ step: "running", bootMs });
      await wc.mount({
        "package.json": {
          file: { contents: '{"name":"codecraft-shell","type":"module"}' },
        },
        "index.js": {
          file: { contents: 'console.log("codecraft shell");\n' },
        },
        "README.md": { file: { contents: "# codecraft" } },
      });
      const proc = await wc.spawn("sh", ["-c", "ls && node -v"]);
      void proc.output.pipeTo(
        new WritableStream({
          write(chunk) {
            setOutput((prev) => prev + chunk);
          },
        })
      );
      await proc.exit;
      setRun({ step: "done", bootMs });
    } catch (err) {
      setRun({ step: "failed", message: err instanceof Error ? err.message : String(err) });
    }
  }

  const busy = run.step === "booting" || run.step === "running";
  const { tone, text } = describe(run);

  return (
    <Panel title="Shell demo">
      <p className="meta">
        Boots a WebContainer in this tab and runs{" "}
        <code className="mono">ls &amp;&amp; node -v</code> in it.
      </p>
      {output && <pre className="transcript mono">{output}</pre>}
      <div className="row">
        <Button onClick={start} disabled={busy}>
          Run
        </Button>
        <StatusLine tone={tone}>{text}</StatusLine>
      </div>
    </Panel>
  );
}
