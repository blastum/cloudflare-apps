import { describe, expect, it } from 'vitest'
import {
  birthMonthsFromSpacing,
  calculate,
  equalSliceFromPot,
  fundingYearFromMonths,
  realGrowthFactor,
  sliceWeight,
  type CalculatorInputs,
} from './calculator'
import { DEFAULTS, TARGET_AGE, TARGET_AGE_MONTHS } from './constants'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return {
    spacingMonths: [...DEFAULTS.spacingMonths],
    lumpSum: DEFAULTS.lumpSum,
    fundingMonthsFromFirstBirth: DEFAULTS.fundingMonthsFromFirstBirth,
    cpiRate: DEFAULTS.cpiRate,
    marketRate: DEFAULTS.marketRate,
    ...partial,
  }
}

describe('sliceWeight', () => {
  it('is 1 for the child turning 21 today', () => {
    const m = TARGET_AGE_MONTHS
    expect(sliceWeight(m, m, DEFAULTS.cpiRate, DEFAULTS.marketRate)).toBe(1)
  })

  it('falls when market beats CPI over the wait', () => {
    const anchor = TARGET_AGE_MONTHS
    const later = anchor + 60
    const w = sliceWeight(later, anchor, DEFAULTS.cpiRate, DEFAULTS.marketRate)
    expect(w).toBeLessThan(1)
    expect(w).toBeCloseTo(
      1 / realGrowthFactor(60, DEFAULTS.cpiRate, DEFAULTS.marketRate),
      8,
    )
  })
})

describe('equalSliceFromPot', () => {
  it('single child at their 21 gets the whole pot', () => {
    const m = TARGET_AGE_MONTHS
    const t = equalSliceFromPot(
      1_000_000,
      [m],
      m,
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    expect(t).toBe(1_000_000)
  })
})

describe('calculate', () => {
  it('single child takes entire grown pot at 21', () => {
    const result = calculate(inputs({ spacingMonths: [0] }))
    expect(result.children).toHaveLength(1)
    expect(result.children[0]!.potAfterPayout).toBe(0)
    expect(result.children[0]!.payoutNominal).toBe(result.potAtFirstMaturity)
    expect(result.children[0]!.payoutNominal).toBe(
      result.children[0]!.equalSliceAtThis21,
    )
  })

  it('payout equals equal slice at this 21 for non-last children', () => {
    const result = calculate(inputs())
    for (const child of result.children.slice(0, -1)) {
      expect(child.payoutNominal).toBe(child.equalSliceAtThis21)
      expect(child.payoutReal).toBe(child.equalSliceAtThis21)
    }
  })

  it('fund is exhausted after last child', () => {
    const result = calculate(inputs())
    const last = result.children[result.children.length - 1]!
    expect(last.potAfterPayout).toBe(0)
  })

  it('today child weight is 1 in the slice sum', () => {
    const result = calculate(inputs({ spacingMonths: [0, 24] }))
    const first = result.children[0]!
    const pot = first.potBeforePayout
    expect(first.equalSliceAtThis21).toBeCloseTo(
      pot / (1 + sliceWeight(252 + 24, 252, DEFAULTS.cpiRate, DEFAULTS.marketRate)),
      0,
    )
  })

  it('first maturity pot is seed grown from funding to first maturity', () => {
    const result = calculate(inputs({ spacingMonths: [0, 24] }))
    const expected = Math.round(
      DEFAULTS.lumpSum * (1 + DEFAULTS.marketRate) ** TARGET_AGE,
    )
    expect(result.potAtFirstMaturity).toBe(expected)
  })

  it('more children lowers first slice for same seed', () => {
    const one = calculate(inputs({ spacingMonths: [0] }))
    const four = calculate(inputs())
    expect(four.firstSliceAtFirstMaturity).toBeLessThan(
      one.firstSliceAtFirstMaturity,
    )
  })

  it('maturity is birth plus target age', () => {
    const result = calculate(inputs({ spacingMonths: [0, 18] }))
    for (const child of result.children) {
      expect(child.maturityYear).toBeCloseTo(child.birthYear + TARGET_AGE, 5)
    }
  })

  it('funding 10 years early raises first slice', () => {
    const atBirth = calculate(inputs({ fundingMonthsFromFirstBirth: 0 }))
    const early = calculate(inputs({ fundingMonthsFromFirstBirth: -120 }))
    expect(early.firstSliceAtFirstMaturity).toBeGreaterThan(
      atBirth.firstSliceAtFirstMaturity,
    )
  })

  it('funding after first birth lowers first slice', () => {
    const atBirth = calculate(inputs({ fundingMonthsFromFirstBirth: 0 }))
    const late = calculate(inputs({ fundingMonthsFromFirstBirth: 24 }))
    expect(late.firstSliceAtFirstMaturity).toBeLessThan(
      atBirth.firstSliceAtFirstMaturity,
    )
  })

  it('payout real at funding is equal for each child', () => {
    const result = calculate(inputs())
    const first = result.children[0]!.payoutRealAtFunding
    for (const child of result.children) {
      expect(child.payoutRealAtFunding).toBeCloseTo(first, 0)
    }
  })

  it('records funding year on result', () => {
    const result = calculate(inputs({ fundingMonthsFromFirstBirth: -60 }))
    expect(result.fundingYear).toBeCloseTo(-5, 5)
  })

  it('birth spacing accumulates in months', () => {
    const births = birthMonthsFromSpacing([0, 21, 16])
    expect(births[1]).toBe(21)
    expect(births[2]).toBe(37)
  })

  it('converts funding months to years', () => {
    expect(fundingYearFromMonths(-120)).toBe(-10)
  })
})
