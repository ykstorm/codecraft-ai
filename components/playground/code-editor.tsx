"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { FileSystemTree } from "@webcontainer/api";

import { viteReactEditableFiles, viteReactTree } from "@/data/templates/vite-react";

// Self-host Monaco. Without this, @monaco-editor/react loads the editor from a
// jsDelivr CDN at runtime; pointing its loader at the bundled `monaco-editor`
// package keeps everything same-origin (no third-party CDN, CSP-clean) and the
// language workers ship in .next/static. `new Worker(new URL(...))` is the
// bundler-native worker form (webpack 5 / Turbopack both resolve it).
if (typeof window !== "undefined") {
  (self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment =
    {
      getWorker(_workerId: string, label: string) {
        switch (label) {
          case "json":
            return new Worker(
              new URL(
                "monaco-editor/language/json/json.worker.js",
                import.meta.url
              )
            );
          case "css":
          case "scss":
          case "less":
            return new Worker(
              new URL(
                "monaco-editor/language/css/css.worker.js",
                import.meta.url
              )
            );
          case "html":
          case "handlebars":
          case "razor":
            return new Worker(
              new URL(
                "monaco-editor/language/html/html.worker.js",
                import.meta.url
              )
            );
          case "typescript":
          case "javascript":
            return new Worker(
              new URL(
                "monaco-editor/language/typescript/ts.worker.js",
                import.meta.url
              )
            );
          default:
            return new Worker(
              new URL(
                "monaco-editor/editor/editor.worker.js",
                import.meta.url
              )
            );
        }
      },
    };
  loader.config({ monaco });
}

// Flatten the static template tree once into a path -> contents map, so the
// editor can seed a file's initial contents without walking the tree per lookup.
function flattenTree(
  tree: FileSystemTree,
  prefix = ""
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, node] of Object.entries(tree)) {
    const path = prefix ? `${prefix}/${name}` : name;
    if ("file" in node) {
      const contents = "contents" in node.file ? node.file.contents : "";
      out[path] = typeof contents === "string" ? contents : "";
    } else if ("directory" in node) {
      Object.assign(out, flattenTree(node.directory, path));
    }
  }
  return out;
}

const TEMPLATE_FILES = flattenTree(viteReactTree);

function templateFileContents(path: string): string {
  return TEMPLATE_FILES[path] ?? "";
}

function languageFor(path: string): string {
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
}

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
