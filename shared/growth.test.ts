import { describe, expect, it } from 'vitest'
import { deflate, inflate } from './growth'
import { formatPct } from './money'
import { nextSteppedValue } from './stepper'

describe('growth', () => {
  it('inflate/deflate round-trip within a dollar', () => {
    const real = 10_000
    const years = 12
    const cpi = 0.032
    const nominal = inflate(real, years, cpi)
    expect(Math.abs(deflate(nominal, years, cpi) - real)).toBeLessThanOrEqual(1)
  })

  it('formatPct shows one decimal', () => {
    expect(formatPct(0.032)).toBe('3.2%')
    expect(formatPct(0.103)).toBe('10.3%')
  })
})

describe('rate stepper', () => {
  it('steps 3.2 → 3.3 → 3.2 without float junk', () => {
    const up = nextSteppedValue(3.2, 1, { step: 0.1, decimals: 1 })
    expect(up).toBe('3.3')
    expect(nextSteppedValue(Number(up), -1, { step: 0.1, decimals: 1 })).toBe('3.2')
    expect(nextSteppedValue(3.3000000004, 1, { step: 0.1, decimals: 1 })).toBe('3.4')
  })
})
