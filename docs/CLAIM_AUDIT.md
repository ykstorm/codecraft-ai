# Claim audit, codecraft-ai

Every public claim (README, landing page, resume/portfolio copy) mapped to the
file:line that implements it, plus how it's verified. If a row can't be filled,
the claim doesn't ship.

_Last verified: 2026-10-07, branch `deep-dive-fixes`._

## Verification baseline (CI-runnable, exit 0)

| Command | Result |
|---|---|
| `npm ci` | exit 0 |
| `npx prisma generate` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run build` (`prisma generate && next build`) | exit 0 |
| `npm test` (vitest) | 76 passed in 8 files |
| `npm run build` with no auth env + `next start` | `/` 200; `/dashboard`, `/settings`, `/auth/sign-in`, `/api/auth/session` 503 |

The live in-tab WebContainer boot/edit/terminal requires a real cross-origin-isolated
browser and is verified on the Vercel preview (see "User actions" in the PR).

## README / product claims

| Claim | File:line implementing | Verified by |
|---|---|---|
| A real Vite + React dev server boots in the tab | `data/templates/vite-react.ts:17` (template) → mounted at `hooks/use-vite-webcontainer.ts:189` | Vercel preview: preview iframe renders the Vite app |
| WebContainer boots once per tab (never double-boot) | `lib/webcontainer.ts:39` (`getWebContainer` singleton) | `tests/webcontainer.test.ts`: one boot shared by callers |
| A boot that never starts fails after 60 s | `lib/webcontainer.ts:6` (`BOOT_TIMEOUT_MS`), `:43` (`withTimeout`); reset reloads: `hooks/use-vite-webcontainer.ts:297-300` | `tests/webcontainer.test.ts` |
| Editable Monaco; edits hot-reload the preview | `components/playground/code-editor.tsx:142` (300ms debounce) → `hooks/use-vite-webcontainer.ts:283` (`container.fs.writeFile`) | Vercel preview: edit `src/App.jsx`, preview updates <2s |
| File list switches the active file | `components/playground/code-editor.tsx:159` (file list + `setActive`) | Vercel preview: click a file, editor swaps |
| Interactive terminal wired to a live `jsh` shell | `hooks/use-vite-webcontainer.ts:245` (`wc.spawn("jsh", …)`) + `components/playground/interactive-terminal.tsx:104` (xterm `onData` → `shell.input` writer) | Vercel preview: type `ls`, `npm install dayjs`; it runs |
| Boot/install output streams into the terminal | `hooks/use-vite-webcontainer.ts:266,277` (`emit` via `onOutput`) + `interactive-terminal.tsx:58` (`registerSink`) | Vercel preview: install logs appear live |
| Live preview from the real `server-ready` URL | `hooks/use-vite-webcontainer.ts:332` (`wc.on("server-ready", …)` → `setServerUrl`) → `components/playground/web-playground.tsx:164` iframe `src={serverUrl}` | Vercel preview: iframe src is the WC URL, not hardcoded |
| A dev server exit shows an error and its last lines | `hooks/use-vite-webcontainer.ts:364` (`watchDevExit`) + `lib/dev-process.ts` | `tests/dev-process.test.ts`; Vercel preview: `process.exit(3)` in `vite.config.js` |
| Snapshot cache: return visits restore instead of reinstalling | export: `lib/project-snapshot.ts:41` (`wc.export(wc.workdir, …)` without `node_modules/.vite`) called at `hooks/use-vite-webcontainer.ts:117`, saved at `:123`; restore: `:147` (`loadSnapshot`) → `:155` → `lib/project-snapshot.ts:55-57` (mount into the working directory, check `package.json` and `node_modules`); store: `lib/snapshot-cache.ts:94,112` (IndexedDB) | `tests/project-snapshot.test.ts`; Vercel preview: reload shows "cached" |
| Snapshot budget: at most 200 MB and half the quota, checked on save | `lib/project-snapshot.ts:77` (`checkSnapshotBudget`) before `saveSnapshot` at `hooks/use-vite-webcontainer.ts:123` | `tests/project-snapshot.test.ts` |
| Reset deletes the stored snapshot and reinstalls from the template | `hooks/use-vite-webcontainer.ts:296-308` (`reset` → `clearSnapshot` + `forceCold`), template mounted over the folder at `:189` + `web-playground.tsx:105-111` reset button | Vercel preview: click reset, cold reinstall runs |
| Three resizable panels (editor / terminal / preview) | `components/playground/web-playground.tsx:133-182` (`ResizablePanelGroup` h+v) | Vercel preview: drag handles resize |
| Narrow screens get a desktop-only note; the container still boots behind it | `components/playground/web-playground.tsx:54-66` (`useIsMobile`, then `useViteWebContainer()`) → `:77` `MobileFallback` (`:188`) | code: the hook runs before the width check |
| LIVE TELEMETRY shows the measured boot time | measured: `components/ui/shell-demo.tsx:38-41` (`performance.now()` around `getWebContainer()` → `setWebcontainerBootMs`); store: `lib/metrics-store.ts:9,20`; shown: `components/ui/live-telemetry.tsx:12`; playground header: `web-playground.tsx:96-104` (`timings.totalMs`) | code: no hardcoded number; placeholder `··· ms` until measured |
| `// SHELL` runs a real `ls && node -v` | `components/ui/shell-demo.tsx:51` (`wc.spawn("sh", ["-c","ls && node -v"])`) | Vercel preview: real output streams |
| Landing + playground are public by design | `routes.ts:5-13` (`publicRoutes` incl. `/playground/*`) + `routes.ts:25` (`isPublicRoute`, prefix match) | `tests/auth-unavailable.test.ts` |
| `/dashboard`, `/settings` are auth-gated | not in `publicRoutes` (`routes.ts:5-13`) → `proxy.ts:34-37` (redirect to `/auth/sign-in`); in-page `auth()`: `app/dashboard/page.tsx:9-10`, `app/settings/page.tsx:8-9` | `tests/auth-unavailable.test.ts`: 307 with the auth env |
| Without the auth env, sign-in surfaces answer 503 | `proxy.ts:47-51` + `lib/env-validate.ts` (`isAuthConfigured`) + `lib/auth-unavailable.ts`; handler: `app/api/auth/[...nextauth]/route.ts` | `tests/auth-unavailable.test.ts`; local `next start` without env |
| COOP/COEP cross-origin isolation on every route | `next.config.ts:11-18` + `lib/security-headers.ts:68-69` | `tests/security-headers.test.ts`; browser: `window.crossOriginIsolated === true` |
| CSP reports reach `/api/csp-report` | `lib/security-headers.ts:62-63` (`report-uri`, `report-to`) + Reporting-Endpoints header + `app/api/csp-report/route.ts` | `tests/csp-report.test.ts`, `tests/security-headers.test.ts` |
| No native modules / WASM Node limit | inherent to `@webcontainer/api` | documented limitation |

## Honesty notes

- The host app is Next.js 16; the template booted inside the WebContainer
  is Vite + React 18. Next.js is not run inside the WebContainer (its dev
  server is slow/unstable there, see `data/templates/vite-react.ts` header).
- No boot-time number is hardcoded in the UI. The only displayed timings come from
  `performance.now()` deltas measured live in the visitor's browser.
- The boot times in the README (cold 73.0 s, reset 47.0 s) were measured in one
  Chrome session on 2026-10-07 and are one machine's numbers.
