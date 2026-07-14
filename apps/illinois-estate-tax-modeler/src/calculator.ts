import creditTable from './assets/state-death-tax-credit-table.json'

const TABLE_ADJUSTMENT = 60_000
const FED_CAP_RATE = 0.4
const FED_CAP_EXCLUSION = 4_000_000

type CreditBracket = {
  at_least: number
  less_than: number
  credit: number
  percent: number
  excess_over: number
}

const BRACKETS = creditTable.brackets as CreditBracket[]

export type CalculatorInputs = {
  tentativeTaxableEstate: number
  adjustedTaxableGifts: number
  illinoisSitusFraction: number
}

export type CalculatorResult = {
  illinoisEstateTax: number
  stateTaxCredit: number
  taxableEstateAfterIteration: number
  effectiveRate: number
  iterationCount: number
  illinoisTentativeTaxableEstate: number
  creditBasePlusGifts: number
  preApportionmentTax: number
  illinoisSitusFraction: number
  federalCapApplied: boolean
}

function roundUsd(value: number): number {
  return Math.round(value)
}

function creditFromTableAmount(amt4tbl: number): number {
  for (const row of BRACKETS) {
    if (row.at_least <= amt4tbl && amt4tbl < row.less_than) {
      return row.credit + row.percent * (amt4tbl - row.excess_over)
    }
  }
  return 0
}

function iterateCredit(
  base: number,
  tolerance: number,
  iterationMax: number,
  creditFn: (adjTte: number) => number,
): { tax: number; iterations: number } {
  let tax1 = 0
  let tax2 = 5
  let n = 0
  while (Math.abs(tax1 - tax2) >= tolerance && n < iterationMax) {
    tax2 = tax1
    const adjTte = base - tax1
    tax1 = creditFn(adjTte)
    n += 1
  }
  return { tax: tax1, iterations: n }
}

function applyFederalCap(
  fedt: number,
  tax1: number,
  tolerance: number,
  iterationMax: number,
): { tax: number; iterations: number; applied: boolean } {
  if ((fedt - tax1 - FED_CAP_EXCLUSION) * FED_CAP_RATE >= tax1) {
    return { tax: tax1, iterations: 0, applied: false }
  }
  let n = 0
  let tax2 = 0
  while (Math.abs(tax1 - tax2) > tolerance && n < iterationMax) {
    tax2 = tax1
    const adjTte = fedt - tax1
    tax1 = (adjTte - FED_CAP_EXCLUSION) * FED_CAP_RATE
    n += 1
  }
  return { tax: tax1, iterations: n, applied: true }
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const line3 = Math.max(0, inputs.tentativeTaxableEstate)
  const line5 = line3 + Math.max(0, inputs.adjustedTaxableGifts)
  const situsFraction = Math.max(0, Math.min(1, inputs.illinoisSitusFraction))

  const creditFn = (adjTte: number) =>
    creditFromTableAmount(adjTte - TABLE_ADJUSTMENT)

  const ilPass = iterateCredit(line3, 1, 50, creditFn)
  const fedPass = applyFederalCap(line5, ilPass.tax, 1, 50)
  const preTax = Math.max(0, fedPass.tax)
  const apportioned = roundUsd(preTax * situsFraction)
  const finalTte = roundUsd(line3 - preTax)
  const eff = line3 > 0 ? apportioned / line3 : 0

  return {
    illinoisEstateTax: apportioned,
    stateTaxCredit: roundUsd(preTax),
    taxableEstateAfterIteration: finalTte,
    effectiveRate: Math.round(eff * 1_000_000) / 1_000_000,
    iterationCount: ilPass.iterations + fedPass.iterations,
    illinoisTentativeTaxableEstate: roundUsd(line3),
    creditBasePlusGifts: roundUsd(line5),
    preApportionmentTax: roundUsd(preTax),
    illinoisSitusFraction: situsFraction,
    federalCapApplied: fedPass.applied,
  }
}

export type ScenarioRow = {
  estate: number
  tax: number
}

/** Estate-size sweep with $0 gifts — matches AG chart assumptions. */
export function scenarioTable(situsFraction: number): ScenarioRow[] {
  const estates = [
    2_000_000, 3_000_000, 3_900_000, 4_000_000, 4_200_000, 4_500_000, 5_000_000,
    5_500_000, 6_000_000, 7_000_000, 8_000_000, 10_000_000, 12_000_000,
  ]
  return estates.map((estate) => {
    const result = calculate({
      tentativeTaxableEstate: estate,
      adjustedTaxableGifts: 0,
      illinoisSitusFraction: situsFraction,
    })
    return { estate, tax: result.illinoisEstateTax }
  })
}
