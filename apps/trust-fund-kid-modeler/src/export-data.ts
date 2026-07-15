import { TRUST_ATTRIBUTES } from './brand'
import { BALANCE_AGES, END_AGE } from './constants'
import {
  type BrokerageRow,
  type CalculatorInputs,
  type CalculatorResult,
  type GiftInflowRow,
  type MoneyPair,
  type TrumpFundingSource,
  type TrumpRow,
} from './calculator'
import { formatCurrency, formatNominalReal } from './shared/money'

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

export type SummarySubsection = {
  title: string
  items: SummaryItem[]
}

export type SummaryGroup = {
  title: string
  items?: SummaryItem[]
  subsections?: SummarySubsection[]
  footnote?: string
}

export type ExportDocument = {
  title: string
  overviewBullets: readonly string[]
  generatedAt: string
  disclaimer: string
  warning: string | null
  summaryGroups: SummaryGroup[]
  tables: ExportTable[]
}

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function exportCell(pair: MoneyPair): string {
  if (pair.nominal === 0 && pair.real === 0) return '-'
  return formatNominalReal(pair.nominal, pair.real)
}

function formatFundingSource(source: TrumpFundingSource): string {
  switch (source) {
    case 'direct':
      return 'Direct'
    case 'prefund':
      return 'Prefund'
    case 'brokerage':
      return 'Brokerage'
    case 'mixed':
      return 'Mixed'
    case 'none':
      return '-'
  }
}

function brokerageFundingCell(row: BrokerageRow): string {
  if (row.age === END_AGE) {
    if (row.funding.nominal === 0 && row.funding.real === 0) return '-'
    return `(prefund) ${formatNominalReal(row.funding.nominal, row.funding.real)}`
  }
  return exportCell(row.funding)
}

function giftInflowsTable(rows: GiftInflowRow[]): ExportTable | null {
  if (rows.length === 0) return null

  return {
    title: 'Gift inflows',
    headers: ['Age', 'Gift', 'To Trump', 'To Brokerage', 'To Prefund'],
    rows: rows.map((row) => ({
      kind: 'data' as const,
      cells: [
        String(row.age),
        exportCell(row.gift),
        exportCell(row.toTrump),
        exportCell(row.toBrokerage),
        exportCell(row.toPrefund),
      ],
    })),
    footnote:
      'Years when Crummey gifts are made. The last gift year is trimmed to the minimum needed so prefund lands near zero at 17. Each cell shows nominal (real) dollars.',
  }
}

function trumpTable(rows: TrumpRow[]): ExportTable {
  const milestoneNote = `Milestone balances at ages ${BALANCE_AGES.join(', ')} (market growth only)`
  const body: ExportTableRow[] = []

  for (const row of rows) {
    if (row.age === BALANCE_AGES.find((age) => age > END_AGE)) {
      body.push({ kind: 'span', text: milestoneNote })
    }
    body.push({
      kind: 'data',
      cells: [
        String(row.age),
        exportCell(row.slice),
        exportCell(row.seedDeposit),
        formatFundingSource(row.fundingSource),
        exportCell(row.prefundBalance),
        exportCell(row.balance),
      ],
    })
  }

  return {
    title: 'Trump account',
    headers: ['Age', 'Slice', 'Seed', 'Funding source', 'Prefund balance', 'Trump balance'],
    rows: body,
    footnote:
      'Annual trump slice from starting age through 17. Seed is a one-time federal deposit at account open. Age 18 has no slice or funding but trump still compounds.',
  }
}

export function buildSummaryGroups(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): SummaryGroup[] {
  const brokerageAt18Row = result.brokerageRows.find((r) => r.age === END_AGE)

  return [
    {
      title: 'Parameters',
      items: [
        { label: 'Starting age', value: String(inputs.startingAge) },
        { label: 'Inflation', value: `${formatPct(inputs.cpiRate)}/yr` },
        { label: 'Market return', value: `${formatPct(inputs.marketRate)}/yr` },
        { label: 'Trump seed (federal)', value: formatCurrency(inputs.trumpSeed) },
        { label: 'Trump annual slice (real)', value: formatCurrency(inputs.trumpRealAnnual) },
        { label: 'Annual Crummey gift (real)', value: formatCurrency(inputs.giftRealAnnual) },
        { label: 'Brokerage target (real)', value: formatCurrency(inputs.brokerageRealTarget) },
      ],
    },
    {
      title: 'Crummey gifts',
      items: [
        { label: 'Gift years', value: String(result.giftYears) },
        {
          label: 'Last gift',
          value: formatNominalReal(
            result.lastYearGiftOptimized.nominal,
            result.lastYearGiftOptimized.real,
          ),
        },
        {
          label: 'Total Crummey gifts',
          value: formatNominalReal(
            result.totalCrummeyGifts.nominal,
            result.totalCrummeyGifts.real,
          ),
        },
        {
          label: 'Trump path (direct + prefund)',
          value: formatNominalReal(
            result.trumpPathGifts.nominal,
            result.trumpPathGifts.real,
          ),
        },
        {
          label: 'Brokerage',
          value: formatNominalReal(
            result.brokeragePathGifts.nominal,
            result.brokeragePathGifts.real,
          ),
        },
      ],
      footnote:
        'Trump path is gift dollars routed directly to the Trump account or to prefund for later Trump slices. Prefund sweep at 18 is not a new gift. Federal seed is excluded.',
    },
    {
      title: 'Accounts',
      subsections: [
        {
          title: 'Trump account',
          items: [
            {
              label: 'Cumulative funding',
              value: formatNominalReal(
                result.trumpPathGifts.nominal,
                result.trumpPathGifts.real,
              ),
            },
            {
              label: 'Balance at 18',
              value: formatNominalReal(
                result.trumpBalanceAt18.nominal,
                result.trumpBalanceAt18.real,
              ),
            },
          ],
        },
        {
          title: 'Brokerage',
          items: [
            {
              label: 'Cumulative funding',
              value: formatNominalReal(
                brokerageAt18Row?.totalFunding.nominal ?? 0,
                brokerageAt18Row?.totalFunding.real ?? 0,
              ),
            },
            {
              label: 'Balance at 18',
              value: formatNominalReal(
                result.brokerageBalanceAt18.nominal,
                result.brokerageBalanceAt18.real,
              ),
            },
          ],
        },
      ],
      footnote:
        'Cumulative funding is gift contributions only. Federal seed is excluded. Trump funding may seem low due to prefund growth.',
    },
  ]
}

function brokerageTable(rows: BrokerageRow[]): ExportTable {
  const milestoneNote = `Milestone balances at ages ${BALANCE_AGES.join(', ')} (market growth only)`
  const body: ExportTableRow[] = []

  for (const row of rows) {
    if (row.age === BALANCE_AGES.find((age) => age > END_AGE)) {
      body.push({ kind: 'span', text: milestoneNote })
    }
    body.push({
      kind: 'data',
      cells: [
        String(row.age),
        brokerageFundingCell(row),
        exportCell(row.totalFunding),
        exportCell(row.balance),
      ],
    })
  }

  return {
    title: 'Brokerage',
    headers: ['Age', 'Funding', 'Total funding', 'Balance'],
    rows: body,
    footnote:
      'Funding is gift deposits to brokerage each year; age 18 shows prefund sweep. Total funding is cumulative gift contributions only. All values nominal (real).',
  }
}

export function buildExportDocument(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): ExportDocument {
  const tables: ExportTable[] = []
  const giftTable = giftInflowsTable(result.giftInflows)
  if (giftTable) tables.push(giftTable)
  tables.push(trumpTable(result.trumpRows))
  tables.push(brokerageTable(result.brokerageRows))

  return {
    title: 'Trust Fund Kid Modeler',
    overviewBullets: TRUST_ATTRIBUTES,
    generatedAt: new Date().toLocaleString(),
    disclaimer: 'Estimates only - not legal, tax, or financial advice.',
    warning: result.warning,
    summaryGroups: buildSummaryGroups(inputs, result),
    tables,
  }
}

export function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `trust-fund-kid-modeler-${date}`
}
