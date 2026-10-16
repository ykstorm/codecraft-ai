import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// The playground page renders from two hooks. Both are replaced so each test
// can set the boot state directly; the browser-only editor and terminal are
// stand-ins that show the props they were given.
const state = vi.hoisted(() => ({ mobile: false, container: {} as Record<string, unknown> }))

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }))
vi.mock('@/hooks/use-vite-webcontainer', () => ({ useViteWebContainer: () => state.container }))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement('a', { href }, children),
}))
vi.mock('next/dynamic', () => ({
  default: () => (props: { containerReady?: boolean }) =>
    createElement('div', {
      'data-stand-in': '',
      'data-container-ready': props.containerReady === undefined ? undefined : String(props.containerReady),
    }),
}))

const { WebPlayground } = await import('../components/playground/web-playground')

function bootState(overrides: Record<string, unknown> = {}) {
  return {
    phase: 'idle',
    error: null,
    exitCode: null,
    serverUrl: null,
    timings: { bootMs: null, installMs: null, devReadyMs: null, totalMs: null, fromSnapshot: false },
    container: null,
    shell: null,
    writeFile: async () => {},
    readFile: async () => '',
    reset: () => {},
    onOutput: () => {},
    ...overrides,
  }
}

function render(overrides: Record<string, unknown> = {}): string {
  state.container = bootState(overrides)
  return renderToStaticMarkup(createElement(WebPlayground, { name: 'Vite + React' }))
}

describe('WebPlayground', () => {
  beforeEach(() => {
    state.mobile = false
  })

  it('shows the desktop-only note on a phone', () => {
    state.mobile = true
    const html = render()
    expect(html).toContain('Desktop only')
    expect(html).not.toContain('class="ide"')
  })

  it('shows the boot step while it waits for the dev server', () => {
    const html = render({ phase: 'installing', container: {} })
    expect(html).toContain('data-tone="neutral">Installing dependencies</p>')
    expect(html).toContain('waiting for the dev server')
    expect(html).toContain('class="pane-empty">Installing dependencies</p>')
    expect(html).toContain('>Reset</button>')
    expect(html).toContain('data-container-ready="true"')
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('<iframe')
  })

  it('reports the editor as not ready before the container exists', () => {
    expect(render({ phase: 'booting' })).toContain('data-container-ready="false"')
  })

  it('shows the preview and the measured time once the server is ready', () => {
    const html = render({
      phase: 'ready',
      container: {},
      serverUrl: 'https://preview.example/',
      timings: { bootMs: 1, installMs: null, devReadyMs: 2, totalMs: 4321, fromSnapshot: true },
    })
    expect(html).toContain('data-tone="ok">Running</p>')
    expect(html).toContain('Ready in 4.3 s from the snapshot')
    expect(html).toContain('</span> live</p>')
    expect(html).toContain('src="https://preview.example/"')
    expect(html).not.toContain('pane-empty')
  })

  it('says a cold install when the boot did not use the snapshot', () => {
    const html = render({
      phase: 'ready',
      serverUrl: 'https://preview.example/',
      timings: { bootMs: 1, installMs: 3, devReadyMs: 2, totalMs: 12000, fromSnapshot: false },
    })
    expect(html).toContain('Ready in 12.0 s, cold install')
  })

  it('leaves the time out when it was not measured', () => {
    const html = render({ phase: 'ready', serverUrl: 'https://preview.example/' })
    expect(html).not.toContain('Ready in')
  })

  it('leaves the time out before the server is ready', () => {
    const timings = { bootMs: 1, installMs: 3, devReadyMs: 2, totalMs: 5000, fromSnapshot: false }
    expect(render({ phase: 'starting-dev', timings })).not.toContain('Ready in')
  })

  it('shows the exit code, the error and a retry after a failed boot', () => {
    const html = render({ phase: 'error', exitCode: 1, error: 'npm install exited 1.', container: {} })
    expect(html).toContain('data-tone="bad">Error, exit code 1</p>')
    expect(html).toContain('<p role="alert" class="ide-error">npm install exited 1.</p>')
    expect(html).toContain('>Retry</button>')
    expect(html).toContain('</span> stopped</p>')
    expect(html).toContain('The dev server is not running.')
    expect(html).toContain('data-container-ready="false"')
  })

  it('shows a plain error label when no process exit code is known', () => {
    expect(render({ phase: 'error', error: 'boom' })).toContain('data-tone="bad">Error</p>')
  })

  it('treats a browser without cross-origin isolation as failed', () => {
    const html = render({ phase: 'unavailable', error: 'Cross-origin isolation is off.' })
    expect(html).toContain('data-tone="bad">Unavailable</p>')
    expect(html).toContain('>Retry</button>')
    expect(html).toContain('</span> stopped</p>')
  })
})
