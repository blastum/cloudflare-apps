import { describe, expect, it } from 'vitest'
import {
  birthYearForChild,
  calculate,
  childSharePercent,
  firstModelYearFor,
  lastModelYearFor,
  maturityYearForChild,
  shareDisplayRows,
  type CalculatorInputs,
} from './calculator'
import { DEFAULTS, TARGET_AGE } from './constants'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return { ...DEFAULTS, ...partial }
}

/** USD rounding on inflate/deflate can miss exact real by a dollar or two. */
function expectNearTarget(real: number): void {
  expect(Math.abs(real - DEFAULTS.targetRealAtAge21)).toBeLessThanOrEqual(5)
}

describe('timeline helpers', () => {
  it('first model year follows funding year when negative', () => {
    expect(firstModelYearFor(-2)).toBe(-2)
    expect(firstModelYearFor(0)).toBe(0)
    expect(firstModelYearFor(3)).toBe(0)
  })

  it('first birth is always year 0', () => {
    expect(birthYearForChild(inputs({ fundingYear: -3 }), 0)).toBe(0)
    expect(birthYearForChild(inputs({ fundingYear: 2 }), 1)).toBe(2)
  })
})

describe('calculate scenarios', () => {
  it('single child, fund at birth: 21 growth periods', () => {
    const result = calculate(inputs({ childCount: 1, fundingYear: 0 }))
    const child = result.children[0]!
    expect(child.growthPeriods).toBe(TARGET_AGE)
    expect(child.birthYear).toBe(0)
    expect(result.fundingYear).toBe(0)
    expect(result.firstModelYear).toBe(0)
    expectNearTarget(child.balanceAt21Real)
    expect(result.accountRows[0]!.modelYear).toBe(0)
  })

  it('fund 3 years before first birth (year −3)', () => {
    const result = calculate(inputs({ childCount: 1, fundingYear: -3 }))
    expect(result.fundingYear).toBe(-3)
    expect(result.firstModelYear).toBe(-3)
    expect(result.children[0]!.birthYear).toBe(0)
    expect(result.children[0]!.growthPeriods).toBe(24)
    expectNearTarget(result.children[0]!.balanceAt21Real)
    expect(result.accountRows[0]!.modelYear).toBe(-3)
    expect(result.accountRows[0]!.balances).toHaveLength(1)
  })

  it('fund 2 years after first birth, spacing 2, 2 children', () => {
    const result = calculate(
      inputs({
        childCount: 2,
        childSpacingYears: 2,
        fundingYear: 2,
      }),
    )
    expect(result.fundingYear).toBe(2)
    expect(result.firstModelYear).toBe(0)
    expect(result.children.map((c) => c.birthYear)).toEqual([0, 2])
    expect(result.children[0]!.depositAtFunding).not.toBe(
      result.children[1]!.depositAtFunding,
    )
    for (const child of result.children) expectNearTarget(child.balanceAt21Real)

    expect(result.accountRows[0]!.modelYear).toBe(0)
    expect(result.accountRows[0]!.balances).toHaveLength(0)
    const fundRow = result.accountRows.find((r) => r.modelYear === 2)
    expect(fundRow?.balances).toHaveLength(2)
    expect(result.accountRows[result.accountRows.length - 1]!.modelYear).toBe(
      result.lastModelYear,
    )
  })

  it('fund early with multiple children (year −5, spacing 2)', () => {
    const result = calculate(
      inputs({
        childCount: 3,
        childSpacingYears: 2,
        fundingYear: -5,
      }),
    )
    expect(result.fundingYear).toBe(-5)
    expect(result.firstModelYear).toBe(-5)
    expect(result.children.map((c) => c.birthYear)).toEqual([0, 2, 4])
    const deposits = result.children.map((c) => c.depositAtFunding)
    expect(new Set(deposits).size).toBe(3)
    expect(result.totalFundedNominal).toBe(
      deposits.reduce((a, b) => a + b, 0),
    )
    for (const child of result.children) expectNearTarget(child.balanceAt21Real)
  })

  it('exposes birth/maturity helpers for spacing', () => {
    const i = inputs({ childCount: 3, childSpacingYears: 2, fundingYear: 0 })
    expect(birthYearForChild(i, 2)).toBe(4)
    expect(maturityYearForChild(i, 2)).toBe(4 + TARGET_AGE)
    expect(lastModelYearFor(i)).toBe(4 + TARGET_AGE)
  })

  it('pot shares sum to 100% while multiple children are active', () => {
    const result = calculate(
      inputs({
        childCount: 2,
        childSpacingYears: 2,
        fundingYear: 0,
      }),
    )
    const midRow = result.accountRows.find((r) => r.modelYear === 10)!
    const shares = [1, 2].map((n) => childSharePercent(midRow, n)!)
    expect(shares.every((s) => s > 0)).toBe(true)
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5)
  })

  it('sole remaining child owns 100% after others mature', () => {
    const result = calculate(
      inputs({
        childCount: 2,
        childSpacingYears: 2,
        fundingYear: 0,
      }),
    )
    const child1Maturity = result.children[0]!.maturityYear
    const afterRow = result.accountRows.find(
      (r) => r.modelYear === child1Maturity + 1,
    )!
    expect(childSharePercent(afterRow, 1)).toBeNull()
    expect(childSharePercent(afterRow, 2)).toBeCloseTo(100, 5)
  })

  it('share display rows skip years 1–20', () => {
    const result = calculate(
      inputs({ childCount: 2, childSpacingYears: 2, fundingYear: 0 }),
    )
    const years = shareDisplayRows(result.accountRows).map((r) => r.modelYear)
    expect(years).not.toContain(10)
    expect(years).toContain(0)
    expect(years).toContain(TARGET_AGE)
    expect(years.every((y) => y <= 0 || y >= TARGET_AGE)).toBe(true)
  })
})
