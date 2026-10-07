import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from '../app/api/csp-report/route'
import { MAX_REPORT_BYTES, summarizeCspReports } from '../lib/csp-report'

const REPORT_URI_BODY = {
  'csp-report': {
    'document-uri': 'https://codecraft.example/playground/vite-react-starter?code=secret',
    'effective-directive': 'frame-src',
    'blocked-uri': 'https://stackblitz.com/headless?version=1.6.4',
    disposition: 'report',
    'script-sample': 'alert(1)',
  },
}

const REPORTING_API_BODY = [
  {
    type: 'csp-violation',
    url: 'https://codecraft.example/',
    body: {
      documentURL: 'https://codecraft.example/',
      effectiveDirective: 'script-src-elem',
      blockedURL: 'inline',
      disposition: 'report',
    },
  },
  { type: 'deprecation', body: { id: 'x' } },
]

function post(body: string, headers: Record<string, string> = {}) {
  return POST(
    new Request('https://codecraft.example/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': 'application/csp-report', ...headers },
      body,
    })
  )
}

describe('summarizeCspReports', () => {
  it('reads the report-uri shape and keeps only origin and path', () => {
    expect(summarizeCspReports(REPORT_URI_BODY)).toEqual([
      {
        directive: 'frame-src',
        blocked: 'https://stackblitz.com',
        page: '/playground/vite-react-starter',
        disposition: 'report',
      },
    ])
  })

  it('reads the Reporting API shape and skips other report types', () => {
    expect(summarizeCspReports(REPORTING_API_BODY)).toEqual([
      { directive: 'script-src-elem', blocked: 'inline', page: '/', disposition: 'report' },
    ])
  })

  it('returns nothing for bodies that are not CSP reports', () => {
    expect(summarizeCspReports({ hello: 'world' })).toEqual([])
    expect(summarizeCspReports([{ type: 'csp-violation', body: {} }])).toEqual([])
    expect(summarizeCspReports('csp')).toEqual([])
  })
})

describe('POST /api/csp-report', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs one short line per report and answers 204', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await post(JSON.stringify(REPORT_URI_BODY))

    expect(res.status).toBe(204)
    expect(warn).toHaveBeenCalledTimes(1)
    const line = String(warn.mock.calls[0][0])
    expect(line).toContain('"directive":"frame-src"')
    expect(line).not.toContain('secret')
    expect(line).not.toContain('alert(1)')
  })

  it('refuses a body that declares more than 8 KB without reading it', async () => {
    const res = await post('{}', { 'content-length': String(MAX_REPORT_BYTES + 1) })
    expect(res.status).toBe(413)
  })

  it('refuses a body over 8 KB that declares no length', async () => {
    const big = JSON.stringify({ 'csp-report': { pad: 'x'.repeat(MAX_REPORT_BYTES) } })
    const res = await post(big)
    expect(res.status).toBe(413)
  })

  it('answers 400 to JSON that is not a report and to broken JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect((await post('{"hello":"world"}')).status).toBe(400)
    expect((await post('{not json')).status).toBe(400)
    expect(warn).not.toHaveBeenCalled()
  })
})
