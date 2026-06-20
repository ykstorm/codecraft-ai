# Claim audit — codecraft-ai

Every public claim (README, landing page, resume/portfolio copy) mapped to the
file:line that implements it, plus how it's verified. If a row can't be filled,
the claim doesn't ship.

_Last verified: 2026-06-19 — branch `fix/real-e2e`._

## Verification baseline (CI-runnable, exit 0)

| Command | Result |
|---|---|
| `npm install` | exit 0 |
| `npx prisma generate` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run build` (`prisma generate && next build`) | exit 0 |
| `npm test` (vitest) | 23 passed |
| `npm run dev` + probe `/` and `/playground/vite-react-starter` | both HTTP 200 |

The live in-tab WebContainer boot/edit/terminal requires a real cross-origin-isolated
browser and is verified on the Vercel preview (see "User actions" in the PR).

## README / product claims

| Claim | File:line implementing | Verified by |
|---|---|---|
| A real Vite + React dev server boots in the tab | `data/templates/vite-react.ts:18` (template) → mounted at `hooks/use-vite-webcontainer.ts:153` | Vercel preview: preview iframe renders the Vite app |
| WebContainer boots once per tab (never double-boot) | `lib/webcontainer.ts:13` (`getWebContainer` singleton) | code: single shared boot promise |
| Editable Monaco; edits hot-reload the preview | `components/playground/code-editor.tsx:82` (300ms debounce) → `hooks/use-vite-webcontainer.ts:85` (`container.fs.writeFile`) | Vercel preview: edit `src/App.jsx`, preview updates <2s |
| File tree switches the active file | `components/playground/code-editor.tsx:88-110` (file list + `setActive`) | Vercel preview: click a file, editor swaps |
| Interactive terminal wired to a live `jsh` shell | `hooks/use-vite-webcontainer.ts:196` (`wc.spawn("jsh", …)`) + `components/playground/interactive-terminal.tsx:108-112` (xterm `onData` → `shell.input` writer) | Vercel preview: type `ls`, `npm install dayjs`; it runs |
| Boot/install output streams into the terminal | `hooks/use-vite-webcontainer.ts` (`emit` via `onOutput`) + `interactive-terminal.tsx:48` (`registerSink`) | Vercel preview: install logs appear live |
| Live preview from the real `server-ready` URL | `hooks/use-vite-webcontainer.ts:132` (`wc.on("server-ready", …)` → `setServerUrl`) → `components/playground/web-playground.tsx` iframe `src={serverUrl}` | Vercel preview: iframe src is the WC URL, not hardcoded |
| Snapshot cache → <20s return-visit boot | export: `hooks/use-vite-webcontainer.ts:181` (`wc.export("/", {format:"binary"})` → `saveSnapshot`); restore: `:144` (`loadSnapshot`) → `:146` (`wc.mount(snapshot)`); store: `lib/snapshot-cache.ts:44,68` (IndexedDB) | Vercel preview: 2nd visit shows "cached" + faster boot |
| Reset wipes the snapshot + reinstalls | `hooks/use-vite-webcontainer.ts:97` (`reset` → `clearSnapshot` + `forceCold`) + `web-playground.tsx` reset button | Vercel preview: click reset, cold reinstall runs |
| Resizable panes (editor / terminal / preview) | `components/playground/web-playground.tsx:127-168` (`ResizablePanelGroup` h+v) | Vercel preview: drag handles resize |
| Mobile → desktop-only hint, not a broken boot | `components/playground/web-playground.tsx:47` (`useIsMobile`) → `MobileFallback` | resize viewport <768px |
| LIVE TELEMETRY shows the **measured** boot time | `components/ui/live-telemetry.tsx:16-26` (`performance.now()` around `getWebContainer()`); playground header: `web-playground.tsx` (`timings.totalMs`) | code: no hardcoded number; placeholder `··· ms` until measured |
| `// SHELL` runs a real `ls && node -v` | `components/ui/shell-demo.tsx` (`wc.spawn("sh", ["-c","ls && node -v"])`) | Vercel preview: real output streams |
| Landing + playground are public by design | `routes.ts:11-16` (`publicRoutes` incl. `/playground/*`) + `middleware.ts:21-27` (prefix match) | `npm run dev` probe: `/` and `/playground/vite-react-starter` → 200 without auth |
| `/dashboard`, `/settings` are auth-gated | `routes.ts:21-24` + `middleware.ts:40-42` (redirect to `/auth/sign-in`) | code: not in `publicRoutes` |
| COOP/COEP cross-origin isolation on every route | `next.config.ts` headers + `vercel.json` | browser: `window.crossOriginIsolated === true` |
| No native modules / WASM Node limit | inherent to `@webcontainer/api` | documented limitation |

## Honesty notes

- The host app is **Next.js 15**; the template booted **inside** the WebContainer
  is **Vite + React 18**. Next.js is not run inside the WebContainer (its dev
  server is slow/unstable there — see `data/templates/vite-react.ts` header).
- No boot-time number is hardcoded anywhere. The only displayed timings come from
  `performance.now()` deltas measured live in the visitor's browser.
