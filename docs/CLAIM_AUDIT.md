# Claim audit, codecraft-ai

Every public claim (README, landing page, resume/portfolio copy) mapped to the
file:line that implements it, plus how it's verified. If a row can't be filled,
the claim doesn't ship.

_Last verified: 2026-10-07, branch `host-ui`._

## Verification baseline (CI-runnable, exit 0)

| Command | Result |
|---|---|
| `npm ci` | exit 0 |
| `npx prisma generate` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run build` (`prisma generate && next build`) | exit 0 |
| `npm test` (vitest) | 94 passed in 8 files |
| `npm run build` with no auth env + `next start` | `/` 200; `/dashboard`, `/settings`, `/auth/sign-in`, `/api/auth/session` 503 |

The live in-tab WebContainer boot/edit/terminal requires a real cross-origin-isolated
browser and is verified on the Vercel preview (see "User actions" in the PR).

## README / product claims

| Claim | File:line implementing | Verified by |
|---|---|---|
| A real Vite + React dev server boots in the tab | `data/templates/vite-react.ts:17` (template) → mounted at `hooks/use-vite-webcontainer.ts:196` | Vercel preview: preview iframe renders the Vite app |
| WebContainer boots once per tab (never double-boot) | `lib/webcontainer.ts:39` (`getWebContainer` singleton) | `tests/webcontainer.test.ts`: one boot shared by callers |
| A boot that never starts fails after 60 s | `lib/webcontainer.ts:6` (`BOOT_TIMEOUT_MS`), `:43` (`withTimeout`); reset reloads: `hooks/use-vite-webcontainer.ts:306-309` | `tests/webcontainer.test.ts` |
| Editable Monaco; edits hot-reload the preview | `components/playground/code-editor.tsx:155` (300ms debounce) → `hooks/use-vite-webcontainer.ts:292` (`container.fs.writeFile`) | Vercel preview: edit `src/App.jsx`, preview updates <2s |
| File list switches the active file | `components/playground/code-editor.tsx:173` (file list + `setActive`) | Vercel preview: click a file, editor swaps |
| Interactive terminal wired to a live `jsh` shell | `hooks/use-vite-webcontainer.ts:253` (`wc.spawn("jsh", …)`) + `components/playground/interactive-terminal.tsx:104` (xterm `onData` → `shell.input` writer) | Vercel preview: type `ls`, `npm install dayjs`; it runs |
| Boot/install output streams into the terminal | `hooks/use-vite-webcontainer.ts:275,286` (`emit` via `onOutput`) + `interactive-terminal.tsx:58` (`registerSink`) | Vercel preview: install logs appear live |
| Live preview from the real `server-ready` URL | `hooks/use-vite-webcontainer.ts:342` (`wc.on("server-ready", …)` → `setServerUrl`) → `components/playground/web-playground.tsx:141` iframe `src={serverUrl}` | Vercel preview: iframe src is the WC URL, not hardcoded |
| A dev server exit shows an error and its last lines | `hooks/use-vite-webcontainer.ts:374` (`watchDevExit`) + `lib/dev-process.ts` | `tests/dev-process.test.ts`; Vercel preview 2026-10-07: `process.exit(3)` in `vite.config.js` gave the banner with exit code 3 and the last lines in the terminal |
| Snapshot cache: return visits restore instead of reinstalling | export: `lib/project-snapshot.ts:45` (`wc.export(wc.workdir, …)` without `node_modules/.vite`) called at `hooks/use-vite-webcontainer.ts:123`, saved at `:129`; restore: `:154` (`loadSnapshot`) → `:162` → `lib/project-snapshot.ts:60-63` (mount into the working directory, check `package.json` and `node_modules`, then make the bin scripts executable again at `:82`); store: `lib/snapshot-cache.ts:94,112` (IndexedDB) | `tests/project-snapshot.test.ts`; Vercel preview 2026-10-07: a 36.5 MB snapshot, and reloads ready as "cached" in 11.6 s and 16.8 s |
| Snapshot budget: at most 200 MB and half the quota, checked on save | `lib/project-snapshot.ts:100` (`checkSnapshotBudget`) before `saveSnapshot` at `hooks/use-vite-webcontainer.ts:129` | `tests/project-snapshot.test.ts` |
| Reset deletes the stored snapshot and reinstalls from the template | `hooks/use-vite-webcontainer.ts:305-318` (`reset` → `clearSnapshot` + `forceCold`), template mounted over the folder at `:196` + `web-playground.tsx:95-100` reset button | Vercel preview: click reset, cold reinstall runs |
| Three resizable panels (editor / terminal / preview) | `components/playground/web-playground.tsx:111-159` (`PanelGroup` h+v) | Vercel preview: drag handles resize |
| Narrow screens get a desktop-only note; the container still boots behind it | `components/playground/web-playground.tsx:62-75` (`useIsMobile`, then `useViteWebContainer()`) → `:82` `MobileFallback` (`:165`) | code: the hook runs before the width check |
| The playground bar shows the boot state, the exit code and the boot time as text | `components/playground/web-playground.tsx:43` (`statusText`, exit code from `hooks/use-vite-webcontainer.ts:380,388`), `:54` (`timingText` from `timings.totalMs`), `:90` (`StatusLine`, `role="status"`) | Vercel preview: the bar reads "Running" and "Ready in … s" |
| The shell demo shows the boot time it measured | `components/ui/shell-demo.tsx:54-56` (`performance.now()` around `getWebContainer()`), shown at `:24-26` | code: no hardcoded number; "Not run yet" until measured |
| The shell demo runs a real `ls && node -v` | `components/ui/shell-demo.tsx:67` (`wc.spawn("sh", ["-c","ls && node -v"])`) | Vercel preview: real output streams |
| Landing + playground are public by design | `routes.ts:5-13` (`publicRoutes` incl. `/playground/*`) + `routes.ts:25` (`isPublicRoute`, prefix match) | `tests/auth-unavailable.test.ts` |
| `/dashboard`, `/settings` are auth-gated | not in `publicRoutes` (`routes.ts:5-13`) → `proxy.ts:34-37` (redirect to `/auth/sign-in`); in-page `auth()`: `app/dashboard/page.tsx:9-10`, `app/settings/page.tsx:8-9` | `tests/auth-unavailable.test.ts`: 307 with the auth env |
| Without the auth env, sign-in surfaces answer 503 | `proxy.ts:50-54` + `lib/env-validate.ts` (`isAuthConfigured`) + `lib/auth-unavailable.ts`; handler: `app/api/auth/[...nextauth]/route.ts` | `tests/auth-unavailable.test.ts`; local `next start` without env |
| COOP/COEP cross-origin isolation on every route | `next.config.ts:11-18` + `lib/security-headers.ts:68-69` | `tests/security-headers.test.ts`; browser: `window.crossOriginIsolated === true` |
| CSP reports reach `/api/csp-report` | `lib/security-headers.ts:62-63` (`report-uri`, `report-to`) + Reporting-Endpoints header + `app/api/csp-report/route.ts` | `tests/csp-report.test.ts`, `tests/security-headers.test.ts`; Vercel preview logs 2026-10-07: a browser report logged as one `csp-report` line, no `frame-src` report for the boot frame |
| No native modules / WASM Node limit | inherent to `@webcontainer/api` | documented limitation |

## Honesty notes

- The host app is Next.js 16; the template booted inside the WebContainer
  is Vite + React 18. Next.js is not run inside the WebContainer (its dev
  server is slow/unstable there, see `data/templates/vite-react.ts` header).
- No boot-time number is hardcoded in the UI. The only displayed timings come from
  `performance.now()` deltas measured live in the visitor's browser.
- The boot times in the README (cold 73.0 s, reset 47.0 s) were measured in one
  Chrome session on 2026-10-07 and are one machine's numbers.
