import { roundUsd } from './money'

export type SolveMode = 'initial' | 'maturity'

export type CalculatorInputs = {
  spacingMonths: number[]
  solveMode: SolveMode
  /** Seed into the pot when solveMode is `initial`. */
  lumpSum: number
  /**
   * Equal real slice at each child's payout age (first-birth dollars)
   * when solveMode is `maturity`. Nominal at that date is inflated by CPI.
   */
  targetMaturityValue: number
  /** Months from first birth; negative = fund before birth. */
  fundingMonth: number
  payoutAge: number
  cpiRate: number
  marketRate: number
}

export type ChildPayout = {
  childNumber: number
  birthMonth: number
  maturityMonth: number
  childrenRemaining: number
  /** Equal slice T in this payout age's dollars for everyone still owed. */
  equalSliceAtThis21: number
  shareOfRemainingPercent: number
  potBeforePayout: number
  payoutNominal: number
  /** Same as equalSliceAtThis21 (real = dollars at this payout age). */
  payoutReal: number
  /** Payout deflated to month 0 (first birth) purchasing power. */
  payoutRealAtBirth: number
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
  lastBirthMonth: number
  solveMode: SolveMode
  fundingMonth: number
  /** Resolved seed at fundingMonth (entered or sized). */
  lumpSum: number
  targetMaturityValue: number
  /** Slice T at the first child's payout age (in that day's dollars). */
  firstSliceAtFirstMaturity: number
  potAtFirstMaturity: number
  totalPaidNominal: number
  children: ChildPayout[]
  remainingShareTable: RemainingShareRow[]
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
 * Pot cost today (anchor payout) of $1 real slice payable at maturityMonth.
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

/** Largest equal slice (this payout age's dollars) the pot can pay all remaining maturities. */
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

/** Nominal pot needed at first maturity so the equal slice equals targetT. */
export function potNeededAtFirstMaturity(
  targetT: number,
  maturityMonths: number[],
  cpiRate: number,
  marketRate: number,
): number {
  if (targetT <= 0 || maturityMonths.length === 0) return 0
  const firstMaturity = maturityMonths[0]!
  const totalWeight = maturityMonths.reduce(
    (sum, m) => sum + sliceWeight(m, firstMaturity, cpiRate, marketRate),
    0,
  )
  return targetT * totalWeight
}

/**
 * Size the funding-month lump so each child receives targetMaturityValue
 * in first-birth real dollars at payout. Nominal paid on that date is higher.
 */
export function requiredLumpForTarget(
  targetMaturityValue: number,
  fundingMonth: number,
  maturityMonths: number[],
  cpiRate: number,
  marketRate: number,
): number {
  if (targetMaturityValue <= 0 || maturityMonths.length === 0) return 0
  const firstMaturity = maturityMonths[0]!
  const nominalT =
    targetMaturityValue * (1 + cpiRate) ** (firstMaturity / 12)
  const potNeeded = potNeededAtFirstMaturity(
    nominalT,
    maturityMonths,
    cpiRate,
    marketRate,
  )
  const growthMonths = firstMaturity - fundingMonth
  if (growthMonths <= 0) return roundUsd(potNeeded)
  return roundUsd(potNeeded / (1 + marketRate) ** (growthMonths / 12))
}

/**
 * Trustee algorithm: one lump at fundingMonth, grow between payouts, at each
 * payout age T = pot ÷ Σ weights (this payout age's dollars), pay T, reinvest rest.
 */
export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const birthMonths = birthMonthsFromSpacing(inputs.spacingMonths)
  const childCount = birthMonths.length
  const lastBirthMonth = birthMonths[childCount - 1] ?? 0
  const payoutAgeMonths = Math.max(0, Math.round(inputs.payoutAge)) * 12
  const maturityMonths = birthMonths.map((b) => b + payoutAgeMonths)
  const fundingMonth = Math.round(inputs.fundingMonth)

  const lumpSum =
    inputs.solveMode === 'maturity'
      ? requiredLumpForTarget(
          inputs.targetMaturityValue,
          fundingMonth,
          maturityMonths,
          inputs.cpiRate,
          inputs.marketRate,
        )
      : roundUsd(Math.max(0, inputs.lumpSum))

  const targetMaturityValue =
    inputs.solveMode === 'maturity'
      ? roundUsd(Math.max(0, inputs.targetMaturityValue))
      : 0

  const children: ChildPayout[] = []
  let pot = lumpSum
  let previousMonth = fundingMonth
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
    const payoutRealAtBirth = roundUsd(
      payoutNominal / (1 + inputs.cpiRate) ** (maturityMonth / 12),
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
      payoutReal: isLast ? roundUsd(payoutNominal) : sliceRounded,
      payoutRealAtBirth,
      potAfterPayout: potAfter,
    })

    totalPaidNominal += payoutNominal
    pot = potAfter
    previousMonth = maturityMonth
  }

  return {
    childCount,
    lastBirthMonth,
    solveMode: inputs.solveMode,
    fundingMonth,
    lumpSum,
    targetMaturityValue:
      inputs.solveMode === 'maturity'
        ? targetMaturityValue
        : firstSliceAtFirstMaturity,
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
