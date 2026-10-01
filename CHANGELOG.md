# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security
- Sandboxed the preview iframe, moved all HTTP headers to a single source
  (`lib/security-headers.ts`) with a report-only CSP, self-hosted Monaco (no
  CDN), and closed the open `next/image` remote proxy.
- Bounded the WebContainer runtime (install timeout, snapshot size/quota guard,
  process cleanup on unmount).
- Removed the unauthenticated Ollama chat/completion routes and the in-memory
  rate limiter.
- Hardened the sign-in callback and made the root layout static.
- Pinned the Docker base image and GitHub Actions; added prod-dependency
  auditing to CI and patched high/critical advisories.

### Changed
- Documentation rewritten to match the shipped code (one Vite + React template;
  no AI chat, inline completions, or four-mode assistant). Removed `SPEC.md` and
  `ROADMAP.md`.

### Removed
- `tests/ratelimit.test.ts` (the rate limiter it covered was deleted).

## [1.0.1] - 2026-05-11

### Added
- Vitest unit test suite — 16 tests across 2 files
  - `tests/env-validate.test.ts` — 8 tests for env var validation logic
  - `tests/utils.test.ts` — 8 tests for the `cn()` clsx utility
- `vitest.config.ts` — Node environment, V8 coverage
- `tests/` directory — `npm run test` works out of the box

### Changed
- `package.json` scripts — added `test`, `test:watch`, `test:coverage`
