# Roadmap

## v0.1 — Landing + auth shell
- [x] Landing page at codecraft-ai.vercel.app
- [x] Dashboard with sidebar navigation
- [x] NextAuth v5 (Google + GitHub OAuth)
- [x] MongoDB + Prisma schema for projects
- [x] Docker + docker-compose setup

## v0.2 — Core IDE workspace
- [x] WebContainer boot integration (`modules/webcontainers/hooks/useWebContainer.ts`)
- [x] Monaco editor wiring (`modules/playground/components/playground-editor.tsx`)
- [x] Terminal pane with xterm.js (`modules/webcontainers/components/terminal.tsx`)
- [x] AI inline completions via monacopilot + Ollama (`/api/code-completion`)
- [x] Project persistence via Prisma + MongoDB

## v0.3 — Feature completeness
- [ ] Hosted AI fallback (OpenAI/Anthropic) for users without Ollama
- [ ] Project templates gallery
- [ ] Settings UI (theme, Ollama URL config)

## v1.0 — Production-ready
- [ ] Full Playwright E2E suite (route `/playground/[id]` propagation verified)
- [ ] Performance: project-size meter, memory pressure handling
- [ ] IndexedDB persistence layer (currently resets on tab close)

## Not planned (open issue first)
- Multiplayer / CRDTs — large lift, not in current scope
- Postgres swap from MongoDB
- Mobile UI