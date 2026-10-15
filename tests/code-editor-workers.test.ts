import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// code-editor.tsx sets self.MonacoEnvironment when it loads in a browser. The
// editor packages are browser-only, so they are replaced here, and Worker is a
// stand-in that records the script URL it was given.
const config = vi.hoisted(() => vi.fn())
vi.mock('@monaco-editor/react', () => ({ default: () => null, loader: { config } }))
vi.mock('monaco-editor', () => ({}))

class FakeWorker {
  constructor(readonly url: URL) {}
}

type MonacoEnvironment = { getWorker: (id: string, label: string) => FakeWorker }

let env: MonacoEnvironment

beforeAll(async () => {
  vi.stubGlobal('window', globalThis)
  vi.stubGlobal('self', globalThis)
  vi.stubGlobal('Worker', FakeWorker)
  await import('../components/playground/code-editor')
  env = (globalThis as unknown as { MonacoEnvironment: MonacoEnvironment }).MonacoEnvironment
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function workerScript(label: string): string {
  return env.getWorker('id', label).url.href
}

describe('Monaco worker selection', () => {
  it('points the loader at the bundled monaco-editor package', () => {
    expect(config).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['json', 'monaco-editor/language/json/json.worker.js'],
    ['css', 'monaco-editor/language/css/css.worker.js'],
    ['scss', 'monaco-editor/language/css/css.worker.js'],
    ['less', 'monaco-editor/language/css/css.worker.js'],
    ['html', 'monaco-editor/language/html/html.worker.js'],
    ['handlebars', 'monaco-editor/language/html/html.worker.js'],
    ['razor', 'monaco-editor/language/html/html.worker.js'],
    ['typescript', 'monaco-editor/language/typescript/ts.worker.js'],
    ['javascript', 'monaco-editor/language/typescript/ts.worker.js'],
  ])('starts the %s language worker', (label, script) => {
    expect(workerScript(label)).toMatch(new RegExp(`/${script}$`))
  })

  it.each(['editorWorkerService', 'plaintext', 'markdown', '', 'constructor', 'toString'])(
    'falls back to the plain editor worker for %j',
    (label) => {
      expect(workerScript(label)).toMatch(/\/monaco-editor\/editor\/editor\.worker\.js$/)
    }
  )
})
