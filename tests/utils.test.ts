import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('cn (clsx + tailwind-merge utility)', () => {
  it('merges tailwind classes', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles conditional classes (true)', () => {
    // conditional && 'text-lg' → 'text-lg' when true
    // cn('text-sm', 'text-lg') → 'text-lg' (last wins in clsx)
    expect(cn('text-sm', true && 'text-lg')).toBe('text-lg')
  })

  it('handles conditional classes (false)', () => {
    // conditional && 'text-lg' → false when false
    // cn('text-sm', false) → 'text-sm' (false is filtered out)
    expect(cn('text-sm', false && 'text-lg')).toBe('text-sm')
  })

  it('handles false conditional', () => {
    const conditional = false
    expect(cn('text-sm', conditional && 'text-lg')).toBe('text-sm')
  })

  it('handles undefined', () => {
    const val = undefined
    expect(cn('text-sm', val)).toBe('text-sm')
  })

  it('handles multiple arguments', () => {
    expect(cn('px-2', 'py-2', 'text-sm', 'font-bold')).toBe('px-2 py-2 text-sm font-bold')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })

  it('handles empty string', () => {
    expect(cn('')).toBe('')
  })
})