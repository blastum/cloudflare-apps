import { TARGET_AGE } from './constants'
import { deflateToStart, inflateByCpi, roundUsd } from './money'

export type CalculatorInputs = {
  /** Months after previous child; length = child count. Index 0 ignored (first birth = 0). */
  spacingMonths: number[]
  /** Total lump sum deposited at year 0 (first birth). */
  lumpSumAtYear0: number
  cpiRate: number
  marketRate: number
}

export type ChildPayout = {
  childNumber: number
  birthYear: number
  maturityYear: number
  childrenRemaining: number
  shareOfRemainingPercent: number
  potBeforePayout: number
  payoutNominal: number
  payoutReal: number
  potAfterPayout: number
}

export type RemainingShareRow = {
  childrenRemaining: number
  childNumber: number
  maturityYear: number
  sharePercent: number
}

export type CalculatorResult = {
  childCount: number
  lastBirthYear: number
  lumpSumAtYear0: number
  /** Equal real payout each child receives at age 21 (year-0 dollars). */
  equalRealAtAge21: number
  /** Pot size when the first child turns 21 (distributions begin). */
  potAtFirstMaturity: number
  potAtFirstMaturityReal: number
  /** Sum of all payouts (nominal). */
  totalPaidNominal: number
  children: ChildPayout[]
  remainingShareTable: RemainingShareRow[]
}

/** Cumulative birth years from month spacing (first child at year 0). */
export function birthYearsFromSpacing(spacingMonths: number[]): number[] {
  if (spacingMonths.length === 0) return []
  const births = [0]
  let cumulative = 0
  for (let i = 1; i < spacingMonths.length; i++) {
    cumulative += Math.max(0, spacingMonths[i]!) / 12
    births.push(cumulative)
  }
  return births
}

/**
 * Year-0 PV weight of a $1 real payout at maturity year M:
 * nominal needed = (1+cpi)^M, PV = (1+cpi)^M / (1+r)^M.
 */
export function realPayoutPvWeight(
  maturityYear: number,
  cpiRate: number,
  marketRate: number,
): number {
  if (maturityYear <= 0) return 1
  return (1 + cpiRate) ** maturityYear / (1 + marketRate) ** maturityYear
}

/**
 * Equal real payout at age 21 that exhausts a year-0 seed when each child
 * withdraws T × (1+cpi)^maturity at their maturity year.
 */
export function equalRealFromSeed(
  lumpSum: number,
  maturityYears: number[],
  cpiRate: number,
  marketRate: number,
): number {
  if (lumpSum <= 0 || maturityYears.length === 0) return 0
  const totalWeight = maturityYears.reduce(
    (sum, m) => sum + realPayoutPvWeight(m, cpiRate, marketRate),
    0,
  )
  if (totalWeight <= 0) return 0
  return lumpSum / totalWeight
}

function grow(balance: number, years: number, marketRate: number): number {
  if (years <= 0) return roundUsd(balance)
  return roundUsd(balance * (1 + marketRate) ** years)
}

/**
 * One communal pot: grow from year 0. At each child's age 21 withdraw the
 * nominal amount equal to the same real dollars T. Last payout empties the pot
 * (within rounding).
 */
export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const births = birthYearsFromSpacing(inputs.spacingMonths)
  const childCount = births.length
  const lastBirthYear = births[childCount - 1] ?? 0
  const lumpSum = roundUsd(Math.max(0, inputs.lumpSumAtYear0))
  const maturityYears = births.map((b) => b + TARGET_AGE)

  const equalRealExact = equalRealFromSeed(
    lumpSum,
    maturityYears,
    inputs.cpiRate,
    inputs.marketRate,
  )
  const equalRealAtAge21 = roundUsd(equalRealExact)

  const children: ChildPayout[] = []
  let pot = lumpSum
  let previousYear = 0
  let totalPaidNominal = 0
  let potAtFirstMaturity = 0

  for (let i = 0; i < childCount; i++) {
    const maturityYear = maturityYears[i]!
    const birthYear = births[i]!
    pot = grow(pot, maturityYear - previousYear, inputs.marketRate)
    if (i === 0) potAtFirstMaturity = pot

    const childrenRemaining = childCount - i
    const isLast = i === childCount - 1
    // Exact nominal for equal real; last child takes remainder so pot hits ~0.
    const targetNominal = inflateByCpi(
      equalRealExact,
      maturityYear,
      inputs.cpiRate,
    )
    const payoutNominal = isLast ? pot : Math.min(pot, targetNominal)
    const potAfter = Math.max(0, pot - payoutNominal)
    const sharePercent = pot > 0 ? (payoutNominal / pot) * 100 : 0

    children.push({
      childNumber: i + 1,
      birthYear,
      maturityYear,
      childrenRemaining,
      shareOfRemainingPercent: sharePercent,
      potBeforePayout: pot,
      payoutNominal,
      payoutReal: deflateToStart(payoutNominal, inputs.cpiRate, maturityYear),
      potAfterPayout: potAfter,
    })

    totalPaidNominal += payoutNominal
    pot = potAfter
    previousYear = maturityYear
  }

  return {
    childCount,
    lastBirthYear,
    lumpSumAtYear0: lumpSum,
    equalRealAtAge21,
    potAtFirstMaturity,
    potAtFirstMaturityReal: deflateToStart(
      potAtFirstMaturity,
      inputs.cpiRate,
      maturityYears[0] ?? TARGET_AGE,
    ),
    totalPaidNominal: roundUsd(totalPaidNominal),
    children,
    remainingShareTable: children.map((c) => ({
      childrenRemaining: c.childrenRemaining,
      childNumber: c.childNumber,
      maturityYear: c.maturityYear,
      sharePercent: c.shareOfRemainingPercent,
    })),
  }
}
