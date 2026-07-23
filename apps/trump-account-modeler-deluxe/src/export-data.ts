import { APP_SYNOPSIS } from './brand'
import {
  type BalanceYearRow,
  type CalculatorInputs,
  type CalculatorResult,
  type IraBalanceRow,
} from './calculator'
import { formatCurrency, formatNominalReal } from './shared/money'

export const REAL_VALUES_NOTE = 'Real values (2026 dollars) are shown in parentheses.'

export type ExportTableRow =
  | { kind: 'data'; cells: string[] }
  | { kind: 'span'; text: string }

export type ExportTable = {
  title: string
  headers: string[]
  rows: ExportTableRow[]
  footnote?: string
}

export type SummaryItem = { label: string; value: string }

export type SummaryGroup = {
  title: string
  items: SummaryItem[]
  footnote?: string
}

export type ExportDocument = {
  title: string
  synopsis: string
  generatedAt: string
  disclaimer: string
  summaryGroups: SummaryGroup[]
  tables: ExportTable[]
}

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function prefundSummaryText(result: CalculatorResult): string | null {
  if (result.requiredPrefund === null) return null

  const age67 = result.iraRows.find((row) => row.age === 67)
  const age67Text = age67 ? formatNominalReal(age67.nominal, age67.real) : '-'

  return `By funding in year 0, a ${formatCurrency(result.requiredPrefund)} deposit can grow the Trump account to ${formatNominalReal(result.age18Balance, result.age18Real)} at age 18 and ${age67Text} at full retirement age (67).`
}

export function buildSummaryGroups(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): SummaryGroup[] {
  const showFunding = inputs.enablePrefund && result.requiredPrefund !== null
  const prefundText = prefundSummaryText(result)

  const assumptions: SummaryItem[] = [
    { label: 'Starting age', value: String(inputs.startingAge) },
    {
      label: 'Starting balance',
      value: `${formatCurrency(inputs.startingBalance)} (no basis)`,
    },
    {
      label: 'Annual contribution',
      value: `${formatCurrency(inputs.annualContribution)}/yr${inputs.contributionInflationIndexed ? ' (indexed)' : ' (fixed)'}`,
    },
    {
      label: 'Prefund',
      value: inputs.enablePrefund ? 'On' : 'Off',
    },
    { label: 'Average CPI', value: `${formatPct(inputs.cpiRate)}/yr` },
    { label: 'Market growth', value: `${formatPct(inputs.marketRate)}/yr` },
  ]

  const summaryItems: SummaryItem[] = []

  if (showFunding) {
    summaryItems.push({
      label: 'Year-0 prefund',
      value: formatCurrency(result.requiredPrefund!),
    })
  }

  summaryItems.push({
    label: 'Balance at age 18',
    value: formatNominalReal(result.age18Balance, result.age18Real),
  })

  const age67 = result.iraRows.find((row) => row.age === 67)
  if (age67) {
    summaryItems.push({
      label: 'Balance at age 67',
      value: formatNominalReal(age67.nominal, age67.real),
    })
  }

  return [
    { title: 'Assumptions', items: assumptions },
    {
      title: 'Summary',
      items: summaryItems,
      footnote: prefundText ?? undefined,
    },
  ]
}

function balanceTable(
  rows: BalanceYearRow[],
  indexed: boolean,
  showFunding: boolean,
): ExportTable {
  const headers = showFunding
    ? ['Age', 'Contribution', 'Funding account', 'Principal', 'Account balance']
    : ['Age', 'Contribution', 'Principal', 'Account balance']

  const body: ExportTableRow[] = rows.map((row) => {
    const cells = [
      String(row.age),
      row.contribution > 0 ? formatCurrency(row.contribution) : '-',
    ]
    if (showFunding) {
      cells.push(
        row.fundingBalance !== null ? formatCurrency(row.fundingBalance) : '-',
      )
    }
    cells.push(
      formatCurrency(row.principalBalance),
      formatNominalReal(row.accountBalance, row.realValue),
    )
    return { kind: 'data' as const, cells }
  })

  const contribNote = indexed
    ? 'Year-end contributions for 18 years from starting age, each indexed by CPI.'
    : 'Year-end contributions for 18 years from starting age, fixed at the entered amount.'

  const prefundNote = showFunding
    ? ' Prefund withdraws each contribution from the funding account, then the remainder grows at the market rate.'
    : ''

  return {
    title: 'Balance by year',
    headers,
    rows: body,
    footnote: `${contribNote}${prefundNote} Principal is cumulative contributions (basis); starting balance has no basis.${showFunding ? ' Funding account is the year-end balance after withdrawal and growth.' : ''}`,
  }
}

function iraTable(rows: IraBalanceRow[]): ExportTable {
  return {
    title: 'IRA Balance by year',
    headers: ['Age', 'Amount'],
    rows: rows.map((row) => ({
      kind: 'data' as const,
      cells: [String(row.age), formatNominalReal(row.nominal, row.real)],
    })),
    footnote:
      'Traditional IRA balance at each age if left from age 18, growing at the market rate assumption with no withdrawals.',
  }
}

export function buildExportDocument(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): ExportDocument {
  const showFunding = inputs.enablePrefund && result.requiredPrefund !== null

  return {
    title: 'Trump Account Modeler Deluxe',
    synopsis: APP_SYNOPSIS,
    generatedAt: new Date().toLocaleString(),
    disclaimer: 'Estimates only - not tax or financial advice.',
    summaryGroups: buildSummaryGroups(inputs, result),
    tables: [
      balanceTable(result.balanceRows, inputs.contributionInflationIndexed, showFunding),
      iraTable(result.iraRows),
    ],
  }
}

export function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `trump-account-modeler-deluxe-${date}`
}
