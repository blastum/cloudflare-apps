import { PROJECTION_AGE_67 } from './constants'
import {
  REAL_DOLLAR_BASE_YEAR,
  SEED_AMOUNT,
  conversionYear,
  firstContributionYear,
  lastContributionYear,
  privateCap,
  seedEligible,
  seedYear,
  ageAtYearEnd,
} from './statute'
import {
  federalTaxSingle,
  inflateByCpi,
  maxMarginalRateForGross,
  roundUsd,
} from './tax'

export type ChildInput = {
  birthYear: number
  birthMonth: number
}

export type CalculatorInputs = {
  children: ChildInput[]
  fundingYear: number
  cpiRate: number
  marketRate: number
}

export type BalanceYearRow = {
  calendarYear: number
  age: number
  seed: number
  contribution: number
  fundingBalance: number | null
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
  calendarYear: number
  nominal: number
  real: number
}

export type ChildSummary = {
  childNumber: number
  birthYear: number
  birthMonth: number
  lastContributionYear: number
  requiredDeposit: number
  totalContributionsNominal: number
  totalContributionsReal: number
  fundedYears: number
  missed: boolean
  age18CalendarYear: number | null
  age18Balance: number | null
  age18BalanceReal: number | null
  age67CalendarYear: number | null
  age67Balance: number | null
  age67BalanceReal: number | null
}

export type PotYearRow = {
  calendarYear: number
  potNominal: number
  potReal: number
  withdrawal: number
  withdrawalLabel: string
}

export type SeveralResult = {
  fundingYear: number
  requiredLumpSum: number
  requiredLumpSumReal: number
  standaloneSingleChildLumpSum: number
  firstWithdrawalYear: number | null
  lastWithdrawalYear: number | null
  children: ChildSummary[]
  potRows: PotYearRow[]
  lastCalendarYear: number
  totalWithdrawalsNominal: number
  missedChildCount: number
}

export type CalculatorResult = SeveralResult

function deflateToBase(nominal: number, cpiRate: number, calendarYear: number): number {
  const years = calendarYear - REAL_DOLLAR_BASE_YEAR
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}

function deflateToYear(
  nominal: number,
  cpiRate: number,
  fromYear: number,
  baseYear: number,
): number {
  const delta = fromYear - baseYear
  if (delta === 0) return roundUsd(nominal)
  if (delta > 0) return roundUsd(nominal / (1 + cpiRate) ** delta)
  return roundUsd(nominal * (1 + cpiRate) ** -delta)
}

export function privateContributionAmount(
  inputs: Pick<CalculatorInputs, 'cpiRate'>,
  calendarYear: number,
): number {
  const cap = privateCap(calendarYear, inputs.cpiRate)
  return cap > 0 ? roundUsd(cap) : 0
}

export function childPrivateFlows(
  inputs: CalculatorInputs,
  child: ChildInput,
  fundingYear: number,
): { year: number; amount: number }[] {
  const first = firstContributionYear(child.birthYear)
  const last = lastContributionYear(child.birthYear)
  const flows: { year: number; amount: number }[] = []
  for (let year = first; year <= last; year++) {
    if (year < fundingYear) continue
    const amount = privateContributionAmount(inputs, year)
    if (amount > 0) flows.push({ year, amount })
  }
  return flows
}

/** Project Trump account balance at age 18 for one child. */
export function projectChildTrumpAtAge18(
  inputs: Pick<CalculatorInputs, 'cpiRate' | 'marketRate' | 'fundingYear'>,
  child: ChildInput,
  options: { fundedContributionsOnly: boolean },
): { calendarYear: number; balance: number; real: number } | null {
  const birthYear = child.birthYear
  const first = firstContributionYear(birthYear)
  const last = lastContributionYear(birthYear)
  const convertYear = conversionYear(birthYear)

  if (first > last) return null

  const seedEligibleChild = seedEligible(birthYear)
  const seedDepositYear = seedEligibleChild ? seedYear(birthYear) : null
  const skipBeforeFund = options.fundedContributionsOnly

  let accountBalance = 0
  const tableStart = Math.min(first, seedDepositYear ?? first)

  for (let calendarYear = tableStart; calendarYear <= convertYear; calendarYear++) {
    if (seedDepositYear === calendarYear && seedEligibleChild) {
      accountBalance += SEED_AMOUNT
    }

    if (calendarYear >= first && calendarYear <= last) {
      if (skipBeforeFund && calendarYear < inputs.fundingYear) {
        /* no contribution */
      } else {
        const amount = privateContributionAmount(inputs, calendarYear)
        if (amount > 0) accountBalance += amount
      }
    }

    accountBalance = roundUsd(accountBalance * (1 + inputs.marketRate))
  }

  return {
    calendarYear: convertYear,
    balance: accountBalance,
    real: deflateToBase(accountBalance, inputs.cpiRate, convertYear),
  }
}

export function presentValueAtFund(
  fundYear: number,
  flows: { year: number; amount: number }[],
  marketRate: number,
): number {
  let pv = 0
  for (const { year, amount } of flows) {
    const periods = year - fundYear
    if (periods < 0) continue
    pv += amount / (1 + marketRate) ** periods
  }
  return roundUsd(pv)
}

export function requiredPrefundAmount(
  contributions: number[],
  marketRate: number,
): number {
  let pv = 0
  for (let k = 0; k < contributions.length; k++) {
    pv += contributions[k]! / (1 + marketRate) ** k
  }
  return roundUsd(pv)
}

function projectFundingBalances(
  initial: number,
  contributions: number[],
  marketRate: number,
): number[] {
  let balance = initial
  const balances: number[] = []
  for (const contribution of contributions) {
    balance = Math.max(0, roundUsd(balance - contribution))
    balance = roundUsd(balance * (1 + marketRate))
    balances.push(balance)
  }
  return balances
}

function growBetween(
  balance: number,
  fromYear: number,
  toYear: number,
  marketRate: number,
): number {
  const span = toYear - fromYear
  if (span <= 0) return roundUsd(balance)
  return roundUsd(balance * (1 + marketRate) ** span)
}

function withdrawalsDetailByYear(
  inputs: CalculatorInputs,
): Map<number, { count: number; perChild: number; total: number }> {
  const byYear = new Map<number, { count: number; perChild: number; total: number }>()
  for (const child of inputs.children) {
    for (const { year, amount } of childPrivateFlows(inputs, child, inputs.fundingYear)) {
      const existing = byYear.get(year)
      if (existing) {
        existing.count++
        existing.total = roundUsd(existing.total + amount)
      } else {
        byYear.set(year, { count: 1, perChild: amount, total: amount })
      }
    }
  }
  return byYear
}

function formatWithdrawalLabel(
  count: number,
  perChild: number,
  total: number,
): string {
  if (total <= 0) return '—'
  if (count <= 1) return formatCurrency(total)
  return `${count} × ${formatCurrency(perChild)}`
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function buildPotRows(
  fundingYear: number,
  deposit: number,
  withdrawalsByYear: Map<number, number>,
  withdrawalDetails: Map<number, { count: number; perChild: number; total: number }>,
  cpiRate: number,
  marketRate: number,
): PotYearRow[] {
  const withdrawalYears = [...withdrawalsByYear.keys()]
    .filter((y) => y >= fundingYear)
    .sort((a, b) => a - b)

  if (withdrawalYears.length === 0) {
    return [
      {
        calendarYear: fundingYear,
        potNominal: roundUsd(deposit),
        potReal: roundUsd(deposit),
        withdrawal: 0,
        withdrawalLabel: '—',
      },
    ]
  }

  const rows: PotYearRow[] = []
  let pot = 0
  let prev = fundingYear

  rows.push({
    calendarYear: fundingYear,
    potNominal: roundUsd(deposit),
    potReal: deflateToYear(deposit, cpiRate, fundingYear, REAL_DOLLAR_BASE_YEAR),
    withdrawal: 0,
    withdrawalLabel: '—',
  })
  pot = deposit
  prev = fundingYear

  for (const calendarYear of withdrawalYears) {
    pot = growBetween(pot, prev, calendarYear, marketRate)
    const withdrawal = withdrawalsByYear.get(calendarYear) ?? 0
    const detail = withdrawalDetails.get(calendarYear)
    pot = Math.max(0, roundUsd(pot - withdrawal))
    rows.push({
      calendarYear,
      potNominal: pot,
      potReal: deflateToYear(pot, cpiRate, calendarYear, REAL_DOLLAR_BASE_YEAR),
      withdrawal,
      withdrawalLabel: detail
        ? formatWithdrawalLabel(detail.count, detail.perChild, detail.total)
        : formatCurrency(withdrawal),
    })
    prev = calendarYear
  }

  return rows
}

function withdrawalsByYear(inputs: CalculatorInputs): Map<number, number> {
  const byYear = new Map<number, number>()
  for (const child of inputs.children) {
    for (const { year, amount } of childPrivateFlows(inputs, child, inputs.fundingYear)) {
      byYear.set(year, roundUsd((byYear.get(year) ?? 0) + amount))
    }
  }
  return byYear
}

export function calculateSeveral(inputs: CalculatorInputs): SeveralResult {
  const children: ChildSummary[] = []
  let requiredLumpSum = 0
  let missedChildCount = 0
  let totalWithdrawalsNominal = 0

  for (let i = 0; i < inputs.children.length; i++) {
    const child = inputs.children[i]!
    const last = lastContributionYear(child.birthYear)
    const flows = childPrivateFlows(inputs, child, inputs.fundingYear)
    const missed = flows.length === 0
    const totalNominal = roundUsd(flows.reduce((sum, f) => sum + f.amount, 0))
    const requiredDeposit = presentValueAtFund(
      inputs.fundingYear,
      flows,
      inputs.marketRate,
    )

    if (missed) missedChildCount++
    else {
      requiredLumpSum = roundUsd(requiredLumpSum + requiredDeposit)
      totalWithdrawalsNominal = roundUsd(totalWithdrawalsNominal + totalNominal)
    }

    const midYear =
      flows.length > 0 ? flows[Math.floor(flows.length / 2)]!.year : child.birthYear

    const age18 = (() => {
      const childInputs: CalculatorInputs = {
        ...inputs,
        children: [child],
      }
      const { rows, emptySchedule } = projectBalanceByYear(childInputs)
      if (emptySchedule) return null
      const year = conversionYear(child.birthYear)
      const row = rows.find((r) => r.calendarYear === year)
      if (!row) return null
      return {
        calendarYear: year,
        balance: row.accountBalance,
        real: row.realValue,
      }
    })()

    const age67 =
      age18 !== null
        ? projectBalanceAtAge(
            child.birthYear,
            age18.balance,
            PROJECTION_AGE_67,
            inputs.marketRate,
            inputs.cpiRate,
          )
        : null

    children.push({
      childNumber: i + 1,
      birthYear: child.birthYear,
      birthMonth: child.birthMonth,
      lastContributionYear: last,
      requiredDeposit: missed ? 0 : requiredDeposit,
      totalContributionsNominal: totalNominal,
      totalContributionsReal: deflateToYear(
        totalNominal,
        inputs.cpiRate,
        midYear,
        REAL_DOLLAR_BASE_YEAR,
      ),
      fundedYears: flows.length,
      missed,
      age18CalendarYear: age18?.calendarYear ?? null,
      age18Balance: age18?.balance ?? null,
      age18BalanceReal: age18?.real ?? null,
      age67CalendarYear: age67?.calendarYear ?? null,
      age67Balance: age67?.nominal ?? null,
      age67BalanceReal: age67?.real ?? null,
    })
  }

  const withdrawalsMap = withdrawalsByYear(inputs)
  const withdrawalDetails = withdrawalsDetailByYear(inputs)
  const sortedYears = [...withdrawalsMap.keys()]
    .filter((y) => y >= inputs.fundingYear)
    .sort((a, b) => a - b)
  const firstWithdrawalYear = sortedYears[0] ?? null
  const lastWithdrawalYear = sortedYears[sortedYears.length - 1] ?? null

  const potRows = buildPotRows(
    inputs.fundingYear,
    requiredLumpSum,
    withdrawalsMap,
    withdrawalDetails,
    inputs.cpiRate,
    inputs.marketRate,
  )

  const singleChild = inputs.children[0]!
  const singleFlows = childPrivateFlows(inputs, singleChild, inputs.fundingYear)
  const standaloneSingleChildLumpSum = presentValueAtFund(
    inputs.fundingYear,
    singleFlows,
    inputs.marketRate,
  )

  return {
    fundingYear: inputs.fundingYear,
    requiredLumpSum,
    requiredLumpSumReal: deflateToYear(
      requiredLumpSum,
      inputs.cpiRate,
      inputs.fundingYear,
      REAL_DOLLAR_BASE_YEAR,
    ),
    standaloneSingleChildLumpSum,
    firstWithdrawalYear,
    lastWithdrawalYear,
    children,
    potRows,
    lastCalendarYear: potRows[potRows.length - 1]?.calendarYear ?? inputs.fundingYear,
    totalWithdrawalsNominal,
    missedChildCount,
  }
}

export function projectBalanceByYear(inputs: CalculatorInputs): {
  rows: BalanceYearRow[]
  requiredLumpSum: number | null
  emptySchedule: boolean
} {
  const child = inputs.children[0]!
  const birthYear = child.birthYear
  const first = firstContributionYear(birthYear)
  const last = lastContributionYear(birthYear)
  const convertYear = conversionYear(birthYear)

  if (first > last) {
    return { rows: [], requiredLumpSum: null, emptySchedule: true }
  }

  const seedEligibleChild = seedEligible(birthYear)
  const seedDepositYear = seedEligibleChild ? seedYear(birthYear) : null

  const lumpContribYears: number[] = []
  for (let y = first; y <= last; y++) {
    if (y < inputs.fundingYear) continue
    if (privateContributionAmount(inputs, y) > 0) lumpContribYears.push(y)
  }

  const lumpContribAmounts = lumpContribYears.map((y) =>
    privateContributionAmount(inputs, y),
  )

  const requiredLumpSum =
    lumpContribAmounts.length > 0
      ? presentValueAtFund(
          inputs.fundingYear,
          lumpContribYears.map((year, i) => ({
            year,
            amount: lumpContribAmounts[i]!,
          })),
          inputs.marketRate,
        )
      : null

  const fundingBalances =
    requiredLumpSum !== null
      ? projectFundingBalances(requiredLumpSum, lumpContribAmounts, inputs.marketRate)
      : null

  let fundingIndex = 0
  let accountBalance = 0
  let principalBalance = 0
  const rows: BalanceYearRow[] = []

  const tableStart = Math.min(first, inputs.fundingYear, seedDepositYear ?? first)

  for (let calendarYear = tableStart; calendarYear <= convertYear; calendarYear++) {
    let seed = 0
    let contribution = 0
    let fundingBalance: number | null = null

    if (seedDepositYear === calendarYear && seedEligibleChild) {
      seed = SEED_AMOUNT
      accountBalance += seed
    }

    if (calendarYear >= first && calendarYear <= last) {
      if (calendarYear < inputs.fundingYear) {
        /* pot has not started */
      } else {
        const amount = privateContributionAmount(inputs, calendarYear)
        if (amount > 0) {
          contribution = amount
          accountBalance += contribution
          principalBalance += contribution
          if (fundingBalances !== null) {
            fundingBalance = fundingBalances[fundingIndex] ?? 0
            fundingIndex++
          }
        }
      }
    }

    accountBalance = roundUsd(accountBalance * (1 + inputs.marketRate))

    const earningsBalance = roundUsd(accountBalance - principalBalance)
    const age = ageAtYearEnd(birthYear, calendarYear)

    rows.push({
      calendarYear,
      age,
      seed,
      contribution,
      fundingBalance,
      accountBalance,
      principalBalance,
      earningsBalance,
      realValue: deflateToBase(accountBalance, inputs.cpiRate, calendarYear),
    })
  }

  return { rows, requiredLumpSum, emptySchedule: false }
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
  birthYear: number,
  age18NominalBalance: number,
  age18Basis: number,
  conversionYears: number,
  conversionAmountForYear: (
    yearIndex: number,
    trad: number,
    basis: number,
  ) => number,
): ConversionSimulation {
  const years = Math.max(1, Math.round(conversionYears))
  const startYear = conversionYear(birthYear)
  let trad = age18NominalBalance
  let basis = age18Basis
  const yearResults: ConversionYearResult[] = []
  let totalTaxPaid = 0
  let totalTaxPaidReal = 0

  for (let i = 0; i < years; i++) {
    if (trad <= 0) break

    const calendarYear = startYear + i
    const conversionAmount = Math.min(
      trad,
      Math.max(0, roundUsd(conversionAmountForYear(i, trad, basis))),
    )

    const taxable = conversionTaxablePortion(conversionAmount, trad, basis)
    const tax = federalTaxSingle(taxable, calendarYear, inputs.cpiRate)
    const taxReal = deflateToBase(tax, inputs.cpiRate, calendarYear)
    const maxMarginalRate = maxMarginalRateForGross(
      taxable,
      calendarYear,
      inputs.cpiRate,
    )

    yearResults.push({ conversionAmount, taxable, tax, taxReal, maxMarginalRate })
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

function optimizeEqualTaxableSpread(
  inputs: CalculatorInputs,
  birthYear: number,
  age18NominalBalance: number,
  age18Basis: number,
  conversionYears: number,
): ConversionSimulation {
  const years = Math.max(1, Math.round(conversionYears))
  const scheduleForTarget = (targetTaxable: number) =>
    simulateConversionSchedule(
      inputs,
      birthYear,
      age18NominalBalance,
      age18Basis,
      years,
      (yearIndex, trad, basis) =>
        yearIndex === years - 1
          ? trad
          : conversionForTaxableTarget(targetTaxable, trad, basis),
    )

  if (years === 1) return scheduleForTarget(0)

  const startYear = conversionYear(birthYear)
  const inflationYears = startYear - REAL_DOLLAR_BASE_YEAR
  const maxTaxable = inflateByCpi(640_600, inflationYears, inputs.cpiRate)

  let bestSimulation = scheduleForTarget(0)
  let bestTax = bestSimulation.totalTaxPaid

  for (let step = 0; step <= 256; step++) {
    const targetTaxable = (maxTaxable * step) / 256
    const candidate = scheduleForTarget(targetTaxable)
    if (candidate.totalTaxPaid < bestTax) {
      bestTax = candidate.totalTaxPaid
      bestSimulation = candidate
    }
  }

  return bestSimulation
}

export function projectConversionScenarios(
  inputs: CalculatorInputs,
  birthYear: number,
  age18NominalBalance: number,
  age18Basis: number,
): ConversionScenarioRow[] {
  return [1, 2, 3, 4].map((years) =>
    simulationToSummary(
      optimizeEqualTaxableSpread(
        inputs,
        birthYear,
        age18NominalBalance,
        age18Basis,
        years,
      ),
      years,
    ),
  )
}

export function projectBalanceAtAge(
  birthYear: number,
  balanceAt18: number,
  targetAge: number,
  marketRate: number,
  cpiRate: number,
): { calendarYear: number; nominal: number; real: number } {
  const calendarYear = birthYear + targetAge
  const yearsGrowth = targetAge - 18
  const nominal = roundUsd(balanceAt18 * (1 + marketRate) ** yearsGrowth)
  return {
    calendarYear,
    nominal,
    real: deflateToBase(nominal, cpiRate, calendarYear),
  }
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  return calculateSeveral(inputs)
}

export function defaultInputs(): CalculatorInputs {
  return {
    children: [{ birthYear: 2026, birthMonth: 1 }],
    fundingYear: 2026,
    cpiRate: 0.032,
    marketRate: 0.103,
  }
}
