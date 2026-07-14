import {
  CONTRIBUTION_YEARS,
  DEFAULTS,
  GROWTH_END_AGE,
  IRA_TARGET_AGES,
  MAX_ANNUAL_CONTRIBUTION,
} from './constants'
import { federalTaxSingle, inflateByCpi, maxMarginalRateForGross, roundUsd } from './tax'

export type CalculatorInputs = {
  startingAge: number
  startingBalance: number
  annualContribution: number
  contributionInflationIndexed: boolean
  cpiRate: number
  marketRate: number
}

export type BalanceYearRow = {
  age: number
  contribution: number
  accountBalance: number
  principalBalance: number
  earningsBalance: number
  realValue: number
}

export type ConversionScenarioRow = {
  conversionYears: number
  yearlyAmounts: number[]
  yearlyTaxable: number[]
  yearlyTaxes: number[]
  yearlyTaxesReal: number[]
  yearlyMaxMarginalRates: number[]
  maxMarginalRate: number
  totalTaxPaid: number
  totalTaxPaidReal: number
}

export type IraBalanceRow = {
  age: number
  nominal: number
  real: number
}

export type CalculatorResult = {
  balanceRows: BalanceYearRow[]
  conversionRows: ConversionScenarioRow[]
  iraRows: IraBalanceRow[]
  age18Balance: number
  age18Basis: number
}

type ConversionSpreadResult = {
  summary: ConversionScenarioRow
  rothNominalAtEnd: number
  conversionEndAge: number
}

function yearsFromStart(age: number, startingAge: number): number {
  return age - startingAge
}

function deflateToStart(nominal: number, cpiRate: number, years: number): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}

export function projectBalanceByYear(inputs: CalculatorInputs): BalanceYearRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const startingBalance = Math.max(0, inputs.startingBalance)
  const baseContribution = Math.max(0, inputs.annualContribution)
  const contributionEndAge = startingAge + CONTRIBUTION_YEARS - 1
  const marketRate = inputs.marketRate
  const cpiRate = inputs.cpiRate

  let accountBalance = startingBalance
  let principalBalance = 0
  const rows: BalanceYearRow[] = []

  for (let age = startingAge; age <= GROWTH_END_AGE; age++) {
    let contribution = 0
    if (age <= contributionEndAge) {
      const yearsElapsed = yearsFromStart(age, startingAge)
      const maxCap = inputs.contributionInflationIndexed
        ? inflateByCpi(MAX_ANNUAL_CONTRIBUTION, yearsElapsed, cpiRate)
        : MAX_ANNUAL_CONTRIBUTION
      const userAmount = inputs.contributionInflationIndexed
        ? inflateByCpi(baseContribution, yearsElapsed, cpiRate)
        : baseContribution
      contribution = Math.min(maxCap, userAmount)
      accountBalance += contribution
      principalBalance += contribution
    }

    accountBalance = roundUsd(accountBalance * (1 + marketRate))

    const earningsBalance = roundUsd(
      accountBalance - principalBalance - startingBalance,
    )
    const realValue = deflateToStart(
      accountBalance,
      cpiRate,
      yearsFromStart(age, startingAge),
    )

    rows.push({
      age,
      contribution,
      accountBalance,
      principalBalance,
      earningsBalance,
      realValue,
    })
  }

  return rows
}

type ConversionYearResult = {
  conversionAmount: number
  taxable: number
  tax: number
  taxReal: number
  maxMarginalRate: number
}

type ConversionSimulation = {
  years: ConversionYearResult[]
  totalTaxPaid: number
  totalTaxPaidReal: number
}

function conversionTaxablePortion(
  conversionAmount: number,
  balance: number,
  basis: number,
): number {
  if (balance <= 0 || conversionAmount <= 0) return 0
  const preTaxShare = (balance - basis) / balance
  return roundUsd(conversionAmount * preTaxShare)
}

function conversionForTaxableTarget(
  targetTaxable: number,
  trad: number,
  basis: number,
): number {
  if (trad <= 0 || targetTaxable <= 0) return 0
  const preTaxShare = (trad - basis) / trad
  if (preTaxShare <= 0) return 0
  return Math.min(trad, roundUsd(targetTaxable / preTaxShare))
}

function simulateConversionSchedule(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
  age18Basis: number,
  conversionYears: number,
  conversionAmountForYear: (
    yearIndex: number,
    trad: number,
    basis: number,
  ) => number,
): ConversionSimulation {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const years = Math.max(1, Math.round(conversionYears))
  let trad = age18NominalBalance
  let basis = age18Basis
  const yearResults: ConversionYearResult[] = []
  let totalTaxPaid = 0
  let totalTaxPaidReal = 0

  for (let i = 0; i < years; i++) {
    if (trad <= 0) break

    const conversionAge = GROWTH_END_AGE + i
    const yearsElapsed = yearsFromStart(conversionAge, startingAge)
    const conversionAmount = Math.min(
      trad,
      Math.max(0, roundUsd(conversionAmountForYear(i, trad, basis))),
    )

    const taxable = conversionTaxablePortion(conversionAmount, trad, basis)
    const tax = federalTaxSingle(taxable, yearsElapsed, inputs.cpiRate)
    const taxReal = deflateToStart(tax, inputs.cpiRate, yearsElapsed)
    const maxMarginalRate = maxMarginalRateForGross(
      taxable,
      yearsElapsed,
      inputs.cpiRate,
    )

    yearResults.push({
      conversionAmount,
      taxable,
      tax,
      taxReal,
      maxMarginalRate,
    })
    totalTaxPaid += tax
    totalTaxPaidReal += taxReal

    const basisReduction =
      trad > 0 ? roundUsd((conversionAmount * basis) / trad) : 0
    trad = roundUsd(trad - conversionAmount)
    basis = roundUsd(basis - basisReduction)

    if (i < years - 1 && trad > 0) {
      trad = roundUsd(trad * (1 + inputs.marketRate))
    }
  }

  return {
    years: yearResults,
    totalTaxPaid: roundUsd(totalTaxPaid),
    totalTaxPaidReal: roundUsd(totalTaxPaidReal),
  }
}

function simulationToSummary(
  simulation: ConversionSimulation,
  conversionYears: number,
): ConversionScenarioRow {
  const yearlyMaxMarginalRates = simulation.years.map((y) => y.maxMarginalRate)
  return {
    conversionYears,
    yearlyAmounts: simulation.years.map((y) => y.conversionAmount),
    yearlyTaxable: simulation.years.map((y) => y.taxable),
    yearlyTaxes: simulation.years.map((y) => y.tax),
    yearlyTaxesReal: simulation.years.map((y) => y.taxReal),
    yearlyMaxMarginalRates,
    maxMarginalRate: Math.max(0, ...yearlyMaxMarginalRates),
    totalTaxPaid: simulation.totalTaxPaid,
    totalTaxPaidReal: simulation.totalTaxPaidReal,
  }
}

/** Spread conversions to equalize taxable income each year; minimizes total tax vs naive split. */
function optimizeEqualTaxableSpread(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
  age18Basis: number,
  conversionYears: number,
): ConversionSimulation {
  const years = Math.max(1, Math.round(conversionYears))
  const scheduleForTarget = (targetTaxable: number) =>
    simulateConversionSchedule(
      inputs,
      age18NominalBalance,
      age18Basis,
      years,
      (yearIndex, trad, basis) =>
        yearIndex === years - 1
          ? trad
          : conversionForTaxableTarget(targetTaxable, trad, basis),
    )

  if (years === 1) {
    return scheduleForTarget(0)
  }

  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const yearsElapsedAtStart = yearsFromStart(GROWTH_END_AGE, startingAge)
  const maxTaxable = inflateByCpi(640_600, yearsElapsedAtStart, inputs.cpiRate)

  let bestSimulation = scheduleForTarget(0)
  let bestTax = bestSimulation.totalTaxPaid

  const steps = 256
  for (let step = 0; step <= steps; step++) {
    const targetTaxable = (maxTaxable * step) / steps
    const candidate = scheduleForTarget(targetTaxable)
    if (candidate.totalTaxPaid < bestTax) {
      bestTax = candidate.totalTaxPaid
      bestSimulation = candidate
    }
  }

  return bestSimulation
}

function runConversionSpread(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
  age18Basis: number,
  conversionYears: number,
): ConversionSpreadResult {
  const years = Math.max(1, Math.round(conversionYears))
  const simulation = optimizeEqualTaxableSpread(
    inputs,
    age18NominalBalance,
    age18Basis,
    years,
  )

  return {
    summary: simulationToSummary(simulation, years),
    rothNominalAtEnd: 0,
    conversionEndAge: GROWTH_END_AGE + years - 1,
  }
}

export function projectConversionScenarios(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
  age18Basis: number,
): ConversionScenarioRow[] {
  return [1, 2, 3, 4].map(
    (years) =>
      runConversionSpread(inputs, age18NominalBalance, age18Basis, years).summary,
  )
}

export function projectUnconvertedIraBalances(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
): IraBalanceRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const { marketRate, cpiRate } = inputs

  return IRA_TARGET_AGES.map((targetAge) => {
    const yearsGrowth = targetAge - GROWTH_END_AGE
    const nominal = roundUsd(
      age18NominalBalance * (1 + marketRate) ** yearsGrowth,
    )
    const real = deflateToStart(
      nominal,
      cpiRate,
      yearsFromStart(targetAge, startingAge),
    )
    return { age: targetAge, nominal, real }
  })
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const balanceRows = projectBalanceByYear(inputs)
  const lastRow = balanceRows[balanceRows.length - 1]
  const age18Balance = lastRow?.accountBalance ?? 0
  const age18Basis = lastRow?.principalBalance ?? 0

  return {
    balanceRows,
    conversionRows: projectConversionScenarios(inputs, age18Balance, age18Basis),
    iraRows: projectUnconvertedIraBalances(inputs, age18Balance),
    age18Balance,
    age18Basis,
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
