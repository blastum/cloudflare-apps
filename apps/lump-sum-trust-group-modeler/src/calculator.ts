import { TARGET_AGE_MONTHS } from './constants'
import { roundUsd } from './money'

export type CalculatorInputs = {
  spacingMonths: number[]
  lumpSum: number
  fundingMonthsFromFirstBirth: number
  cpiRate: number
  marketRate: number
}

export type ChildPayout = {
  childNumber: number
  birthMonth: number
  maturityMonth: number
  childrenRemaining: number
  /** Equal slice T in this 21's dollars for everyone still owed. */
  equalSliceAtThis21: number
  shareOfRemainingPercent: number
  potBeforePayout: number
  payoutNominal: number
  /** Same as equalSliceAtThis21 (real = dollars at this 21). */
  payoutReal: number
  /** Payout deflated to funding-month purchasing power. */
  payoutRealAtFunding: number
  potAfterPayout: number
}

export type RemainingShareRow = {
  childrenRemaining: number
  childNumber: number
  maturityMonth: number
  sharePercent: number
}

export type CalculatorResult = {
  childCount: number
  fundingMonth: number
  lastBirthMonth: number
  lumpSum: number
  /** Slice T at the first child's 21 (in that day's dollars). */
  firstSliceAtFirstMaturity: number
  potAtFirstMaturity: number
  totalPaidNominal: number
  children: ChildPayout[]
  remainingShareTable: RemainingShareRow[]
}

export function fundingYearFromMonths(months: number): number {
  return months / 12
}

export function birthMonthsFromSpacing(spacingMonths: number[]): number[] {
  if (spacingMonths.length === 0) return []
  const births = [0]
  let cumulative = 0
  for (let i = 1; i < spacingMonths.length; i++) {
    cumulative += Math.max(0, spacingMonths[i]!)
    births.push(cumulative)
  }
  return births
}

export function birthYearsFromSpacing(spacingMonths: number[]): number[] {
  return birthMonthsFromSpacing(spacingMonths).map((m) => m / 12)
}

/** Cumulative real growth (market ÷ CPI) over waitMonths; annual rates, m÷12 years. */
export function realGrowthFactor(
  waitMonths: number,
  cpiRate: number,
  marketRate: number,
): number {
  if (waitMonths <= 0) return 1
  const years = waitMonths / 12
  return (1 + marketRate) ** years / (1 + cpiRate) ** years
}

/**
 * Pot cost today (anchor 21) of $1 real slice payable at maturityMonth.
 * Today = weight 1; future = 1 ÷ real growth over the wait.
 */
export function sliceWeight(
  maturityMonth: number,
  anchorMonth: number,
  cpiRate: number,
  marketRate: number,
): number {
  const waitMonths = maturityMonth - anchorMonth
  if (waitMonths <= 0) return 1
  return 1 / realGrowthFactor(waitMonths, cpiRate, marketRate)
}

/** Largest equal slice (this 21's dollars) the pot can pay all remaining maturities. */
export function equalSliceFromPot(
  potNominal: number,
  remainingMaturityMonths: number[],
  anchorMonth: number,
  cpiRate: number,
  marketRate: number,
): number {
  if (potNominal <= 0 || remainingMaturityMonths.length === 0) return 0
  const totalWeight = remainingMaturityMonths.reduce(
    (sum, m) => sum + sliceWeight(m, anchorMonth, cpiRate, marketRate),
    0,
  )
  if (totalWeight <= 0) return 0
  return potNominal / totalWeight
}

function growMonths(
  balance: number,
  monthSpan: number,
  marketRate: number,
): number {
  if (monthSpan <= 0) return roundUsd(balance)
  return roundUsd(balance * (1 + marketRate) ** (monthSpan / 12))
}

/**
 * Trustee algorithm: at each 21 grow pot, T = pot ÷ Σ weights (this 21's dollars),
 * pay T to today's child, reinvest the rest.
 */
export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const birthMonths = birthMonthsFromSpacing(inputs.spacingMonths)
  const childCount = birthMonths.length
  const lastBirthMonth = birthMonths[childCount - 1] ?? 0
  const lumpSum = roundUsd(Math.max(0, inputs.lumpSum))
  const fundMonth = inputs.fundingMonthsFromFirstBirth
  const maturityMonths = birthMonths.map((b) => b + TARGET_AGE_MONTHS)

  const children: ChildPayout[] = []
  let pot = lumpSum
  let previousMonth = fundMonth
  let totalPaidNominal = 0
  let potAtFirstMaturity = 0
  let firstSliceAtFirstMaturity = 0

  for (let i = 0; i < childCount; i++) {
    const maturityMonth = maturityMonths[i]!
    const birthMonth = birthMonths[i]!

    pot = growMonths(pot, maturityMonth - previousMonth, inputs.marketRate)
    if (i === 0) potAtFirstMaturity = pot

    const remainingMaturityMonths = maturityMonths.slice(i)
    const sliceExact = equalSliceFromPot(
      pot,
      remainingMaturityMonths,
      maturityMonth,
      inputs.cpiRate,
      inputs.marketRate,
    )
    const sliceRounded = roundUsd(sliceExact)
    if (i === 0) firstSliceAtFirstMaturity = sliceRounded

    const childrenRemaining = childCount - i
    const isLast = i === childCount - 1
    const payoutNominal = isLast ? pot : Math.min(pot, sliceRounded)
    const potAfter = Math.max(0, pot - payoutNominal)
    const sharePercent = pot > 0 ? (payoutNominal / pot) * 100 : 0
    const monthsFromFunding = maturityMonth - fundMonth
    const payoutRealAtFunding = roundUsd(
      payoutNominal / (1 + inputs.cpiRate) ** (monthsFromFunding / 12),
    )

    children.push({
      childNumber: i + 1,
      birthMonth,
      maturityMonth,
      childrenRemaining,
      equalSliceAtThis21: sliceRounded,
      shareOfRemainingPercent: sharePercent,
      potBeforePayout: pot,
      payoutNominal,
      payoutReal: isLast
        ? roundUsd(payoutNominal)
        : sliceRounded,
      payoutRealAtFunding,
      potAfterPayout: potAfter,
    })

    totalPaidNominal += payoutNominal
    pot = potAfter
    previousMonth = maturityMonth
  }

  return {
    childCount,
    fundingMonth: fundMonth,
    lastBirthMonth,
    lumpSum,
    firstSliceAtFirstMaturity,
    potAtFirstMaturity,
    totalPaidNominal: roundUsd(totalPaidNominal),
    children,
    remainingShareTable: children.map((c) => ({
      childrenRemaining: c.childrenRemaining,
      childNumber: c.childNumber,
      maturityMonth: c.maturityMonth,
      sharePercent: c.shareOfRemainingPercent,
    })),
  }
}

/** @deprecated Use sliceWeight */
export function realPayoutPvWeight(
  maturityMonth: number,
  anchorMonth: number,
  cpiRate: number,
  marketRate: number,
): number {
  return sliceWeight(maturityMonth, anchorMonth, cpiRate, marketRate)
}

/** @deprecated Use equalSliceFromPot */
export function equalRealFromPotAtMonth(
  potNominal: number,
  remainingMaturityMonths: number[],
  anchorMonth: number,
  cpiRate: number,
  marketRate: number,
): number {
  return equalSliceFromPot(
    potNominal,
    remainingMaturityMonths,
    anchorMonth,
    cpiRate,
    marketRate,
  )
}

export function equalRealFromSeed(
  lumpSum: number,
  maturityMonths: number[],
  fundMonth: number,
  cpiRate: number,
  marketRate: number,
): number {
  if (maturityMonths.length === 0) return 0
  return equalSliceFromPot(
    lumpSum,
    maturityMonths,
    fundMonth,
    cpiRate,
    marketRate,
  )
}
