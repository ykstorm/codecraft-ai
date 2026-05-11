import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit } from '../lib/ratelimit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the in-memory store between tests
    // We access internals by calling checkRateLimit and checking reset behavior
  })

  it('allows first request within window', () => {
    const ip = '192.168.1.100'
    const result = checkRateLimit(ip)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(19) // 20 - 1
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('counts up within sliding window', () => {
    const ip = '192.168.1.101'
    // First request
    const r1 = checkRateLimit(ip)
    expect(r1.remaining).toBe(19)
    // Second request
    const r2 = checkRateLimit(ip)
    expect(r2.remaining).toBe(18)
  })

  it('blocks when limit exceeded', () => {
    const ip = '192.168.1.102'
    // Exhaust the limit
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip)
    }
    // 21st request
    const result = checkRateLimit(ip)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns resetAt timestamp', () => {
    const ip = '192.168.1.103'
    const result = checkRateLimit(ip)
    expect(result.resetAt).toBeDefined()
    expect(result.resetAt).toBeGreaterThan(Date.now())
    expect(result.resetAt - Date.now()).toBeLessThanOrEqual(60_000)
  })

  it('isolates limits per IP address', () => {
    const ip1 = '10.0.0.1'
    const ip2 = '10.0.0.2'

    // Exhaust ip1
    for (let i = 0; i < 20; i++) checkRateLimit(ip1)

    // ip2 should still be allowed
    const result = checkRateLimit(ip2)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(19)
  })

  it('handles rapid successive calls', () => {
    const ip = '10.0.1.1'
    const results = []
    for (let i = 0; i < 5; i++) {
      results.push(checkRateLimit(ip))
    }
    expect(results.every(r => r.success)).toBe(true)
    expect(results[results.length - 1].remaining).toBe(15)
  })

  it('reports decreasing remaining count', () => {
    const ip = '10.0.2.1'
    const r1 = checkRateLimit(ip)
    const r2 = checkRateLimit(ip)
    const r3 = checkRateLimit(ip)
    expect(r1.remaining - r2.remaining).toBe(1)
    expect(r2.remaining - r3.remaining).toBe(1)
  })
})