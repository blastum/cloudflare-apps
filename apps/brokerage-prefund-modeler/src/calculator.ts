import { DEFAULTS, TARGET_AGE } from './constants'
import { deflateToStart, inflateByCpi, roundUsd } from './money'

export type CalculatorInputs = {
  childCount: number
  childSpacingYears: number
  /** Model year of lump-sum deposits; year 0 = first birth. May be negative. */
  fundingYear: number
  targetRealAtAge21: number
  cpiRate: number
  marketRate: number
}

export type ChildSummary = {
  childNumber: number
  birthYear: number
  maturityYear: number
  growthPeriods: number
  depositAtFunding: number
  balanceAt21Nominal: number
  balanceAt21Real: number
}

export type AccountYearRow = {
  modelYear: number
  balances: { childNumber: number; nominal: number; real: number }[]
}

/** Pot-share table rows: skip years 1–20 where proportions are unchanged. */
export function shareDisplayRows(rows: AccountYearRow[]): AccountYearRow[] {
  return rows.filter((row) => row.modelYear <= 0 || row.modelYear >= TARGET_AGE)
}

/** Child's share of the combined pot at a model year, or null if not in the pot. */
export function childSharePercent(
  row: AccountYearRow,
  childNumber: number,
): number | null {
  const entry = row.balances.find((b) => b.childNumber === childNumber)
  if (!entry) return null
  const total = row.balances.reduce((sum, b) => sum + b.nominal, 0)
  if (total <= 0) return null
  return (entry.nominal / total) * 100
}

export type CalculatorResult = {
  fundingYear: number
  firstModelYear: number
  totalFundedNominal: number
  children: ChildSummary[]
  accountRows: AccountYearRow[]
  lastModelYear: number
}

export function birthYearForChild(
  inputs: CalculatorInputs,
  childIndex: number,
): number {
  return childIndex * inputs.childSpacingYears
}

export function maturityYearForChild(
  inputs: CalculatorInputs,
  childIndex: number,
): number {
  return birthYearForChild(inputs, childIndex) + TARGET_AGE
}

export function firstModelYearFor(fundingYear: number): number {
  return Math.min(fundingYear, 0)
}

export function lastModelYearFor(inputs: CalculatorInputs): number {
  if (inputs.childCount < 1) return 0
  return maturityYearForChild(inputs, inputs.childCount - 1)
}

/** Nominal balance needed at a child's age-21 model year. */
export function nominalTargetAtMaturity(
  maturityYear: number,
  targetReal: number,
  cpiRate: number,
): number {
  return inflateByCpi(targetReal, maturityYear, cpiRate)
}

/**
 * Lump sum at funding year that grows untouched to the nominal maturity target.
 * Uses exactly (maturityYear − fundingYear) compounding periods.
 */
export function requiredDepositAtFunding(
  nominalTarget: number,
  growthPeriods: number,
  marketRate: number,
): number {
  if (growthPeriods <= 0) return roundUsd(nominalTarget)
  return roundUsd(nominalTarget / (1 + marketRate) ** growthPeriods)
}

function balanceAtModelYear(
  depositAtFunding: number,
  fundingYearValue: number,
  modelYear: number,
  marketRate: number,
  cpiRate: number,
): { nominal: number; real: number } {
  const periods = modelYear - fundingYearValue
  const nominal =
    periods <= 0
      ? roundUsd(depositAtFunding)
      : roundUsd(depositAtFunding * (1 + marketRate) ** periods)
  return {
    nominal,
    real: deflateToStart(nominal, cpiRate, modelYear),
  }
}

function projectAccountRows(
  inputs: CalculatorInputs,
  children: ChildSummary[],
  fundingYearValue: number,
  firstModelYear: number,
  lastModelYear: number,
): AccountYearRow[] {
  const rows: AccountYearRow[] = []

  for (let modelYear = firstModelYear; modelYear <= lastModelYear; modelYear++) {
    const balances: AccountYearRow['balances'] = []

    if (modelYear >= fundingYearValue) {
      for (const child of children) {
        if (modelYear > child.maturityYear) continue
        const bal = balanceAtModelYear(
          child.depositAtFunding,
          fundingYearValue,
          modelYear,
          inputs.marketRate,
          inputs.cpiRate,
        )
        balances.push({
          childNumber: child.childNumber,
          nominal: bal.nominal,
          real: bal.real,
        })
      }
    }

    rows.push({ modelYear, balances })
  }

  return rows
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const fundYear = inputs.fundingYear
  const firstModelYear = firstModelYearFor(fundYear)
  const children: ChildSummary[] = []
  let totalFundedNominal = 0

  for (let childIndex = 0; childIndex < inputs.childCount; childIndex++) {
    const birthYear = birthYearForChild(inputs, childIndex)
    const maturityYear = birthYear + TARGET_AGE
    const growthPeriods = maturityYear - fundYear
    const nominalTarget = nominalTargetAtMaturity(
      maturityYear,
      inputs.targetRealAtAge21,
      inputs.cpiRate,
    )
    const depositAtFunding = requiredDepositAtFunding(
      nominalTarget,
      growthPeriods,
      inputs.marketRate,
    )
    const at21 = balanceAtModelYear(
      depositAtFunding,
      fundYear,
      maturityYear,
      inputs.marketRate,
      inputs.cpiRate,
    )

    totalFundedNominal += depositAtFunding

    children.push({
      childNumber: childIndex + 1,
      birthYear,
      maturityYear,
      growthPeriods,
      depositAtFunding,
      balanceAt21Nominal: at21.nominal,
      balanceAt21Real: at21.real,
    })
  }

  totalFundedNominal = roundUsd(totalFundedNominal)
  const lastModelYear = lastModelYearFor(inputs)
  const accountRows = projectAccountRows(
    inputs,
    children,
    fundYear,
    firstModelYear,
    lastModelYear,
  )

  return {
    fundingYear: fundYear,
    firstModelYear,
    totalFundedNominal,
    children,
    accountRows,
    lastModelYear,
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
