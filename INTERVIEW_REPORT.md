# Interview Report — Codecraft AI

## What I built

An in-browser IDE that runs real Node.js without a server. Monaco editor for code, xterm.js for shell, WebContainers for execution (V8 in a Service Worker, not an emulator), local Ollama for AI completions. Next.js 15 app with NextAuth v5 (Google + GitHub), Prisma + MongoDB for project persistence.

The app has two production surfaces: landing page at codecraft-ai.vercel.app, and `/playground/[id]` for authenticated project work.

## Two non-obvious decisions

**1. WebContainers instead of a code-execution server**

Most browser IDEs send code to a remote container (E.g., code-server, GitHub Codespaces). That means latency per keystroke, cost per container-hour, and a network dependency. WebContainers run V8 inside the browser tab — zero network latency for execution, zero cost for the server.

The hard constraint: WebContainers only work in Chromium. Firefox and Safari get a polite message explaining the limitation. I decided this was acceptable because the target user ("developer who wants a self-hosted browser IDE") is almost certainly on Chrome/Edge/Brave. Not fighting this constraint saved weeks of cross-browser polyfill work.

**2. `/api/code-completion` routes to localhost:11434, not OpenAI**

If the completion endpoint called an external API (OpenAI, Anthropic), it would add latency and require users to have an API key. Calling Ollama at `localhost:11434` means completions are free and sub-100ms — but only if Ollama is installed. The route handles the "Ollama not running" case gracefully: returns `"// AI suggestion unavailable"` and logs it. The editor keeps working without AI.

The fallback design was important. In development, I kept hitting "Ollama not running" during testing, and every time it crashed the editor. The graceful degradation meant I could test all other features without Ollama running.

## What I'd change

**The `/playground/[id]` route deployment** — I added the route in Phase 1 but Vercel hadn't propagated it before the Phase 2 E2E tests ran. In retrospect, I'd have deployed the route to a staging URL first and run Playwright against that before calling Phase 2 done. The skip in CI is a band-aid; the real fix is a pre-deploy smoke test that validates the route exists before merging.

**Auth callback design** — The current NextAuth v5 config handles Google and GitHub OAuth. Account linking (when the same email has both Google and GitHub providers) uses a manual upsert pattern in `auth.ts:53-74` that's more complex than NextAuth's built-in `linkAccount`. I'd look at whether NextAuth v5's `linkAccount` callback handles multi-provider linking automatically before writing custom upsert logic.

## What I learned

WebContainers are a genuinely different execution model. I expected them to behave like Docker but in the browser — instead they're more like a client-side Node.js runtime with an async process API. Spawning a shell, piping stdin, handling resize events — none of that maps 1:1 to a Docker container. The `PtyService` wrapper in `terminal.tsx` was where most of the complexity lived.

Also: NextAuth v5 has different callback signatures than v4. The `signIn` → `session` → `jwt` flow changed, and the `account.session_state` field that worked in v4 requires `@ts-expect-error` in v5. Not a bug — just a version migration that needs explicit handling.

## Source reference

- Primary integration: `modules/webcontainers/hooks/useWebContainer.ts:19-58`
- Terminal: `modules/webcontainers/components/terminal.tsx` (510 lines)
- Code completion route: `app/api/code-completion/route.ts:47-92`
- Auth callbacks: `auth.ts:24-90`
