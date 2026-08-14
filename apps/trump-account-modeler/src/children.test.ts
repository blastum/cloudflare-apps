import { describe, expect, it } from 'vitest'
import { addMonths, deriveChildren, spacingsFromChildren } from './children'

describe('child spacing', () => {
  it('adds months across year boundaries', () => {
    expect(addMonths(2025, 10, 20)).toEqual({ birthYear: 2027, birthMonth: 6 })
  })

  it('derives children from first child and spacings', () => {
    expect(deriveChildren({ birthYear: 2025, birthMonth: 10 }, [20, 24])).toEqual([
      { birthYear: 2025, birthMonth: 10 },
      { birthYear: 2027, birthMonth: 6 },
      { birthYear: 2029, birthMonth: 6 },
    ])
  })

  it('round-trips spacings from absolute birth dates', () => {
    const children = deriveChildren({ birthYear: 2026, birthMonth: 1 }, [20, 18])
    expect(spacingsFromChildren(children)).toEqual([20, 18])
  })
})
