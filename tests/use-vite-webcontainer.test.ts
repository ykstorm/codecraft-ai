import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The hook is driven without a DOM: React's hooks are replaced by a small
// stand-in that keeps state in slots across calls and hands back the effect,
// so a test can run the boot and read the state the page would render next.
const react = vi.hoisted(() => {
  const slots: unknown[] = []
  const effects: Array<() => void | (() => void)> = []
  let cursor = 0
  function slot<T>(init: () => T): number {
    const i = cursor++
    if (!(i in slots)) slots[i] = init()
    return i
  }
  return {
    effects,
    begin() {
      cursor = 0
    },
    clear() {
      slots.length = 0
      effects.length = 0
      cursor = 0
    },
    useState<T>(init: T) {
      const i = slot(() => init)
      const set = (v: T | ((prev: T) => T)) => {
        slots[i] = typeof v === 'function' ? (v as (prev: T) => T)(slots[i] as T) : v
      }
      return [slots[i], set]
    },
    useRef<T>(init: T) {
      return slots[slot(() => ({ current: init }))]
    },
    useCallback<T>(fn: T) {
      return fn
    },
    useEffect(fn: () => void | (() => void)) {
      if (effects.length === 0) effects.push(fn)
    },
  }
})
vi.mock('react', () => ({
  useState: react.useState,
  useRef: react.useRef,
  useCallback: react.useCallback,
  useEffect: react.useEffect,
}))

const getWebContainer = vi.hoisted(() => vi.fn())
vi.mock('@/lib/webcontainer', async (importActual) => ({
  ...(await importActual<typeof import('../lib/webcontainer')>()),
  getWebContainer,
}))

const snapshots = vi.hoisted(() => ({
  loadSnapshot: vi.fn(),
  saveSnapshot: vi.fn(),
  clearSnapshot: vi.fn(),
}))
vi.mock('@/lib/snapshot-cache', () => snapshots)

const restoreProjectSnapshot = vi.hoisted(() => vi.fn())
vi.mock('@/lib/project-snapshot', async (importActual) => ({
  ...(await importActual<typeof import('../lib/project-snapshot')>()),
  restoreProjectSnapshot,
  exportProjectSnapshot: vi.fn(async () => new Uint8Array(4)),
  readStorageEstimate: vi.fn(async () => ({ usage: 0, quota: 1e9 })),
}))

const watchDevExit = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/lib/dev-process', async (importActual) => ({
  ...(await importActual<typeof import('../lib/dev-process')>()),
  watchDevExit,
}))

// Imported under another name: here the hook is called as a plain function.
const { useViteWebContainer: runHook } = await import('../hooks/use-vite-webcontainer')
const { BootTimeoutError } = await import('../lib/webcontainer')

type Api = ReturnType<typeof runHook>

function render(): Api {
  react.begin()
  return runHook()
}

/** First render, the terminal attached, then the boot effect started. */
function mount() {
  react.clear()
  const output: string[] = []
  render().onOutput((chunk) => output.push(chunk))
  const cleanup = react.effects[0]() as () => void
  return { output, cleanup, now: render }
}

function fakeProcess(exit: Promise<number> = new Promise(() => {})) {
  return { output: { pipeTo: vi.fn() }, exit, kill: vi.fn() }
}

function fakeContainer(processes: Record<string, ReturnType<typeof fakeProcess>> = {}) {
  const handlers: Record<string, (...args: unknown[]) => void> = {}
  const wc = {
    workdir: '/home/project',
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = cb
    }),
    mount: vi.fn(async () => {}),
    spawn: vi.fn(async (cmd: string, args: string[]) => processes[[cmd, ...args].join(' ')] ?? fakeProcess()),
    fs: { writeFile: vi.fn(), readFile: vi.fn() },
  }
  return { wc, handlers }
}

const reload = vi.fn()

describe('useViteWebContainer boot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    snapshots.loadSnapshot.mockResolvedValue({ bytes: null, cleared: false })
    snapshots.saveSnapshot.mockResolvedValue(true)
    snapshots.clearSnapshot.mockResolvedValue(undefined)
    vi.stubGlobal('window', { crossOriginIsolated: true, location: { reload } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not boot where there is no window', () => {
    vi.stubGlobal('window', undefined)
    const { now } = mount()
    expect(now().phase).toBe('unavailable')
    expect(now().error).toContain('Cross-origin isolation is off')
    expect(getWebContainer).not.toHaveBeenCalled()
  })

  it('does not boot without cross-origin isolation', () => {
    vi.stubGlobal('window', { crossOriginIsolated: false, location: { reload } })
    const { now } = mount()
    expect(now().phase).toBe('unavailable')
    expect(now().error).toContain('needs the COOP/COEP headers')
    expect(getWebContainer).not.toHaveBeenCalled()
  })

  it('reports a boot timeout and reloads the page on reset', async () => {
    getWebContainer.mockRejectedValue(new BootTimeoutError())
    const { now, output } = mount()
    await vi.waitFor(() => expect(now().phase).toBe('error'))
    expect(now().exitCode).toBeNull()
    expect(now().error).toMatch(/did not start within 60 s.* Press retry to reload the page and boot again\.$/)
    expect(output.at(-1)).toMatch(/^\r\nerror: .*did not start within 60 s/)

    now().reset()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(now().phase).toBe('error')
  })

  it('explains an unreachable runtime CDN and boots again on reset', async () => {
    getWebContainer.mockRejectedValue(new Error('Failed to fetch'))
    const { now, output } = mount()
    await vi.waitFor(() => expect(now().phase).toBe('error'))
    expect(now().error).toContain("Can't reach the WebContainer runtime CDN")
    expect(now().exitCode).toBeNull()
    expect(output.at(-1)).toBe('\r\nerror: Failed to fetch\r\n')

    now().reset()
    expect(reload).not.toHaveBeenCalled()
    expect(now().phase).toBe('idle')
    expect(now().error).toBeNull()
    expect(snapshots.clearSnapshot).toHaveBeenCalledTimes(1)
  })

  it('shows a thrown non-error value as it is', async () => {
    getWebContainer.mockRejectedValue('odd failure')
    const { now, output } = mount()
    await vi.waitFor(() => expect(now().phase).toBe('error'))
    expect(now().error).toBe('odd failure')
    expect(output.at(-1)).toBe('\r\nerror: odd failure\r\n')
  })

  it('keeps the exit code of a failed npm install', async () => {
    const { wc } = fakeContainer({ 'npm install': fakeProcess(Promise.resolve(1)) })
    getWebContainer.mockResolvedValue(wc)
    const { now, output } = mount()
    await vi.waitFor(() => expect(now().phase).toBe('error'))
    expect(now().exitCode).toBe(1)
    expect(now().error).toMatch(/^npm install exited 1\./)
    expect(output.at(-1)).toMatch(/^\r\nerror: npm install exited 1\./)
  })

  it('stays quiet when the page is gone before the boot fails', async () => {
    let fail: (err: unknown) => void = () => {}
    getWebContainer.mockReturnValue(new Promise((_, reject) => (fail = reject)))
    const { now, output, cleanup } = mount()
    cleanup()
    fail(new BootTimeoutError())
    await new Promise((r) => setTimeout(r, 10))
    expect(now().phase).toBe('booting')
    expect(now().error).toBeNull()
    expect(output.some((line) => line.includes('error:'))).toBe(false)

    now().reset()
    expect(reload).not.toHaveBeenCalled()
  })

  it('restores the snapshot, starts the dev server and goes ready', async () => {
    snapshots.loadSnapshot.mockResolvedValue({ bytes: new Uint8Array([1]), cleared: false })
    restoreProjectSnapshot.mockResolvedValue(true)
    const { wc, handlers } = fakeContainer()
    getWebContainer.mockResolvedValue(wc)
    const { now } = mount()
    await vi.waitFor(() => expect(now().shell).not.toBeNull())
    expect(now().phase).toBe('starting-dev')
    expect(now().container).toBe(wc)
    expect(now().timings.fromSnapshot).toBe(true)
    expect(wc.mount).not.toHaveBeenCalled()
    expect(watchDevExit).toHaveBeenCalledTimes(1)

    handlers['server-ready'](5173, 'https://preview.example/')
    expect(now().phase).toBe('ready')
    expect(now().serverUrl).toBe('https://preview.example/')
    expect(now().timings.totalMs).toEqual(expect.any(Number))
  })

  it('kills the new processes when the page is gone before they start', async () => {
    const dev = fakeProcess()
    const shell = fakeProcess()
    const { wc } = fakeContainer({ 'npm install': fakeProcess(Promise.resolve(0)), 'npm run dev': dev })
    const spawn = wc.spawn.getMockImplementation()!
    // The page goes away while the shell is starting.
    wc.spawn.mockImplementation(async (cmd: string, args: string[]) => {
      if (cmd !== 'jsh') return spawn(cmd, args)
      page.cleanup()
      return shell
    })
    getWebContainer.mockResolvedValue(wc)
    const page = mount()
    const { now } = page
    await vi.waitFor(() => expect(shell.kill).toHaveBeenCalledTimes(1))
    expect(wc.spawn).toHaveBeenCalledTimes(3)
    expect(dev.kill).toHaveBeenCalledTimes(1)
    expect(now().shell).toBeNull()
    expect(watchDevExit).not.toHaveBeenCalled()
  })
})
