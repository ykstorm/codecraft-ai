# Contributing to Codecraft

## Dev setup

```bash
git clone https://github.com/ykstorm/codecraft-ai && cd codecraft-ai
npm install
cp .env.example .env.local
# MongoDB (only needed for /dashboard, /settings, and auth):
#   docker run -d -p 27017:27017 mongo:7
npm run dev
```

The landing page and the playground need no secrets — open
`http://localhost:3000/playground/vite-react-starter`.

## What's in scope

- Monaco editor integration, xterm.js terminal, WebContainer boot/shutdown
- The Vite + React playground template and the snapshot cache
- Project save/load via Prisma + MongoDB
- Auth (NextAuth v5 with Google + GitHub OAuth)

## What's NOT in scope (open an issue first)

- Multiplayer / CRDTs
- Postgres migration from MongoDB
- Mobile UI

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## PR checklist

- `npm run lint -- --fix`
- `npx tsc --noEmit` is clean
- `npm run build` succeeds
- CI green (lint, typecheck, test, smoke, audit)
- New tests for any new behavior

## Issues

Use the bug report template. For feature requests, describe the problem you hit
and the solution you expect.
