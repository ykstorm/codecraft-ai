import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateEnv, assertEnv, isAuthConfigured } from '../lib/env-validate'

const ALL = {
  AUTH_SECRET: 'secret-value',
  AUTH_GITHUB_ID: 'github-id',
  AUTH_GITHUB_SECRET: 'github-secret',
  AUTH_GOOGLE_ID: 'google-id',
  AUTH_GOOGLE_SECRET: 'google-secret',
  DATABASE_URL: 'mongodb://localhost:27017/test',
}

/** Stub every required variable, then apply the overrides. */
function stubAll(overrides: Partial<Record<keyof typeof ALL, string>> = {}) {
  for (const [name, value] of Object.entries({ ...ALL, ...overrides })) {
    vi.stubEnv(name, value)
  }
}

describe('validateEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns valid when all required vars are present', () => {
    stubAll()

    const result = validateEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns invalid with list of missing variables', () => {
    stubAll({ AUTH_SECRET: '' })

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
    expect(result.missing).toHaveLength(1)
  })

  it('detects multiple missing variables', () => {
    stubAll({ AUTH_SECRET: '  ', AUTH_GITHUB_ID: '' }) // whitespace only, trimmed to empty

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
    expect(result.missing).toContain('AUTH_GITHUB_ID')
    expect(result.missing).toHaveLength(2)
  })

  it('treats whitespace-only values as missing', () => {
    stubAll({ AUTH_SECRET: '   ' })

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('AUTH_SECRET')
  })

  it('requires the provider secrets, not only the ids', () => {
    stubAll({ AUTH_GITHUB_SECRET: '', AUTH_GOOGLE_SECRET: '' })

    expect(validateEnv().missing).toEqual(['AUTH_GITHUB_SECRET', 'AUTH_GOOGLE_SECRET'])
  })

  it('flags unset vars as missing', () => {
    // Ensure all required env vars are unset (not just empty string)
    for (const name of Object.keys(ALL)) delete process.env[name]

    const result = validateEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toEqual(Object.keys(ALL))
  })

  it('reads an env object when one is given', () => {
    expect(validateEnv(ALL).valid).toBe(true)
    expect(validateEnv({}).missing).toHaveLength(6)
  })
})

describe('isAuthConfigured', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false on a deployment with no variables', () => {
    expect(isAuthConfigured({})).toBe(false)
  })

  it('is false when any one variable is missing or blank', () => {
    for (const name of Object.keys(ALL)) {
      expect(isAuthConfigured({ ...ALL, [name]: '' })).toBe(false)
      expect(isAuthConfigured({ ...ALL, [name]: ' ' })).toBe(false)
    }
  })

  it('is true when all six are set', () => {
    expect(isAuthConfigured(ALL)).toBe(true)
  })

  it('reads process.env by default', () => {
    stubAll()
    expect(isAuthConfigured()).toBe(true)
    vi.stubEnv('DATABASE_URL', '')
    expect(isAuthConfigured()).toBe(false)
  })
})

describe('assertEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not throw when all vars present', () => {
    stubAll()

    expect(assertEnv).not.toThrow()
  })

  it('throws with descriptive message listing missing vars', () => {
    stubAll({ AUTH_SECRET: '' })

    expect(assertEnv).toThrow('Missing required environment variables: AUTH_SECRET')
  })

  it('lists all missing vars in one message', () => {
    stubAll({ AUTH_SECRET: '', AUTH_GITHUB_ID: '', DATABASE_URL: '' })

    expect(assertEnv).toThrow('AUTH_SECRET, AUTH_GITHUB_ID, DATABASE_URL')
  })
})
