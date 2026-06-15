import type { FileSystemTree } from "@webcontainer/api";

/**
 * Minimal but REAL Next.js app, mounted inline into the WebContainer (no disk
 * read, no DB — Vercel-serverless safe). `npm install && npm run dev` boots an
 * actual Next.js dev server inside the browser tab. JS (not TS) to keep the
 * install light — no typescript toolchain needed.
 */
export const nextjsStarterTree: FileSystemTree = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "nextjs-starter",
          private: true,
          scripts: { dev: "next dev" },
          dependencies: {
            // Next 15.5.x is broken inside WebContainers — its dev server throws
            // "Expected workUnitAsyncStorage to have a store" on render.
            // 15.4.x is the last line that boots cleanly in a WebContainer.
            // refs: stackblitz/webcontainer-core#1978, vercel/next.js#84026
            next: "15.4.11",
            react: "19.1.0",
            "react-dom": "19.1.0",
          },
        },
        null,
        2
      ),
    },
  },
  "next.config.mjs": {
    file: { contents: "export default {};\n" },
  },
  "jsconfig.json": {
    file: { contents: JSON.stringify({ compilerOptions: { jsx: "preserve" } }, null, 2) },
  },
  app: {
    directory: {
      "layout.js": {
        file: {
          contents: `export const metadata = { title: "Codecraft · Next.js in your tab" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#050505", color: "#e5e7eb", fontFamily: "ui-monospace, monospace" }}>
        {children}
      </body>
    </html>
  );
}
`,
        },
      },
      "page.js": {
        file: {
          contents: `export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div>
        <p style={{ color: "#22d3ee", letterSpacing: "0.1em", fontSize: 12, textTransform: "uppercase" }}>
          // live
        </p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Next.js, running in your browser tab.</h1>
        <p style={{ color: "#8b8b8b" }}>
          This dev server booted inside a WebContainer — no backend, no install on your machine.
        </p>
        <p style={{ color: "#8b8b8b" }}>Rendered at {new Date().toISOString()}</p>
      </div>
    </main>
  );
}
`,
        },
      },
    },
  },
};
