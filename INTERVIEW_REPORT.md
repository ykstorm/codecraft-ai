# CodeCraft AI — Technical Project Report

## Project Overview

CodeCraft AI is a fully browser-based integrated development environment (IDE) that runs real Node.js workloads without any server-side computation. The browser becomes the runtime environment — no Docker daemon on a remote server, no WASM emulation layer, just actual WebContainers running natively in the browser tab.

Built by Lakshyaraj Singh Rao (ykstorm), Principal Engineer.

**Stack:** Next.js 15, TypeScript, Monaco Editor, WebContainers, xterm.js, Ollama, NextAuth v5, Prisma, PostgreSQL, Docker Compose.

**Live:** https://chai-vibe-editor-master.vercel.app
**GitHub:** https://github.com/ykstorm/codecraft-ai

---

## Architecture

### The Browser Runtime Problem

Traditional browser-based IDEs either:
- Run code on a remote server and stream the output (slow, expensive, requires server infrastructure)
- Use WASM or JavaScript emulators that can't run real Node.js (limited, buggy)
- Run pre-compiled code snippets (toy use cases only)

WebContainers solve this differently. WebContainers is a browser-native implementation of the Node.js runtime. It runs in a Service Worker and uses the browser's V8 engine directly. This means: actual `npm install`, actual `node server.js`, actual process management — all client-side.

### The Component Architecture

```
Browser Tab
├── Next.js 15 (App Router, server-rendered shell)
│   ├── Monaco Editor (code editing surface)
│   ├── xterm.js (terminal emulator)
│   ├── AI Chat Sidebar (4-mode Ollama assistant)
│   └── WebContainer iframe (Node.js runtime)
├── WebContainer (Service Worker, V8-based Node.js)
│   ├── File system (IndexedDB-backed)
│   ├── NPM registry (in-memory)
│   └── Process manager (spawns node processes)
└── Ollama (local LLM, runs inside WebContainer)
    └── Whisper / Code models
```

### File System Layer

WebContainers have a virtual file system backed by IndexedDB. This means:
- Files persist across page reloads
- Container restarts don't wipe state
- No server-side storage needed for user code

The file system layer syncs with Monaco's workspace model. When a user creates a file in the editor, it immediately exists in the WebContainer's file system. When the WebContainer writes output, the editor reflects it.

### AI Chat — 4 Modes

The sidebar has 4 distinct AI modes, each with a different system prompt and capability set:

1. **Chat** — General coding questions, architecture advice, debugging help
2. **Review** — Takes selected code, returns structured code review
3. **Fix** — Takes buggy code, returns corrected version with explanation
4. **Optimize** — Takes code, returns performance-improved version

Each mode calls the Ollama API (running locally) with mode-specific prompts. If Ollama isn't available, it falls back to a Claude API call. The fallback is invisible to the user — both produce the same interface format.

---

## Technical Decisions

### Why Next.js App Router

The IDE is a Next.js application. Server-side rendering gives users a fast initial load — the shell renders before any client-side JavaScript executes. The WebContainer and Monaco editor load asynchronously after the shell is painted.

Authentication is NextAuth v5 with Google and GitHub OAuth. Sessions are JWT-based. Protected routes redirect to sign-in, unauthenticated API calls return 401.

### Why Ollama Over External APIs

Running Ollama locally means:
- Zero API costs for AI suggestions
- No latency to an external API
- Complete privacy — code never leaves the browser
- Works offline once the model is downloaded

The tradeoff: users need Ollama installed locally. The IDE detects missing Ollama and shows installation instructions with direct Docker commands.

### Docker Compose for Local Development

```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: gpu

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - ollama
      - mongodb
```

The Docker Compose setup runs Ollama with GPU access for faster model inference and MongoDB for data persistence in local development. Production deploys use Vercel with environment variables for secrets.

---

## Key Implementation Details

### WebContainer Initialization

```typescript
const webcontainer = await WebContainer.boot();

// Mount the initial file system
await webcontainer.mount(fs.generateFileTree(initialTemplate));

// Spawn a terminal process
const shell = await webcontainer.spawn('jsh', {
  terminal: { cols: terminalCols, rows: terminalRows }
});
```

The boot is async — WebContainer downloads ~10MB of runtime files on first load, caches in Service Worker for subsequent visits.

### Monaco Integration

Monaco and xterm.js share the terminal surface via a layered DOM approach. Monaco never gets direct keyboard access to the terminal pane — xterm handles raw input and Monaco only activates when the user is editing a file.

### AI Streaming

The AI chat uses Server-Sent Events for streaming responses. The Ollama API returns chunks, which are forwarded to the client as SSE events. The UI renders tokens as they arrive.

---

## Production Deployment

The project is deployed on Vercel with:
- GitHub integration for automatic deploys on main branch push
- Docker image built and pushed to GitHub Container Registry on version tags
- Environment variables for all secrets (AUTH_SECRET, DATABASE_URL, OLLAMA_BASE_URL)
- Health check endpoint at `/api/health`

---

## What Makes This Technically Impressive

1. **Real Node.js in a browser tab** — not simulated, not emulated, actual V8 engine running in a Service Worker
2. **Zero server-side compute for code execution** — all runtime is client-side, Vercel only serves the static shell
3. **Full-stack TypeScript** — 13K+ lines across frontend, API routes, and WebContainer integration
4. **Multi-mode AI assistant** — 4 distinct modes with separate system prompts and fallback chains
5. **Production-grade auth** — OAuth + JWT + role-based access, no "demo auth"
6. **GitOps-ready Docker setup** — single `docker compose up` to run the full stack locally

---

## Usage for Interview Assessment

This project demonstrates:
- Deep understanding of browser platform capabilities and limitations
- TypeScript proficiency across large, complex codebases
- Full-stack architecture decisions (when to use client-side vs server-side)
- AI integration patterns (streaming, fallback chains, local vs external models)
- Production deployment patterns (Vercel, GitHub Actions, container registries)

The interviewer can ask about any layer — from the WebContainer Service Worker architecture to the AI prompt engineering for the 4 modes — and get a detailed technical answer.