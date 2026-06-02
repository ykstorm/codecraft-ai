# Contributing to Codecraft

## Dev setup

```bash
git clone https://github.com/ykstorm/codecraft-ai && cd codecraft-ai
npm install
cp .env.example .env.local
# Ollama: ollama serve && ollama pull qwen2.5-coder
# MongoDB: docker run -d -p 27017:27017 mongo:7
npm run dev
```

## What's in scope

- Monaco editor integration, xterm.js terminal, WebContainer boot/shutdown
- AI completions via local Ollama
- Project save/load via Prisma + MongoDB
- Auth (NextAuth v5 with Google + GitHub OAuth)

## What's NOT in scope (open an issue first)

- Multiplayer / CRDTs
- Cloud AI fallbacks (OpenAI/Anthropic)
- Postgres migration from MongoDB
- Mobile UI

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## PR checklist

- `npm run lint -- --fix`
- `npm run build` succeeds
- CI green on all three jobs (lint, typecheck, test)
- New tests for any new behavior

## Issues

Use the bug report template. For feature requests, describe the problem you hit and the solution you expect.