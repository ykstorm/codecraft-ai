# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- The snapshot restore: the hook exported the whole container filesystem and
  mounted it into the project folder, so return visits failed. It now exports
  the project folder without `node_modules/.vite`, mounts it back in place, and
  drops stored snapshots of the old layout.
- A dev server that exits now shows an error with its last lines, and a boot
  that has not started after 60 s fails with a message instead of waiting.

### Security
- The report-only CSP allows the WebContainer boot frame
  (`https://stackblitz.com`) and sends violation reports to `/api/csp-report`.
- Without the auth variables, sign-in pages and `/api/auth/*` answer 503
  instead of 500, and the landing header hides the dashboard link.
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
- Two duplicate `cn()` tests in `tests/utils.test.ts`, which left 14 unit tests.

### Tests
- 76 unit tests in 8 files: the snapshot paths and budget, the dev server exit
  report, the boot timeout, the security headers, the CSP report route, the auth
  env check and the proxy's 503 answers, alongside the existing env and `cn()`
  tests.

## [1.0.1] - 2026-05-11

### Added
- Vitest unit test suite — 16 tests across 2 files
  - `tests/env-validate.test.ts` — 8 tests for env var validation logic
  - `tests/utils.test.ts` — 8 tests for the `cn()` clsx utility
- `vitest.config.ts` — Node environment, V8 coverage
- `tests/` directory — `npm run test` works out of the box

### Changed
- `package.json` scripts — added `test`, `test:watch`, `test:coverage`
