# Roadmap

## v0.1 — Current: Landing + auth shell
- [x] Landing page at codecraft-ai.vercel.app
- [x] Dashboard with sidebar navigation
- [x] NextAuth v5 (Google + GitHub OAuth)
- [x] MongoDB + Prisma schema for projects
- [x] Docker + docker-compose setup

## v0.2 — Core IDE workspace
- [ ] WebContainer boot integration module (`src/modules/webcontainers/`)
- [ ] File explorer pane (`src/modules/playground/components/playground-explorer`)
- [ ] Monaco editor wiring (`src/modules/playground/components/playground-editor`)
- [ ] Terminal pane with xterm.js
- [ ] AI inline completions via monacopilot + Ollama
- [ ] File save/load to IndexedDB VFS + MongoDB persistence

## v0.3 — Feature completeness
- [ ] Hosted AI fallback (OpenAI/Anthropic) for users without Ollama
- [ ] Project templates
- [ ] Settings UI

## v1.0 — Production-ready
- [ ] CI/CD with full test suite
- [ ] Performance: project-size meter, memory pressure handling
- [ ] Documentation: DEPLOY.md already covers Vercel/Caddy/Nginx headers

## Not planned (open issue first)
- Multiplayer / CRDTs — large lift, not in current scope
- Postgres swap from MongoDB
- Mobile UI