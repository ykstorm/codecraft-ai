"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

import { viteReactEditableFiles, viteReactTree } from "@/data/templates/vite-react";

/** Pull an initial file's contents out of the static template tree by path. */
function templateFileContents(path: string): string {
  const parts = path.split("/");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = viteReactTree;
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (i === parts.length - 1) {
      return node[seg]?.file?.contents ?? "";
    }
    node = node[seg]?.directory ?? {};
  }
  return "";
}

function languageFor(path: string): string {
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
}

/**
 * <CodeEditor> — an editable Monaco editor over the WebContainer's files. A
 * file tree on the left switches the active file; edits are debounced (~300ms)
 * and written into the WebContainer FS, so Vite's HMR hot-reloads the preview.
 *
 * Files are seeded from the static template, then re-read live from the
 * container once it's ready (so snapshot-restored edits show their real state).
 */
export function CodeEditor({
  containerReady,
  writeFile,
  readFile,
}: {
  containerReady: boolean;
  writeFile: (path: string, contents: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
}) {
  const files = viteReactEditableFiles;
  const [active, setActive] = useState<string>(files[0]);
  const [value, setValue] = useState<string>(() =>
    templateFileContents(files[0])
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the container becomes ready, or the active file changes, load the
  // live contents from the WebContainer FS (falls back to template seed).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (containerReady) {
        try {
          const live = await readFile(active);
          if (!cancelled) setValue(live);
          return;
        } catch {
          /* file may not exist yet — fall back to template */
        }
      }
      if (!cancelled) setValue(templateFileContents(active));
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [active, containerReady, readFile]);

  function handleChange(next: string | undefined) {
    const text = next ?? "";
    setValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (containerReady) {
        void writeFile(active, text);
      }
    }, 300);
  }

  return (
    <div className="flex h-full">
      <div className="w-40 shrink-0 overflow-auto border-r border-border bg-muted/20">
        <p className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          files
        </p>
        <ul className="py-1">
          {files.map((f) => (
            <li key={f}>
              <button
                onClick={() => setActive(f)}
                className={`w-full truncate px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                  f === active
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={f}
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          path={active}
          language={languageFor(active)}
          value={value}
          onChange={handleChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: "ui-monospace, monospace",
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
