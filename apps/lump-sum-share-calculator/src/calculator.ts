import { TARGET_AGE } from './constants'
import { deflateToStart, inflateByCpi, roundUsd } from './money'

export type CalculatorInputs = {
  /** Months after previous child; length = child count. Index 0 ignored (first birth = 0). */
  spacingMonths: number[]
  targetRealAtAge21: number
  cpiRate: number
  marketRate: number
}

export type ChildSummary = {
  childNumber: number
  birthYear: number
  maturityYear: number
  growthPeriods: number
  depositAtYear0: number
  potValueAtSnapshot: number
  potSharePercent: number
  balanceAt21Nominal: number
  balanceAt21Real: number
}

export type CalculatorResult = {
  childCount: number
  lastBirthYear: number
  totalDepositAtYear0: number
  totalPotAtSnapshot: number
  totalPotAtSnapshotReal: number
  children: ChildSummary[]
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

export function nominalTargetAtMaturity(
  maturityYear: number,
  targetReal: number,
  cpiRate: number,
): number {
  return inflateByCpi(targetReal, maturityYear, cpiRate)
}

/** Lump sum at year 0 that grows untouched to the nominal maturity target. */
export function requiredDepositAtYear0(
  nominalTarget: number,
  maturityYear: number,
  marketRate: number,
): number {
  if (maturityYear <= 0) return roundUsd(nominalTarget)
  return roundUsd(nominalTarget / (1 + marketRate) ** maturityYear)
}

function balanceAfterGrowth(
  deposit: number,
  periods: number,
  marketRate: number,
): number {
  if (periods <= 0) return roundUsd(deposit)
  return roundUsd(deposit * (1 + marketRate) ** periods)
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const births = birthYearsFromSpacing(inputs.spacingMonths)
  const childCount = births.length
  const lastBirthYear = births[childCount - 1] ?? 0
  const children: ChildSummary[] = []
  let totalDepositAtYear0 = 0
  let totalPotAtSnapshot = 0

  for (let childIndex = 0; childIndex < childCount; childIndex++) {
    const birthYear = births[childIndex]!
    const maturityYear = birthYear + TARGET_AGE
    const growthPeriods = maturityYear
    const nominalTarget = nominalTargetAtMaturity(
      maturityYear,
      inputs.targetRealAtAge21,
      inputs.cpiRate,
    )
    const depositAtYear0 = requiredDepositAtYear0(
      nominalTarget,
      maturityYear,
      inputs.marketRate,
    )
    const potValueAtSnapshot = balanceAfterGrowth(
      depositAtYear0,
      lastBirthYear,
      inputs.marketRate,
    )

    totalDepositAtYear0 += depositAtYear0
    totalPotAtSnapshot += potValueAtSnapshot

    const at21Nominal = balanceAfterGrowth(
      depositAtYear0,
      maturityYear,
      inputs.marketRate,
    )

    children.push({
      childNumber: childIndex + 1,
      birthYear,
      maturityYear,
      growthPeriods,
      depositAtYear0,
      potValueAtSnapshot,
      potSharePercent: 0,
      balanceAt21Nominal: at21Nominal,
      balanceAt21Real: deflateToStart(at21Nominal, inputs.cpiRate, maturityYear),
    })
  }

  totalDepositAtYear0 = roundUsd(totalDepositAtYear0)
  totalPotAtSnapshot = roundUsd(totalPotAtSnapshot)

  for (const child of children) {
    child.potSharePercent =
      totalPotAtSnapshot > 0
        ? (child.potValueAtSnapshot / totalPotAtSnapshot) * 100
        : 0
  }

  return {
    childCount,
    lastBirthYear,
    totalDepositAtYear0,
    totalPotAtSnapshot,
    totalPotAtSnapshotReal: deflateToStart(
      totalPotAtSnapshot,
      inputs.cpiRate,
      lastBirthYear,
    ),
    children,
  }
}
