import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const boot = vi.hoisted(() => vi.fn())
vi.mock('@webcontainer/api', () => ({ WebContainer: { boot } }))

// lib/webcontainer.ts keeps its boot promise in module state, so every test
// loads a fresh copy of the module.
async function freshModule() {
  vi.resetModules()
  return import('../lib/webcontainer')
}

describe('getWebContainer', () => {
  beforeEach(() => {
    boot.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fails with BootTimeoutError 60 s into a boot that never settles', async () => {
    const { getWebContainer, BootTimeoutError } = await freshModule()
    boot.mockReturnValue(new Promise(() => {}))

    let outcome: unknown = 'pending'
    getWebContainer().catch((err) => (outcome = err))
    await vi.advanceTimersByTimeAsync(59_999)
    expect(outcome).toBe('pending')
    await vi.advanceTimersByTimeAsync(1)
    expect(outcome).toBeInstanceOf(BootTimeoutError)
    expect((outcome as Error).message).toContain('did not start within 60 s')
  })

  it('keeps a timed-out boot failed instead of booting again', async () => {
    const { getWebContainer, BootTimeoutError, BOOT_TIMEOUT_MS } = await freshModule()
    boot.mockReturnValue(new Promise(() => {}))

    const first = getWebContainer()
    const firstFails = expect(first).rejects.toBeInstanceOf(BootTimeoutError)
    await vi.advanceTimersByTimeAsync(BOOT_TIMEOUT_MS)
    await firstFails

    // The library's own boot is still pending, so a second boot() would hang.
    await expect(getWebContainer()).rejects.toBeInstanceOf(BootTimeoutError)
    expect(boot).toHaveBeenCalledTimes(1)
  })

  it('boots again after a rejected boot', async () => {
    const { getWebContainer } = await freshModule()
    const instance = { workdir: '/home/project' }
    boot.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(instance)

    await expect(getWebContainer()).rejects.toThrow('network')
    await expect(getWebContainer()).resolves.toBe(instance)
    expect(boot).toHaveBeenCalledTimes(2)
  })

  it('shares one boot between callers', async () => {
    const { getWebContainer } = await freshModule()
    const instance = { workdir: '/home/project' }
    boot.mockResolvedValue(instance)

    const [a, b] = await Promise.all([getWebContainer(), getWebContainer()])
    expect(a).toBe(instance)
    expect(b).toBe(instance)
    expect(boot).toHaveBeenCalledTimes(1)
  })
})
