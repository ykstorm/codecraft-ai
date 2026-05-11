import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateEnv, assertEnv } from '../lib/env-validate'

describe('validateEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns valid when all required vars are present', () => {
    vi.stubEnv('AUTH_SECRET', 'secret-value')
    vi.stubEnv('AUTH_GITHUB_ID', 'github-id')
    vi.stubEnv('AUTH_GOOGLE_ID', 'google-id')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test')

    const result = validateEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns invalid with list of missing variables', () => {
    vi.stubEnv('AUTH_SECRET', '')
    vi.stubEnv('AUTH_GITHUB_ID', 'github-id')
    vi.stubEnv('AUTH_GOOGLE_ID', 'google-id')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test')

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
    expect(result.missing).toHaveLength(1)
  })

  it('detects multiple missing variables', () => {
    vi.stubEnv('AUTH_SECRET', '  ')  // whitespace only — trimmed to empty
    vi.stubEnv('AUTH_GITHUB_ID', '')
    vi.stubEnv('AUTH_GOOGLE_ID', 'google-id')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost')

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
    expect(result.missing).toContain('AUTH_GITHUB_ID')
    expect(result.missing).toHaveLength(2)
  })

  it('treats whitespace-only values as missing', () => {
    vi.stubEnv('AUTH_SECRET', '   ')
    vi.stubEnv('AUTH_GITHUB_ID', 'valid')
    vi.stubEnv('AUTH_GOOGLE_ID', 'valid')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost')

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
  })

  it('flags unset vars as missing', () => {
    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
    expect(result.missing).toContain('AUTH_GITHUB_ID')
    expect(result.missing).toContain('AUTH_GOOGLE_ID')
    expect(result.missing).toContain('DATABASE_URL')
  })
})

describe('assertEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not throw when all vars present', () => {
    vi.stubEnv('AUTH_SECRET', 'secret')
    vi.stubEnv('AUTH_GITHUB_ID', 'id')
    vi.stubEnv('AUTH_GOOGLE_ID', 'id')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost')

    expect(assertEnv).not.toThrow()
  })

  it('throws with descriptive message listing missing vars', () => {
    vi.stubEnv('AUTH_SECRET', '')
    vi.stubEnv('AUTH_GITHUB_ID', 'id')
    vi.stubEnv('AUTH_GOOGLE_ID', 'id')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost')

    expect(assertEnv).toThrow('Missing required environment variables: AUTH_SECRET')
  })

  it('lists all missing vars in one message', () => {
    vi.stubEnv('AUTH_SECRET', '')
    vi.stubEnv('AUTH_GITHUB_ID', '')
    vi.stubEnv('AUTH_GOOGLE_ID', 'google')
    vi.stubEnv('DATABASE_URL', '')

    expect(assertEnv).toThrow('AUTH_SECRET, AUTH_GITHUB_ID, DATABASE_URL')
  })
})