# Codecraft

An in-browser IDE. A Vite + React dev server runs inside the browser tab through
WebContainers, with a Monaco editor, an xterm terminal and a live preview.

Live: [codecraft-ai-tau.vercel.app](https://codecraft-ai-tau.vercel.app). Next.js 16,
React 19, TypeScript.

The public deployment runs the playground only. It has no sign-in and no database, so
there `/dashboard`, `/settings`, `/auth/sign-in` and `/api/auth/*` answer a plain 503
page that says sign-in is not configured.

[![CI](https://github.com/ykstorm/codecraft-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/ykstorm/codecraft-ai/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## What it is

A Node.js runtime booted inside the tab with [WebContainers](https://webcontainers.io).
There is no server behind the editor: the dev server runs on the visitor's machine, in
a sandbox the browser isolates with COOP and COEP headers.

Pages:

- `/`: the landing page. It has the playground list, a read-only WebContainer that runs
  `ls && node -v` as a demo, the stack list, and the boot time of that demo measured
  in your own browser (nothing is hardcoded; the value is whatever the shell demo
  recorded).
- `/playgrounds`: the template gallery. One template is wired, Vite + React. Others
  are added only when they boot end to end.
- `/playground/[slug]`: the IDE. Three resizable panels: a Monaco editor with a file
  list beside it, an xterm terminal connected to the container's `jsh` shell, and a
  preview iframe served from the WebContainer's `server-ready` URL. Edits are written
  into the container's filesystem after a 300 ms debounce and Vite's HMR refreshes the
  preview. On a narrow viewport the page shows a desktop-only note, but the
  WebContainer still boots behind it: the boot hook runs before the width check
  (`components/playground/web-playground.tsx`).
- `/api/now`: a liveness probe that returns today's date.
- `/api/csp-report`: receives the report-only Content-Security-Policy's violation
  reports and logs one short line for each.

The landing page, the gallery and the playgrounds are public, so the editor opens
without signing in. `/dashboard` and `/settings` are behind NextAuth when the auth
variables are set (see Environment below); without them they answer 503. See
[`routes.ts`](routes.ts) and [`proxy.ts`](proxy.ts).

## Architecture

1. Vercel serves the Next.js host page with `Cross-Origin-Opener-Policy: same-origin`
   and `Cross-Origin-Embedder-Policy: require-corp` on every route, which makes the
   tab cross-origin isolated.
2. The host UI boots a WebContainer in the tab: it mounts the template files and
   spawns the install and dev-server processes
   (`hooks/use-vite-webcontainer.ts`).
3. If IndexedDB holds a snapshot of the project folder from an earlier visit, the
   hook mounts it back into the container's working directory instead of running
   `npm install`, and checks that `package.json` and `node_modules` are there. A
   stored value in an older layout, or a restore without those two, is deleted and
   the boot installs from the template. After a fresh install the hook exports the
   project folder, without Vite's cache in `node_modules/.vite`, and saves it only if
   that export fits the storage budget: at most 200 MB, and the site's storage at
   most half of its quota after the write. The budget is checked on save, before
   anything is written (`lib/project-snapshot.ts`, `lib/snapshot-cache.ts`).
4. Edits in Monaco are written into the container with `fs.writeFile`; the terminal
   is wired to the container's `jsh` shell over stdin and stdout.
5. When the dev server inside the container reports a URL, the preview iframe loads
   it. If the dev server exits on its own, the page shows an error and the terminal
   repeats the last lines of its output. If the runtime has not booted after 60 s,
   the page says so instead of waiting.

`SharedArrayBuffer`, which WebContainers need, is only available to
cross-origin-isolated documents. Both headers are set on every route
(`next.config.ts`, `lib/security-headers.ts`), so the WebContainer can boot on any
page, including the shell demo on the homepage.

## Why WebContainers

Compared with server-side containers there is nothing to provision or pay for per
visitor; the runtime is the visitor's CPU. Compared with iframe-only sandboxes, a
WebContainer can run `npm install` and a real Node process because it has a
filesystem and a process model. Compared with remote SSH or Codespaces there is no
sign-in, no provisioning, and no network round trip per keystroke; the dev server is
local to the tab.

## Stack and local development

Next.js 16 (App Router, the host app), React 19, TypeScript, Tailwind 4,
`@webcontainer/api`, `@xterm/xterm` with `@xterm/addon-fit`, `@monaco-editor/react`
with a self-hosted `monaco-editor` (no CDN), `react-resizable-panels`, next-themes,
Prisma, NextAuth. The template booted inside the WebContainer is Vite + React 18.

```bash
git clone https://github.com/ykstorm/codecraft-ai
cd codecraft-ai
npm install
cp .env.example .env   # see Environment below
npm run dev            # http://localhost:3000
```

Then open http://localhost:3000/playground/vite-react-starter. The landing page and
the playground are public, so no sign-in is needed to reach the editor.

`npm run build` runs `prisma generate && next build`. The COOP and COEP headers are
applied in development and production (`next.config.ts`, `lib/security-headers.ts`),
so WebContainers work locally too.

`node scripts/gen-social.mjs` regenerates the social preview image,
`.github/social-preview.png`, by hand; it is the only user of the `sharp` dev
dependency.

### Environment

The landing page and the playground need no secrets. `/dashboard`, `/settings` and
the NextAuth callbacks need all six of these:

| Variable | Required for | Notes |
|---|---|---|
| `AUTH_SECRET` | NextAuth sessions | `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub sign-in | GitHub OAuth app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in | Google OAuth client |
| `DATABASE_URL` | Prisma (users and accounts) | a MongoDB connection string |

If any of them is missing or blank, the app runs the playground only
(`isAuthConfigured` in `lib/env-validate.ts`): the landing header has no dashboard
link, and `/dashboard`, `/settings`, `/auth/sign-in` and `/api/auth/*` answer a 503 page
instead of the 500 Auth.js would raise. The proxy checks on every request; the header
link is decided when the static landing page is built, which on Vercel uses the same
variables as the runtime.

## Limitations

- No native modules. WebContainers run a WASM build of Node, so anything that needs
  a native addon will not install or run: no `sqlite3`, `node-gyp`, `sharp` or
  `bcrypt`. Pure JavaScript dependencies only.
- The first visit is slow. The first boot plus `npm install` for the Vite template
  runs in your tab. In one Chrome session on 2026-10-07 a cold boot took 73.0 s and a
  boot after reset took 47.0 s; those are one machine's numbers. Return visits mount
  the stored snapshot instead of running `npm install`, when the snapshot fit the
  budget; on the same machine, two return visits to a preview deployment were ready
  in 11.6 s and 16.8 s later that day, with a 36.5 MB snapshot. The playground header
  shows the measured time of each boot.
- Reset deletes this template's stored snapshot from IndexedDB, stops the dev server
  and the shell, mounts the template files over the project folder and runs
  `npm install` again. It does not empty the folder: edits to the template's files
  are replaced, while files added from the terminal and the installed
  `node_modules` stay. After a boot that timed out, reset and retry reload the page
  instead, because only a reload can start the runtime again.
- Edits do not survive a hard refresh. A full reload re-mounts the snapshot or the
  template. The editor writes into the container filesystem for HMR, not to durable
  storage.
- A current desktop browser is required. `SharedArrayBuffer` and cross-origin
  isolation are needed, so current Chrome, Edge or Firefox. Narrow viewports get the
  desktop-only note; the container still boots and installs behind it.
- One template is live. `vite-react-starter` boots end to end.

Verification: the WebContainer boot can only be exercised in a real
cross-origin-isolated browser. CI runs lint, typecheck (after `prisma generate`), the
unit tests, an audit of the production dependencies (`npm audit --omit=dev
--audit-level=high`) and Playwright smoke tests against a production `next build`; a
separate workflow builds the Docker image. The in-tab boot, edit and terminal are
checked by hand on the Vercel preview. See [`docs/CLAIM_AUDIT.md`](docs/CLAIM_AUDIT.md).

## License

Apache 2.0, see [LICENSE](LICENSE).
