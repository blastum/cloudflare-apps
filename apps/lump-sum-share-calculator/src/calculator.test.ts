import { describe, expect, it } from 'vitest'
import {
  birthYearsFromSpacing,
  calculate,
  type CalculatorInputs,
} from './calculator'
import { DEFAULTS, TARGET_AGE } from './constants'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return {
    spacingMonths: [...DEFAULTS.spacingMonths],
    targetRealAtAge21: DEFAULTS.targetRealAtAge21,
    cpiRate: DEFAULTS.cpiRate,
    marketRate: DEFAULTS.marketRate,
    ...partial,
  }
}

function expectNearTarget(real: number): void {
  expect(Math.abs(real - DEFAULTS.targetRealAtAge21)).toBeLessThanOrEqual(5)
}

describe('birthYearsFromSpacing', () => {
  it('first child at 0, staggered months for later children', () => {
    const births = birthYearsFromSpacing([0, 21, 16, 36])
    expect(births[0]).toBe(0)
    expect(births[1]).toBeCloseTo(21 / 12, 5)
    expect(births[2]).toBeCloseTo(21 / 12 + 16 / 12, 5)
    expect(births[3]).toBeCloseTo(21 / 12 + 16 / 12 + 36 / 12, 5)
  })
})

describe('calculate', () => {
  it('single child owns 100% of the pot', () => {
    const result = calculate(inputs({ spacingMonths: [0] }))
    expect(result.children).toHaveLength(1)
    expect(result.children[0]!.potSharePercent).toBeCloseTo(100, 5)
    expectNearTarget(result.children[0]!.balanceAt21Real)
  })

  it('four children with example spacing', () => {
    const result = calculate(inputs())
    expect(result.childCount).toBe(4)
    expect(result.lastBirthYear).toBeCloseTo(6 + 1 / 12, 4)
    const shares = result.children.map((c) => c.potSharePercent)
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5)
    expect(shares[0]).toBeGreaterThan(shares[3]!)
    for (const child of result.children) expectNearTarget(child.balanceAt21Real)
  })

  it('older children need larger shares', () => {
    const result = calculate(inputs({ spacingMonths: [0, 24, 24] }))
    const [first, second, third] = result.children
    expect(first!.potSharePercent).toBeGreaterThan(second!.potSharePercent)
    expect(second!.potSharePercent).toBeGreaterThan(third!.potSharePercent)
  })

  it('total deposit equals sum of child deposits', () => {
    const result = calculate(inputs())
    const sum = result.children.reduce((a, c) => a + c.depositAtYear0, 0)
    expect(result.totalDepositAtYear0).toBe(sum)
  })

  it('snapshot pot equals sum of child pot values', () => {
    const result = calculate(inputs())
    const sum = result.children.reduce((a, c) => a + c.potValueAtSnapshot, 0)
    expect(result.totalPotAtSnapshot).toBe(sum)
  })

  it('each child matures at birth plus target age', () => {
    const result = calculate(inputs({ spacingMonths: [0, 18] }))
    for (const child of result.children) {
      expect(child.maturityYear).toBeCloseTo(child.birthYear + TARGET_AGE, 5)
    }
  })
})
