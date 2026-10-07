import { describe, it, expect } from 'vitest'
import { CSP_REPORT_PATH, securityHeaders } from '../lib/security-headers'

function header(key: string): string | undefined {
  return securityHeaders.find((h) => h.key === key)?.value
}

/** "a x y; b z" becomes { a: ['x', 'y'], b: ['z'] }. */
function directives(policy: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const part of policy.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/)
    if (name) out[name] = values
  }
  return out
}

const csp = directives(header('Content-Security-Policy-Report-Only') ?? '')

describe('security headers', () => {
  it('keeps cross-origin isolation exactly as it was', () => {
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(header('Cross-Origin-Embedder-Policy')).toBe('require-corp')
    expect(header('Cross-Origin-Resource-Policy')).toBe('cross-origin')
  })

  it('sends the CSP report-only, not enforced', () => {
    expect(header('Content-Security-Policy')).toBeUndefined()
    expect(Object.keys(csp).length).toBeGreaterThan(5)
  })

  it('lets the WebContainer boot frame and preview load in frame-src', () => {
    expect(csp['frame-src']).toEqual([
      "'self'",
      'https://stackblitz.com',
      'https://*.webcontainer-api.io',
      'https://*.staticblitz.com',
    ])
  })

  it('has no child-src, so frame-src alone governs frames', () => {
    expect(csp['child-src']).toBeUndefined()
  })

  it('sends violation reports to the report route', () => {
    expect(CSP_REPORT_PATH).toBe('/api/csp-report')
    expect(csp['report-uri']).toEqual(['/api/csp-report'])
    expect(csp['report-to']).toEqual(['csp-endpoint'])
    expect(header('Reporting-Endpoints')).toBe('csp-endpoint="/api/csp-report"')
  })

  it('still forbids plugins and being framed', () => {
    expect(csp['object-src']).toEqual(["'none'"])
    expect(csp['frame-ancestors']).toEqual(["'none'"])
    expect(header('X-Frame-Options')).toBe('DENY')
  })
})
