import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { sep } from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, type NextFetchEvent } from 'next/server'

import { AUTH_UNAVAILABLE_MESSAGE, authUnavailableResponse } from '../lib/auth-unavailable'
import { isPublicRoute, needsSignIn } from '../routes'

// The proxy wraps its gate in Auth.js. Stand in for it with a wrapper that
// sees no session, so the test exercises only the proxy's own decisions.
vi.mock('next-auth', () => ({
  default: () => ({
    auth:
      (gate: (req: NextRequest & { auth: null }) => unknown) =>
      (req: NextRequest) =>
        gate(Object.assign(req, { auth: null })),
  }),
}))
vi.mock('../auth.config', () => ({ default: { providers: [] } }))

const handlers = vi.hoisted(() => ({
  GET: vi.fn(async () => new Response('from auth.js')),
  POST: vi.fn(async () => new Response('from auth.js')),
}))
vi.mock('@/auth', () => ({ handlers }))

const AUTH_ENV = {
  AUTH_SECRET: 'secret',
  AUTH_GITHUB_ID: 'id',
  AUTH_GITHUB_SECRET: 'secret',
  AUTH_GOOGLE_ID: 'id',
  AUTH_GOOGLE_SECRET: 'secret',
  DATABASE_URL: 'mongodb://localhost:27017/test',
}

function configureAuth(on: boolean) {
  for (const [name, value] of Object.entries(AUTH_ENV)) vi.stubEnv(name, on ? value : '')
}

function request(path: string, method = 'GET') {
  return new NextRequest(new URL(path, 'https://codecraft.example'), { method })
}

const event = {} as NextFetchEvent

async function runProxy(path: string) {
  const { default: proxy } = await import('../proxy')
  return (await proxy(request(path), event)) as Response | null | undefined
}

describe('authUnavailableResponse', () => {
  it('is a plain HTML page with status 503 that is not cached', async () => {
    const res = authUnavailableResponse()
    expect(res.status).toBe(503)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toContain(AUTH_UNAVAILABLE_MESSAGE)
  })

  it('says sign-in is not configured', () => {
    expect(AUTH_UNAVAILABLE_MESSAGE).toBe('Sign-in is not configured on this deployment')
  })

  it('copies its colour and font tokens from app/globals.css without drift', async () => {
    // Every "--name: value" pair, whitespace collapsed, so line breaks do not count.
    const tokens = (css: string) =>
      [...css.matchAll(/(--[\w-]+):\s*([^;{}]+);/g)].map(([, name, value]) => `${name}: ${value.replace(/\s+/g, ' ').trim()}`)
    const page = await authUnavailableResponse().text()
    const style = page.match(/<style>([\s\S]*)<\/style>/)?.[1] ?? ''
    const copied = tokens(style)
    expect(copied.length).toBeGreaterThan(10)
    expect(tokens(readFileSync('app/globals.css', 'utf8'))).toEqual(expect.arrayContaining(copied))
  })
})

describe('isPublicRoute', () => {
  it('opens the landing page, the gallery, the playgrounds and the probes', () => {
    for (const path of ['/', '/playgrounds', '/playground/vite-react-starter', '/api/now', '/api/health', '/api/csp-report']) {
      expect(isPublicRoute(path)).toBe(true)
    }
  })

  it('keeps the gated pages and the auth routes closed', () => {
    for (const path of ['/dashboard', '/settings', '/auth/sign-in', '/api/auth/session', '/playgroundsx']) {
      expect(isPublicRoute(path)).toBe(false)
    }
  })
})

describe('needsSignIn', () => {
  it('covers the protected pages, the sign-in page and the auth API', () => {
    for (const path of ['/dashboard', '/dashboard/anything', '/settings', '/auth/sign-in', '/api/auth/session', '/api/auth/signin/github']) {
      expect(needsSignIn(path)).toBe(true)
    }
  })

  it('leaves the public paths and unknown paths alone', () => {
    for (const path of ['/', '/playgrounds', '/playground/vite-react-starter', '/api/now', '/foo', '/dashboardx', '/settingsx', '/api/authx']) {
      expect(needsSignIn(path)).toBe(false)
    }
  })

  it('leaves no page or route handler under app/ neither public nor behind sign-in', () => {
    // app/(root)/page.tsx -> "/", app/playground/[id]/page.tsx -> "/playground/id".
    const pages = readdirSync('app', { recursive: true })
      .map((file) => String(file).split(sep).join('/'))
      .filter((file) => /(^|\/)(page|route)\.tsx?$/.test(file))
      .map((file) => {
        const segments = file.split('/').slice(0, -1)
        const visible = segments.filter((segment) => !/^\(.*\)$/.test(segment))
        return '/' + visible.map((segment) => segment.replace(/^\[(?:\.{3})?(\w+)\]$/, '$1')).join('/')
      })
    expect(pages.length).toBeGreaterThan(5)
    // The proxy only sends the sign-in paths to the 503 page when auth is
    // missing, so a page missing from routes.ts would be served unguarded.
    expect(pages.filter((path) => !isPublicRoute(path) && !needsSignIn(path))).toEqual([])
  })
})

describe('proxy without the auth variables', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    configureAuth(false)
  })

  it.each(['/dashboard', '/settings', '/auth/sign-in', '/api/auth/session', '/api/auth/providers'])(
    'answers %s with the 503 page',
    async (path) => {
      const res = await runProxy(path)
      expect(res?.status).toBe(503)
      expect(await res?.text()).toContain(AUTH_UNAVAILABLE_MESSAGE)
    }
  )

  it.each(['/', '/playgrounds', '/playground/vite-react-starter', '/api/now'])(
    'lets the public path %s through',
    async (path) => {
      const res = await runProxy(path)
      expect(res?.headers.get('x-middleware-next')).toBe('1')
    }
  )
})

describe('proxy without the auth variables, unknown paths', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    configureAuth(false)
  })

  it.each(['/foo', '/foo/bar', '/dashboardx', '/api/authx'])(
    'passes %s through to Next, which answers 404 from app/not-found.tsx',
    async (path) => {
      const res = await runProxy(path)
      expect(res?.status).not.toBe(503)
      expect(res?.headers.get('x-middleware-next')).toBe('1')
      expect(existsSync('app/not-found.tsx')).toBe(true)
    }
  )

  it('keeps the 503 for everything under a protected page', async () => {
    const res = await runProxy('/dashboard/anything')
    expect(res?.status).toBe(503)
    expect(await res?.text()).toContain(AUTH_UNAVAILABLE_MESSAGE)
  })
})

describe('proxy with the auth variables', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    configureAuth(true)
  })

  it('sends a signed-out visitor from /dashboard to sign-in with 307', async () => {
    const res = await runProxy('/dashboard')
    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe('https://codecraft.example/auth/sign-in')
  })

  it('leaves /api/auth/* to Auth.js', async () => {
    expect(await runProxy('/api/auth/session')).toBeNull()
  })
})

describe('/api/auth/* route handler', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    handlers.GET.mockClear()
    handlers.POST.mockClear()
  })

  it('answers 503 itself when the variables are missing', async () => {
    configureAuth(false)
    const { GET, POST } = await import('../app/api/auth/[...nextauth]/route')

    expect((await GET(request('/api/auth/session'))).status).toBe(503)
    expect((await POST(request('/api/auth/signin/github', 'POST'))).status).toBe(503)
    expect(handlers.GET).not.toHaveBeenCalled()
    expect(handlers.POST).not.toHaveBeenCalled()
  })

  it('hands the request to Auth.js when they are set', async () => {
    configureAuth(true)
    const { GET } = await import('../app/api/auth/[...nextauth]/route')

    expect(await (await GET(request('/api/auth/session'))).text()).toBe('from auth.js')
    expect(handlers.GET).toHaveBeenCalledTimes(1)
  })
})
