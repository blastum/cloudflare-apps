import { describe, expect, it } from 'vitest'
import {
  birthYearsFromSpacing,
  calculate,
  equalRealFromSeed,
  realPayoutPvWeight,
  type CalculatorInputs,
} from './calculator'
import { DEFAULTS, TARGET_AGE } from './constants'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return {
    spacingMonths: [...DEFAULTS.spacingMonths],
    lumpSumAtYear0: DEFAULTS.lumpSumAtYear0,
    cpiRate: DEFAULTS.cpiRate,
    marketRate: DEFAULTS.marketRate,
    ...partial,
  }
}

function expectNearEqual(values: number[], expected: number, tol = 5): void {
  for (const v of values) {
    expect(Math.abs(v - expected)).toBeLessThanOrEqual(tol)
  }
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

describe('equalRealFromSeed', () => {
  it('single child uses full PV weight', () => {
    const t = equalRealFromSeed(
      1_000_000,
      [TARGET_AGE],
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    const w = realPayoutPvWeight(TARGET_AGE, DEFAULTS.cpiRate, DEFAULTS.marketRate)
    expect(t).toBeCloseTo(1_000_000 / w, 5)
  })
})

describe('calculate', () => {
  it('single child takes entire grown pot at 21', () => {
    const result = calculate(inputs({ spacingMonths: [0] }))
    expect(result.children).toHaveLength(1)
    expect(result.children[0]!.potAfterPayout).toBe(0)
    expect(result.children[0]!.payoutNominal).toBe(result.potAtFirstMaturity)
    expectNearEqual(
      [result.children[0]!.payoutReal],
      result.equalRealAtAge21,
    )
  })

  it('all children get the same real payout at maturity', () => {
    const result = calculate(inputs())
    expectNearEqual(
      result.children.map((c) => c.payoutReal),
      result.equalRealAtAge21,
      8,
    )
  })

  it('fund is exhausted after last child', () => {
    const result = calculate(inputs())
    const last = result.children[result.children.length - 1]!
    expect(last.potAfterPayout).toBe(0)
  })

  it('shares of remaining pot are not a flat 1/k split', () => {
    const result = calculate(inputs())
    expect(result.children[0]!.shareOfRemainingPercent).not.toBe(25)
    expect(result.children[result.childCount - 1]!.shareOfRemainingPercent).toBeCloseTo(
      100,
      0,
    )
  })

  it('first maturity pot is seed grown 21 years', () => {
    const result = calculate(inputs({ spacingMonths: [0, 24] }))
    const expected = Math.round(
      DEFAULTS.lumpSumAtYear0 * (1 + DEFAULTS.marketRate) ** TARGET_AGE,
    )
    expect(result.potAtFirstMaturity).toBe(expected)
  })

  it('more children lowers equal real payout for same seed', () => {
    const one = calculate(inputs({ spacingMonths: [0] }))
    const four = calculate(inputs())
    expect(four.equalRealAtAge21).toBeLessThan(one.equalRealAtAge21)
  })

  it('maturity is birth plus target age', () => {
    const result = calculate(inputs({ spacingMonths: [0, 18] }))
    for (const child of result.children) {
      expect(child.maturityYear).toBeCloseTo(child.birthYear + TARGET_AGE, 5)
    }
  })
})
