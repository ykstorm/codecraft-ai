# SPEC.md — Codecraft AI

> Verify every claim against actual code before committing.

---

## Problem it solves

Browser-based IDEs traditionally either run code on remote servers (slow, expensive latency) or use emulators that can't handle real `npm install` + `node` workflows. Codecraft runs entirely in the browser tab — real Node.js via WebContainers (V8 Service Worker), Monaco editor for editing, xterm.js for shell, local Ollama for AI completions. No cloud roundtrip for code execution.

## What it is

Self-hostable in-browser IDE with four primary surfaces:
1. Monaco editor with AI inline completions (Tab to accept, Escape to dismiss)
2. xterm.js terminal connected to WebContainer shell (full Node.js, not emulator)
3. AI chat sidebar with 4 modes: chat / review / fix / optimize
4. Project management (create, list, edit, delete, star)

Stack: Next.js 15 · Monaco · @webcontainer/api · xterm.js · Ollama (local LLM) · NextAuth v5 (Google + GitHub) · Prisma + MongoDB · Docker + Vercel

## Verified in code

| Feature | Location |
|---|---|
| WebContainer boot + file system mount + npm install + node | `modules/webcontainers/hooks/useWebContainer.ts` |
| xterm.js terminal with keyboard input, command history (↑↓), Ctrl+C, resize, copy/download | `modules/webcontainers/components/terminal.tsx` |
| AI completions via monacopilot → `/api/code-completion` → Ollama codellama | `modules/playground/hooks/useAISuggestion.tsx` + `app/api/code-completion/route.ts` |
| 4-mode AI chat | `app/api/chat/route.ts` |
| NextAuth v5 with Google + GitHub OAuth | `auth.ts` |
| Prisma + MongoDB for project/user data | `lib/db.ts` |
| Per-IP rate limiting (20 req/min sliding window) | `lib/ratelimit.ts` |
| Health endpoint `/api/health` | `app/api/health/route.ts` |
| Docker Compose: app + ollama + mongodb | `docker-compose.yml` |

## Design decisions

1. **WebContainers for execution (not a server)** — The WebContainer API runs V8 inside a Service Worker in the browser tab. This means real `node`, real `npm install`, real processes. The tradeoff: WebContainers require Chromium-based browsers. Firefox/Safari won't work. This is a hard constraint, not a bug.

2. **Local Ollama for completions (not OpenAI API)** — AI suggestions come from `localhost:11434` running Ollama. No external API calls means zero latency and zero cost for completions. The tradeoff: requires Ollama installed locally. If Ollama is unreachable, `/api/code-completion` returns `"// AI suggestion unavailable"` gracefully — the editor still works without AI.

3. **Idempotent upserts via Prisma** — Playground creation uses `upsert` (no duplicate projects for same user+title). Auth callbacks handle account linking correctly.

## Hardest part

`modules/webcontainers/components/terminal.tsx:43` — connecting xterm.js to WebContainer shell was non-trivial because WebContainer's `spawn` produces a process with stdin/stdout streams that xterm needs raw binary access to. The solution uses a `PtyService` wrapper that converts WebContainer process I/O into xterm-compatible UTF-8 streams, with command history stored in `useRef` across renders.

## Out of scope

- Mobile/tablet support (WebContainers require desktop browser)
- Collaborative editing (multiplayer)
- Persistent file storage beyond IndexedDB (VFS resets on tab close — no persistence layer yet)
- Cloud deployment of WebContainers (not architecturally possible — runs client-side)
- Non-Chromium browser support
