import { describe, expect, it } from 'vitest'
import {
  birthMonthsFromSpacing,
  calculate,
  equalSliceFromPot,
  potNeededAtFirstMaturity,
  realGrowthFactor,
  requiredLumpForTarget,
  sliceWeight,
  type CalculatorInputs,
} from './calculator'
import { DEFAULTS } from './constants'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return {
    spacingMonths: [...DEFAULTS.spacingMonths],
    solveMode: DEFAULTS.solveMode,
    lumpSum: DEFAULTS.lumpSum,
    targetMaturityValue: DEFAULTS.targetMaturityValue,
    fundingMonth: DEFAULTS.fundingMonth,
    payoutAge: DEFAULTS.payoutAge,
    cpiRate: DEFAULTS.cpiRate,
    marketRate: DEFAULTS.marketRate,
    ...partial,
  }
}

function payoutAgeMonths(payoutAge = DEFAULTS.payoutAge): number {
  return payoutAge * 12
}

describe('sliceWeight', () => {
  it('is 1 for the child turning payout age today', () => {
    const m = payoutAgeMonths()
    expect(sliceWeight(m, m, DEFAULTS.cpiRate, DEFAULTS.marketRate)).toBe(1)
  })

  it('falls when market beats CPI over the wait', () => {
    const anchor = payoutAgeMonths()
    const later = anchor + 60
    const w = sliceWeight(later, anchor, DEFAULTS.cpiRate, DEFAULTS.marketRate)
    expect(w).toBeLessThan(1)
    expect(w).toBeCloseTo(
      1 / realGrowthFactor(60, DEFAULTS.cpiRate, DEFAULTS.marketRate),
      8,
    )
  })

  it('uses annual rates with m÷12 years for real growth', () => {
    const waitMonths = 60
    const years = waitMonths / 12
    const expected =
      (1 + DEFAULTS.marketRate) ** years / (1 + DEFAULTS.cpiRate) ** years
    expect(realGrowthFactor(waitMonths, DEFAULTS.cpiRate, DEFAULTS.marketRate)).toBeCloseTo(
      expected,
      10,
    )
  })
})

describe('equalSliceFromPot', () => {
  it('single child at payout age gets the whole pot', () => {
    const m = payoutAgeMonths()
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

describe('requiredLumpForTarget', () => {
  it('sizes a lump so real payout at first birth matches the target', () => {
    const spacing = [...DEFAULTS.spacingMonths]
    const births = birthMonthsFromSpacing(spacing)
    const maturities = births.map((b) => b + payoutAgeMonths())
    const target = 400_000
    const lump = requiredLumpForTarget(
      target,
      0,
      maturities,
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    const result = calculate(
      inputs({
        spacingMonths: spacing,
        solveMode: 'initial',
        lumpSum: lump,
      }),
    )
    expect(result.children[0]!.payoutRealAtBirth).toBeCloseTo(target, -1)
    expect(result.firstSliceAtFirstMaturity).toBeGreaterThan(target)
  })

  it('earlier funding lowers the required lump', () => {
    const spacing = [0, 24]
    const births = birthMonthsFromSpacing(spacing)
    const maturities = births.map((b) => b + payoutAgeMonths())
    const target = 300_000
    const atBirth = requiredLumpForTarget(
      target,
      0,
      maturities,
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    const early = requiredLumpForTarget(
      target,
      -120,
      maturities,
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    expect(early).toBeLessThan(atBirth)
  })

  it('pot needed at first maturity equals target times weight sum', () => {
    const maturities = [payoutAgeMonths(), payoutAgeMonths() + 24]
    const target = 250_000
    const pot = potNeededAtFirstMaturity(
      target,
      maturities,
      DEFAULTS.cpiRate,
      DEFAULTS.marketRate,
    )
    const weightSum =
      1 +
      sliceWeight(
        maturities[1]!,
        maturities[0]!,
        DEFAULTS.cpiRate,
        DEFAULTS.marketRate,
      )
    expect(pot).toBeCloseTo(target * weightSum, 6)
  })
})

describe('calculate', () => {
  it('single child takes entire grown pot at payout age', () => {
    const result = calculate(inputs({ spacingMonths: [0] }))
    expect(result.children).toHaveLength(1)
    expect(result.children[0]!.potAfterPayout).toBe(0)
    expect(result.children[0]!.payoutNominal).toBe(result.potAtFirstMaturity)
    expect(result.children[0]!.payoutNominal).toBe(
      result.children[0]!.equalSliceAtThis21,
    )
  })

  it('payout equals equal slice at this payout age for non-last children', () => {
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
    const firstMaturity = payoutAgeMonths()
    expect(first.equalSliceAtThis21).toBeCloseTo(
      pot /
        (1 +
          sliceWeight(
            firstMaturity + 24,
            firstMaturity,
            DEFAULTS.cpiRate,
            DEFAULTS.marketRate,
          )),
      0,
    )
  })

  it('first maturity pot is lump grown to first maturity', () => {
    const result = calculate(inputs({ spacingMonths: [0, 24] }))
    const expected = Math.round(
      DEFAULTS.lumpSum * (1 + DEFAULTS.marketRate) ** (payoutAgeMonths() / 12),
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

  it('maturity is birth plus payout age in months', () => {
    const result = calculate(inputs({ spacingMonths: [0, 18], payoutAge: 25 }))
    for (const child of result.children) {
      expect(child.maturityMonth).toBe(child.birthMonth + 25 * 12)
    }
  })

  it('funding 10 years early raises first slice', () => {
    const atBirth = calculate(inputs({ fundingMonth: 0 }))
    const early = calculate(inputs({ fundingMonth: -120 }))
    expect(early.firstSliceAtFirstMaturity).toBeGreaterThan(
      atBirth.firstSliceAtFirstMaturity,
    )
  })

  it('funding after first birth lowers first slice', () => {
    const atBirth = calculate(inputs({ fundingMonth: 0 }))
    const late = calculate(inputs({ fundingMonth: 24 }))
    expect(late.firstSliceAtFirstMaturity).toBeLessThan(
      atBirth.firstSliceAtFirstMaturity,
    )
  })

  it('payout real at birth is equal for each child', () => {
    const result = calculate(inputs())
    const first = result.children[0]!.payoutRealAtBirth
    for (const child of result.children) {
      expect(Math.abs(child.payoutRealAtBirth - first)).toBeLessThanOrEqual(1)
    }
  })

  it('maturity mode hits the real target; nominal at payout is higher', () => {
    const target = 350_000
    const result = calculate(
      inputs({
        solveMode: 'maturity',
        targetMaturityValue: target,
        lumpSum: 0,
      }),
    )
    expect(result.lumpSum).toBeGreaterThan(0)
    for (const child of result.children) {
      expect(child.payoutRealAtBirth).toBeCloseTo(target, -1)
      expect(child.payoutNominal).toBeGreaterThan(child.payoutRealAtBirth)
    }
  })

  it('birth spacing accumulates in months', () => {
    const births = birthMonthsFromSpacing([0, 21, 16])
    expect(births[1]).toBe(21)
    expect(births[2]).toBe(37)
  })
})
