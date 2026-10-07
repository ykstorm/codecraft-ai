# Architecture

An in-browser IDE. A real Vite + React dev server boots inside the browser tab
via WebContainers; the Next.js app is only the host shell that serves it under
cross-origin isolation.

## Flow

1. Vercel serves the Next.js host page with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on every route, which makes the tab cross-origin isolated.
2. The host UI (Monaco editor, xterm terminal, preview pane) boots a WebContainer in the tab: it mounts the template files and spawns the install and dev-server processes (`hooks/use-vite-webcontainer.ts`).
3. If IndexedDB holds a snapshot of the project folder from an earlier visit, the hook mounts it back into the working directory instead of running `npm install` and checks that `package.json` and `node_modules` are there; otherwise it deletes the snapshot and installs. After a fresh install it exports the project folder (without `node_modules/.vite`) and saves it if the export fits the budget, which is checked on save: at most 200 MB, and at most half of the storage quota in use after the write.
4. Edits in Monaco are written into the container with `fs.writeFile`; the terminal is wired to the container's `jsh` shell over stdin and stdout.
5. When the dev server inside the container reports a URL, the preview iframe loads it. A dev server that exits on its own turns into an error, with its last lines repeated in the terminal.

`SharedArrayBuffer` (which WebContainers need) is only available to
cross-origin-isolated documents, so the host sets `Cross-Origin-Opener-Policy:
same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on every route.

## The files that matter

The playground is five source files plus a template and a few small modules.

1. `hooks/use-vite-webcontainer.ts`: the engine. Boots the shared
   WebContainer, mounts the Vite + React template (or restores a cached
   snapshot), runs `npm install` (bounded by a timeout) and `npm run dev`, spawns
   an interactive `jsh` shell, wires `server-ready` to the preview URL, watches
   the dev server for an exit, and measures every timing with
   `performance.now()`. Kills the dev server and shell on unmount.

2. `components/playground/web-playground.tsx`: the layout. Three resizable
   panels (editor with its file list, terminal, preview), status/timings header,
   reset and retry, and a desktop-only hint on narrow viewports. The hook is
   called before the width check, so the container boots behind that hint too.
   The preview iframe is sandboxed.

3. `components/playground/code-editor.tsx`: an editable Monaco editor,
   self-hosted (no CDN). A file list switches the active file; edits are
   debounced and written into the container FS so Vite HMR reloads the preview.

4. `components/playground/interactive-terminal.tsx`: an xterm.js terminal
   bound to the `jsh` shell: boot/install logs stream in, keystrokes go to the
   shell's stdin.

5. `lib/webcontainer.ts`: a single shared WebContainer per tab
   (`WebContainer.boot()` throws if called twice), reused across navigations.
   A boot that has not finished after 60 s fails with a message; only a page
   reload can boot again after that.

Supporting modules: `lib/project-snapshot.ts` (what is exported, how it is
mounted back, and the size budget), `lib/snapshot-cache.ts` (IndexedDB snapshot
store), `lib/dev-process.ts` (the dev server's output tail and exit report),
`lib/security-headers.ts` (the single source of HTTP headers),
`lib/csp-report.ts` with `app/api/csp-report/route.ts` (CSP violation reports),
`data/templates/vite-react.ts` (the mounted Vite + React project), and
`lib/timeout.ts` (the timeout helper).

## Auth and data

NextAuth v5 (Google + GitHub) with a Prisma adapter over MongoDB (`auth.ts`,
`auth.config.ts`, `lib/db.ts`, `prisma/schema.prisma`). Only `/dashboard` and
`/settings` are gated (see `routes.ts` and `proxy.ts`); the landing page, the
gallery, and the playgrounds are public so the editor opens without signing in.

Sign-in needs six variables (`lib/env-validate.ts`). Without them the app runs
the playground only: `proxy.ts` answers every non-public path, `/auth/sign-in`
and `/api/auth/*` included, with a 503 page from `lib/auth-unavailable.ts`, and
the landing header has no dashboard link. The public deployment runs this way.
