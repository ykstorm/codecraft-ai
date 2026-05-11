# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-05-11

### Added
- Vitest unit test suite — 23 tests passing across 3 test files
  - `tests/env-validate.test.ts` — 8 tests for env var validation logic
  - `tests/ratelimit.test.ts` — 7 tests for sliding-window rate limiter
  - `tests/utils.test.ts` — 8 tests for `cn()` clsx utility
- `vitest.config.ts` — Node environment, V8 coverage, 70% threshold
- `tests/` directory — `npm run test` now works out of the box

### Changed
- `package.json` scripts — added `test`, `test:watch`, `test:coverage`

### Security
- Rate limiter documented as in-memory (not for production multi-instance deployments)
- Production recommendation: `@upstash/ratelimit` + `@upstash/redis` or Upstash Redis for Vercel deployment