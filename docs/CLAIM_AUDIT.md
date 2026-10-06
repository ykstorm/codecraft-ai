# Claim audit, codecraft-ai

Every public claim (README, landing page, resume/portfolio copy) mapped to the
file:line that implements it, plus how it's verified. If a row can't be filled,
the claim doesn't ship.

_Last verified: 2026-10-06, branch `audit-fixes`._

## Verification baseline (CI-runnable, exit 0)

| Command | Result |
|---|---|
| `npm install` | exit 0 |
| `npx prisma generate` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run build` (`prisma generate && next build`) | exit 0 |
| `npm test` (vitest) | 14 passed |
| `npm run dev` + probe `/` and `/playground/vite-react-starter` | both HTTP 200 |

The live in-tab WebContainer boot/edit/terminal requires a real cross-origin-isolated
browser and is verified on the Vercel preview (see "User actions" in the PR).

## README / product claims

| Claim | File:line implementing | Verified by |
|---|---|---|
| A real Vite + React dev server boots in the tab | `data/templates/vite-react.ts:16` (template) → mounted at `hooks/use-vite-webcontainer.ts:168` | Vercel preview: preview iframe renders the Vite app |
| WebContainer boots once per tab (never double-boot) | `lib/webcontainer.ts:11` (`getWebContainer` singleton) | code: single shared boot promise |
| Editable Monaco; edits hot-reload the preview | `components/playground/code-editor.tsx:142-146` (300ms debounce) → `hooks/use-vite-webcontainer.ts:248` (`container.fs.writeFile`) | Vercel preview: edit `src/App.jsx`, preview updates <2s |
| File tree switches the active file | `components/playground/code-editor.tsx:155-171` (file list + `setActive`) | Vercel preview: click a file, editor swaps |
| Interactive terminal wired to a live `jsh` shell | `hooks/use-vite-webcontainer.ts:212` (`wc.spawn("jsh", …)`) + `components/playground/interactive-terminal.tsx:102-106` (xterm `onData` → `shell.input` writer) | Vercel preview: type `ls`, `npm install dayjs`; it runs |
| Boot/install output streams into the terminal | `hooks/use-vite-webcontainer.ts:233,241` (`emit` via `onOutput`) + `interactive-terminal.tsx:58` (`registerSink`) | Vercel preview: install logs appear live |
| Live preview from the real `server-ready` URL | `hooks/use-vite-webcontainer.ts:293` (`wc.on("server-ready", …)` → `setServerUrl`) → `components/playground/web-playground.tsx:164` iframe `src={serverUrl}` | Vercel preview: iframe src is the WC URL, not hardcoded |
| Snapshot cache: return visits restore instead of reinstalling | export: `hooks/use-vite-webcontainer.ts:98` (`wc.export("/", {format:"binary"})` → `saveSnapshot` at `:100`); restore: `:157` (`loadSnapshot`) → `:162` (`wc.mount(snapshot)`); store: `lib/snapshot-cache.ts:44,68` (IndexedDB) | Vercel preview: 2nd visit shows "cached" + faster boot |
| Reset wipes the snapshot + reinstalls | `hooks/use-vite-webcontainer.ts:261-269` (`reset` → `clearSnapshot` + `forceCold`) + `web-playground.tsx:105-111` reset button | Vercel preview: click reset, cold reinstall runs |
| Resizable panes (editor / terminal / preview) | `components/playground/web-playground.tsx:133-182` (`ResizablePanelGroup` h+v) | Vercel preview: drag handles resize |
| Mobile → desktop-only hint, not a broken boot | `components/playground/web-playground.tsx:54` (`useIsMobile`) → `MobileFallback` (`:188`) | resize viewport <768px |
| LIVE TELEMETRY shows the **measured** boot time | measured: `components/ui/shell-demo.tsx:38-41` (`performance.now()` around `getWebContainer()` → `setWebcontainerBootMs`); store: `lib/metrics-store.ts:9,20`; shown: `components/ui/live-telemetry.tsx:13,21`; playground header: `web-playground.tsx:96-104` (`timings.totalMs`) | code: no hardcoded number; placeholder `··· ms` until measured |
| `// SHELL` runs a real `ls && node -v` | `components/ui/shell-demo.tsx:51` (`wc.spawn("sh", ["-c","ls && node -v"])`) | Vercel preview: real output streams |
| Landing + playground are public by design | `routes.ts:5-11` (`publicRoutes` incl. `/playground/*`) + `proxy.ts:21-26` (prefix match) | `npm run dev` probe: `/` and `/playground/vite-react-starter` → 200 without auth |
| `/dashboard`, `/settings` are auth-gated | not in `publicRoutes` (`routes.ts:5-11`) → `proxy.ts:41-44` (redirect to `/auth/sign-in`); in-page `auth()`: `app/dashboard/page.tsx:9-10`, `app/settings/page.tsx:8-9` | code: not in `publicRoutes` |
| COOP/COEP cross-origin isolation on every route | `next.config.ts:11-18` + `lib/security-headers.ts:52-54` | browser: `window.crossOriginIsolated === true` |
| No native modules / WASM Node limit | inherent to `@webcontainer/api` | documented limitation |

## Honesty notes

- The host app is **Next.js 16**; the template booted **inside** the WebContainer
  is **Vite + React 18**. Next.js is not run inside the WebContainer (its dev
  server is slow/unstable there, see `data/templates/vite-react.ts` header).
- No boot-time number is hardcoded in the UI. The only displayed timings come from
  `performance.now()` deltas measured live in the visitor's browser.
