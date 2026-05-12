# CodeCraft AI — Interview Report

## What I built

Chai Vibe Editor (CodeCraft AI) is a browser-based IDE that runs real Node.js in the browser via WebContainers — no server-side compute for code execution. The entire runtime lives in a Service Worker using V8, the same engine that powers Node.js. You can `npm install` packages, run a dev server, and see output — all inside a browser tab.

The project name "Chai Vibe" came from the vibe I wanted: building software should feel casual, not corporate. The IDE should feel like a comfortable workspace, not a clinical tool.

---

## Why I built it

I wanted to understand how WebContainers actually work. Most tutorials show toy examples — I wanted to build something real with it. The Monaco Editor integration, the xterm.js terminal sharing, the Ollama AI chat — these are all things that could fail in subtle ways and I wanted to know what broke and how to fix it.

The CC4270 major project at Manipal University gave me the perfect excuse. My supervisor (Mr. Jitendra Singh Yadav) approved it as my major project. It's been through a full academic review cycle, so the architecture decisions are documented and defended.

---

## The hardest part — Monaco + xterm coexistence

You can't just drop Monaco and xterm on the same page and expect them to work together. Both want keyboard input. Monaco handles editor keystrokes, xterm handles terminal raw input — and they're on the same DOM surface.

The trick: Monaco never gets direct keyboard access to the terminal pane. xterm sits at a lower z-index, Monaco at a higher one. When the user is editing a file, Monaco captures keystrokes. When they click the terminal, a state flag switches and xterm takes over.

For the AI inline completions, I had to position the suggestion at the cursor and trigger via `Ctrl+Space` or double-Enter. The inline completion provider checks cursor position against the last suggestion position — if they don't match (within a tolerance of 2 columns), it returns empty completions. This prevents ghost suggestions from showing up when the user moves the cursor away.

---

## The second hardest part — WebContainer initialization

`WebContainer.boot()` is async. On first load, it downloads ~10MB of runtime files and caches them in the Service Worker. During that download, the UI needs to show a loading state — but the boot doesn't give progress callbacks.

I handled it with a mount check: boot → mount initial template files → check if mount succeeded. If mount fails, show an error. If it succeeds, the WebContainer is ready. The boot itself can fail if the Service Worker isn't available (private browsing mode, browsers that block SW) — that error surfaces as a toast in the UI.

---

## Ollama integration and the fallback problem

Ollama runs locally. If it's not installed, the chat features don't work. I could have crashed the app on startup if Ollama wasn't available — but that's bad UX. So I made Ollama connectivity a warning, not a fatal error.

The `/api/chat` route tries Ollama first. If it fails (connection refused, model not found), it throws and the route returns a 500. The chat UI shows the error to the user. Ollama failures are logged to console — not to Sentry or any external APM since there's no server-side error tracking in this project.

The 4 modes (chat/review/fix/optimize) each have their own system prompt injected into the Ollama request. The temperature and max_tokens settings are the same across all modes — that was a deliberate tradeoff. I could have tuned per-mode but the difference wasn't significant enough to justify the complexity.

---

## What I'd change

**The file explorer sync** — right now the file tree in the Monaco sidebar and the WebContainer file system are synced on file creation/deletion. But file renames require a full tree re-mount. A watch-based approach would be cleaner.

**The AI fallback** — right now there's no fallback to an external API if Ollama fails. The INTERVIEW_REPORT.md claims there's a Claude API fallback but that code isn't in the current codebase. I'd add a simple fallback: if Ollama returns an error, try OpenAI. That would make the chat more reliable in development environments without Ollama.

**MongoDB over Prisma** — Prisma's MongoDB support is... fine, but it's not as smooth as its PostgreSQL support. Some queries require raw `$runCommand` or manual aggregation pipelines that Prisma can't express as type-safe queries. I'd switch to a native MongoDB driver for the next version.

---

## What I learned

**Service Worker architecture** — WebContainers run inside a Service Worker, which has different constraints than a normal browser context. You can't access `window`, you can't use certain browser APIs, and the cold start behavior is different. This was my first time building something that lives in a SW, and it changed how I think about client-side architecture.

**Inline completion providers in Monaco** — Monaco's inline completions API is powerful but under-documented. The `provideInlineCompletions` function gets called on every keystroke — if you're not careful about filtering (cursor position, context, suggestion validity), you'll get flicker or ghost completions. I learned to cache the current suggestion state and compare positions before returning items.

**Docker Compose for local development** — separating Ollama into its own container with GPU access makes local development realistic. Without GPU access in Docker, Ollama falls back to CPU inference which is slow enough that the AI features feel unusable. The docker-compose.yml exposes NVIDIA GPU capabilities to the Ollama container.

---

## Numbers that matter

- 23 tests passing (env validation, rate limiting, utility functions)
- 3 test files (env-validate, ratelimit, utils)
- WebContainers runtime: ~10MB on first load, cached
- Rate limit: 20 requests/minute per IP (sliding window)
- Docker health checks: 30s interval, 3 retries, 10s timeout
- No test coverage for AI chat routes or WebContainer mount behavior

---

## For the interview

Be ready to explain:
- How WebContainers differ from WASM or remote execution (answer: V8 engine in a Service Worker, not emulation or server-side)
- The Monaco + xterm layered DOM approach (answer: z-index switching based on focus state)
- The Ollama fallback chain (answer: try local first, surface error to user, don't crash app)
- Why NextAuth v5 with JWT (answer: stateless sessions work better for client-side apps)

This project lives at: github.com/ykstorm/codecraft-ai