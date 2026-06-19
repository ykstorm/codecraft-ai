import type { FileSystemTree } from "@webcontainer/api";

/**
 * Minimal but REAL Vite + React app, mounted inline into the WebContainer (no
 * disk read, no DB — Vercel-serverless safe). `npm install && npm run dev`
 * boots an actual Vite dev server inside the browser tab with HMR.
 *
 * Why Vite instead of Next.js: Next 15.x's dev server is slow and unstable
 * inside a WebContainer (cold boot can take minutes, and 15.5.x throws
 * "Expected workUnitAsyncStorage to have a store" on render). A Vite + React
 * project boots in ~30-40s cold and hot-reloads edits in <2s, so it is the
 * stable default for the live playground.
 *
 * JSX (not TSX) keeps the install light — no TypeScript toolchain needed.
 */
export const viteReactTree: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "vite-react-starter",
          private: true,
          type: "module",
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
          dependencies: {
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.3.4",
            vite: "^6.0.7",
          },
        },
        null,
        2
      ),
    },
  },
  "vite.config.js": {
    file: {
      contents: `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// host: true lets the WebContainer proxy reach the dev server.
export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
`,
    },
  },
  "index.html": {
    file: {
      contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Codecraft · Vite + React in your tab</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    },
  },
  src: {
    directory: {
      "main.jsx": {
        file: {
          contents: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
`,
        },
      },
      "App.jsx": {
        file: {
          contents: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="wrap">
      <p className="kicker">// live</p>
      <h1>Vite + React, running in your browser tab.</h1>
      <p className="sub">
        This dev server booted inside a WebContainer — no backend, no install on
        your machine. Edit <code>src/App.jsx</code> and watch it hot-reload.
      </p>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
    </main>
  );
}
`,
        },
      },
      "index.css": {
        file: {
          contents: `:root {
  color-scheme: dark;
}
body {
  margin: 0;
  background: #050505;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.wrap {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
}
.kicker {
  color: #22d3ee;
  letter-spacing: 0.1em;
  font-size: 12px;
  text-transform: uppercase;
  margin: 0;
}
h1 {
  font-size: 40px;
  margin: 4px 0;
}
.sub {
  color: #8b8b8b;
  line-height: 1.6;
}
code {
  color: #22d3ee;
}
button {
  justify-self: start;
  margin-top: 12px;
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 6px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}
button:hover {
  border-color: #22d3ee;
}
`,
        },
      },
    },
  },
};

/** Files surfaced in the editor file tree, in display order. */
export const viteReactEditableFiles = [
  "src/App.jsx",
  "src/index.css",
  "src/main.jsx",
  "index.html",
  "vite.config.js",
] as const;
