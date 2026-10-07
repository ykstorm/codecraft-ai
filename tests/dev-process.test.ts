import { describe, it, expect, vi } from 'vitest'
import {
  createOutputTail,
  devExitMessage,
  formatDevExit,
  watchDevExit,
} from '../lib/dev-process'

describe('createOutputTail', () => {
  it('joins lines that arrive split across chunks', () => {
    const tail = createOutputTail(5)
    tail.push('> vite-react-st')
    tail.push('arter@0.0.0 dev\r\n> vite\n')
    expect(tail.lines()).toEqual(['> vite-react-starter@0.0.0 dev', '> vite'])
  })

  it('keeps only the last lines', () => {
    const tail = createOutputTail(2)
    tail.push('one\ntwo\nthree\nfour\n')
    expect(tail.lines()).toEqual(['three', 'four'])
  })

  it('includes an unfinished last line and skips blank ones', () => {
    const tail = createOutputTail(3)
    tail.push('\n\nerror: ENOENT package.json\n   \nnpm error code')
    expect(tail.lines()).toEqual(['error: ENOENT package.json', 'npm error code'])
  })
})

describe('formatDevExit', () => {
  it('prints the exit code and the last lines, indented', () => {
    expect(formatDevExit(1, ['npm error code ENOENT', 'npm error path package.json'])).toBe(
      '\r\n[error] dev server exited with code 1. Its last lines:\r\n' +
        '  npm error code ENOENT\r\n  npm error path package.json\r\n'
    )
  })

  it('says so when there was no output', () => {
    expect(formatDevExit(3, [])).toBe('\r\n[error] dev server exited with code 3, with no output\r\n')
  })
})

describe('watchDevExit', () => {
  it('reports an exit nobody asked for', async () => {
    const tail = createOutputTail(5)
    tail.push('VITE v6.4.4 ready\nfailed to load config\n')
    const emit = vi.fn()
    const onExit = vi.fn()

    await watchDevExit({ exit: Promise.resolve(1) }, tail, {
      isDisposed: () => false,
      emit,
      onExit,
    })

    expect(onExit).toHaveBeenCalledWith(1)
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit.mock.calls[0][0]).toContain('exited with code 1')
    expect(emit.mock.calls[0][0]).toContain('failed to load config')
  })

  it('stays quiet when the exit came from our own kill', async () => {
    const emit = vi.fn()
    const onExit = vi.fn()

    await watchDevExit({ exit: Promise.resolve(143) }, createOutputTail(5), {
      isDisposed: () => true,
      emit,
      onExit,
    })

    expect(emit).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
  })

  it('gives the banner a message with the code', () => {
    expect(devExitMessage(1)).toContain('exit code 1')
  })
})
