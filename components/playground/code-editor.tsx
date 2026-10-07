"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { loader, type BeforeMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { FileSystemTree } from "@webcontainer/api";

import { viteReactEditableFiles, viteReactTree } from "@/data/templates/vite-react";
import { codeGround } from "@/lib/code-ground";

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

// vs-dark as Monaco ships it, on the --code-ground token instead of its own
// background.
const THEME = "codecraft-dark";
const defineTheme: BeforeMount = (m) => {
  m.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: { "editor.background": codeGround() },
  });
};

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
    <div className="editor">
      <nav className="files" aria-label="Files">
        <p className="pane-label">
          <span className="pane-name">Files</span>
        </p>
        <ul>
          {files.map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => setActive(f)}
                aria-current={f === active ? "true" : undefined}
                title={f}
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
        <p className="files-hint">
          Tab indents in the editor. Ctrl+M (Ctrl+Shift+M on a Mac) makes it move
          focus instead.
        </p>
      </nav>

      <div className="code-pane">
        <Editor
          height="100%"
          theme={THEME}
          beforeMount={defineTheme}
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
