import { readdirSync, readFileSync } from 'node:fs'
import { sep } from 'node:path'
import { describe, it, expect } from 'vitest'
import robots from '../app/robots'
import sitemap from '../app/sitemap'
import { metadata } from '../app/layout'
import { SITE_URL, SITEMAP_PATHS } from '../lib/site'
import { authRoutes, isPublicRoute, needsSignIn, protectedRoutes } from '../routes'

/** Every page.tsx under app/ as the path a visitor types: groups dropped, [id] kept. */
function pagePaths(): string[] {
  return readdirSync('app', { recursive: true })
    .map((file) => String(file).split(sep).join('/'))
    .filter((file) => /(^|\/)page\.tsx$/.test(file))
    .map((file) => {
      const visible = file.split('/').slice(0, -1).filter((s) => !/^\(.*\)$/.test(s))
      return '/' + visible.join('/')
    })
}

describe('production URL', () => {
  it('is the one the README and the root layout already name', () => {
    expect(SITE_URL).toBe('https://codecraft-ai-tau.vercel.app')
    expect(readFileSync('README.md', 'utf8')).toContain(`(${SITE_URL})`)
    expect(metadata.openGraph?.url).toBe(SITE_URL)
  })
})

describe('root layout metadata', () => {
  it('sets metadataBase to the production URL', () => {
    expect(new URL(String(metadata.metadataBase)).origin).toBe(SITE_URL)
  })

  it('sets a canonical relative to each page, so no page claims the home page', () => {
    // "./" is resolved by Next against the route being rendered. A fixed "/"
    // here would tell crawlers that /playgrounds is a copy of the home page.
    expect(metadata.alternates?.canonical).toBe('./')
  })
})

describe('robots.txt', () => {
  const r = robots()
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
  const disallow = ([] as string[]).concat(rule.disallow ?? [])

  it('allows every crawler and names the sitemap', () => {
    expect(rule.userAgent).toBe('*')
    expect(rule.allow).toBe('/')
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })

  it('keeps crawlers off the API, the signed-in pages and the sign-in page', () => {
    expect(disallow).toContain('/api/')
    for (const path of [...protectedRoutes, ...authRoutes]) expect(disallow).toContain(path)
  })

  it('does not disallow a public page', () => {
    for (const path of SITEMAP_PATHS) expect(disallow.some((d) => path.startsWith(d))).toBe(false)
  })
})

describe('sitemap.xml', () => {
  const entries = sitemap()

  it('lists the home page and the gallery, as the same URLs the canonicals give', () => {
    expect(entries.map((e) => e.url)).toEqual([SITE_URL, `${SITE_URL}/playgrounds`])
  })

  it('lists only pages that exist, are public and have a fixed path', () => {
    const pages = pagePaths()
    for (const path of SITEMAP_PATHS) {
      expect(pages).toContain(path)
      expect(isPublicRoute(path)).toBe(true)
      expect(needsSignIn(path)).toBe(false)
      expect(path).not.toMatch(/[[*]/)
    }
  })

  it('leaves out every dynamic page', () => {
    const dynamic = pagePaths().filter((p) => p.includes('['))
    expect(dynamic.length).toBeGreaterThan(0)
    expect(SITEMAP_PATHS.filter((p) => dynamic.includes(p))).toEqual([])
  })

  it('carries no invented dates or priorities', () => {
    for (const e of entries) expect(Object.keys(e)).toEqual(['url'])
  })
})
