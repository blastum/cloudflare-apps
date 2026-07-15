import { BALANCE_AGES, END_AGE } from './constants'
import { formatNominalReal } from './shared/money'
import { buildExportDocument, buildSummaryGroups, type SummaryGroup } from './export-data'
import { TRUST_ATTRIBUTES, TRUST_SYNOPSIS } from './brand'
import {
  type BrokerageRow,
  type CalculatorInputs,
  type CalculatorResult,
  type GiftInflowRow,
  type TrumpRow,
} from './calculator'

function cell(pair: { nominal: number; real: number }): string {
  if (pair.nominal === 0 && pair.real === 0) return '—'
  return formatNominalReal(pair.nominal, pair.real)
}

const MILESTONE_AGES = new Set<number>(BALANCE_AGES.filter((age) => age > END_AGE))

function milestoneSeparatorRow(colspan: number): string {
  return `
    <tr class="milestone-separator">
      <td colspan="${colspan}">Balances at ages ${BALANCE_AGES.join(', ')} (market growth only)</td>
    </tr>
  `
}

function formatFundingSource(source: TrumpRow['fundingSource']): string {
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
      return '—'
  }
}

function renderSummaryItems(items: SummaryGroup['items']): string {
  return `
    <dl class="projection-inputs">
      ${(items ?? [])
        .map(
          (item) => `
        <div><dt>${item.label}</dt><dd>${item.value}</dd></div>
      `,
        )
        .join('')}
    </dl>
  `
}

function renderSummaryGroup(group: SummaryGroup): string {
  const layoutClass =
    group.title === 'Parameters'
      ? ' result-group--parameters'
      : group.subsections
        ? ' result-group--accounts'
        : ''
  const subsections = group.subsections
    ? group.subsections
        .map(
          (subsection) => `
        <div class="result-subgroup">
          <h4 class="result-subgroup-heading">${subsection.title}</h4>
          ${renderSummaryItems(subsection.items)}
        </div>
      `,
        )
        .join('')
    : renderSummaryItems(group.items)

  return `
    <section class="result-group${layoutClass}">
      <h3 class="result-group-heading">${group.title}</h3>
      ${subsections}
      ${
        group.footnote
          ? `<p class="footnote">${group.footnote}</p>`
          : ''
      }
    </section>
  `
}

function renderGiftInflowsTable(rows: GiftInflowRow[]): string {
  if (rows.length === 0) {
    return `
      <section class="result-group">
        <h3 class="result-group-heading">Gift inflows</h3>
        <p class="footnote">No gift years in this scenario.</p>
      </section>
    `
  }

  return `
    <section class="result-group">
      <h3 class="result-group-heading">Gift inflows</h3>
      <div class="table-wrap">
        <table class="projection-table">
          <thead>
            <tr>
              <th scope="col">Age</th>
              <th scope="col">Gift</th>
              <th scope="col">→ Trump</th>
              <th scope="col">→ Brokerage</th>
              <th scope="col">→ Prefund</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                <th scope="row">${row.age}</th>
                <td>${cell(row.gift)}</td>
                <td>${cell(row.toTrump)}</td>
                <td>${cell(row.toBrokerage)}</td>
                <td>${cell(row.toPrefund)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="footnote">
        Years when Crummey gifts are made. The last gift year is trimmed to the minimum needed so
        prefund lands near zero at 17. Each cell shows nominal (real) dollars.
      </p>
    </section>
  `
}

function renderTrumpTable(rows: TrumpRow[]): string {
  return `
    <section class="result-group">
      <h3 class="result-group-heading">Trump account</h3>
      <div class="table-wrap">
        <table class="projection-table">
          <thead>
            <tr>
              <th scope="col">Age</th>
              <th scope="col">Slice</th>
              <th scope="col">Seed</th>
              <th scope="col">Funding source</th>
              <th scope="col">Prefund balance</th>
              <th scope="col">Trump balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => {
                const separator =
                  row.age === BALANCE_AGES.find((age) => age > END_AGE)
                    ? milestoneSeparatorRow(6)
                    : ''
                return `
              ${separator}
              <tr${MILESTONE_AGES.has(row.age) ? ' class="milestone-row"' : ''}>
                <th scope="row">${row.age}</th>
                <td>${cell(row.slice)}</td>
                <td>${cell(row.seedDeposit)}</td>
                <td>${formatFundingSource(row.fundingSource)}</td>
                <td>${cell(row.prefundBalance)}</td>
                <td>${cell(row.balance)}</td>
              </tr>
            `
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="footnote">
        Annual trump slice from starting age through 17. Seed is a one-time federal deposit at account
        open. Age 18 has no slice or funding but trump still compounds. Prefund balance is after
        annual growth; age 18 shows zero after prefund sweep to brokerage. Milestone rows (ages
        ${BALANCE_AGES.filter((age) => age > END_AGE).join(', ')}) project balance only at market return.
      </p>
    </section>
  `
}

function brokerageFundingCell(row: BrokerageRow): string {
  if (row.age === END_AGE) {
    if (row.funding.nominal === 0 && row.funding.real === 0) return '—'
    return `(prefund) ${formatNominalReal(row.funding.nominal, row.funding.real)}`
  }
  return cell(row.funding)
}

function renderBrokerageTable(rows: BrokerageRow[]): string {
  return `
    <section class="result-group">
      <h3 class="result-group-heading">Brokerage</h3>
      <div class="table-wrap">
        <table class="projection-table">
          <thead>
            <tr>
              <th scope="col">Age</th>
              <th scope="col">Funding</th>
              <th scope="col">Total funding</th>
              <th scope="col">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => {
                const separator =
                  row.age === BALANCE_AGES.find((age) => age > END_AGE)
                    ? milestoneSeparatorRow(4)
                    : ''
                return `
              ${separator}
              <tr${MILESTONE_AGES.has(row.age) ? ' class="milestone-row"' : ''}>
                <th scope="row">${row.age}</th>
                <td>${brokerageFundingCell(row)}</td>
                <td>${cell(row.totalFunding)}</td>
                <td>${cell(row.balance)}</td>
              </tr>
            `
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="footnote">
        Funding is gift deposits to brokerage each year; age 18 shows prefund sweep. Total funding is
        cumulative gift contributions only (prefund sweep is not a new gift). Age 18 balance includes
        annual market growth plus prefund sweep. Milestone rows (ages
        ${BALANCE_AGES.filter((age) => age > END_AGE).join(', ')}) project balance only at market return.
        All values nominal (real).
      </p>
    </section>
  `
}

function renderTrustAttributesList(attributes: readonly string[], className: string): string {
  return `
    <ul class="${className}">
      ${attributes.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `
}

function renderReportBody(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const warning = result.warning
    ? `<p class="warning" role="status">${result.warning}</p>`
    : ''

  const summaryGroups = buildSummaryGroups(inputs, result)

  return `
    ${warning}
    <p class="hero-synopsis print-only-attributes">${TRUST_SYNOPSIS}</p>
    ${renderTrustAttributesList(TRUST_ATTRIBUTES, 'print-only-attributes hero-attributes')}
    <h2 class="print-only-heading">Summary</h2>
    <div class="results-summary">
      ${summaryGroups.map(renderSummaryGroup).join('')}
    </div>
    <h3 class="results-calculations-heading">Calculations</h3>
    <div class="results-calculations">
      ${renderGiftInflowsTable(result.giftInflows)}
      ${renderTrumpTable(result.trumpRows)}
      ${renderBrokerageTable(result.brokerageRows)}
    </div>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-export="pdf">Download PDF</button>
      <span class="export-hint">PDF is generated in your browser — no print dialog.</span>
    </div>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderExportToolbar()}
    ${renderReportBody(inputs, result)}
  `
}

export function reportBodyHtml(inputs: CalculatorInputs, result: CalculatorResult): string {
  return renderReportBody(inputs, result)
}

async function runExport(
  button: HTMLButtonElement,
  action: () => void | Promise<void>,
): Promise<void> {
  const label = button.textContent ?? 'Export'
  button.disabled = true
  button.textContent = 'Generating…'
  try {
    await action()
  } finally {
    button.disabled = false
    button.textContent = label
  }
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'trust-fund-kid-modeler:inputs'

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      for (const [k, v] of Object.entries(vals)) {
        const el = form.elements.namedItem(k)
        if (el instanceof HTMLInputElement) {
          el.value = String(v)
        }
      }
    }
  } catch {
    /* ignore */
  }

  const save = () => {
    const data: Record<string, string> = {}
    for (const el of form.elements) {
      if (el instanceof HTMLInputElement && el.name) {
        data[el.name] = el.value
      }
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }

  const render = () => {
    const inputs = readInputs()
    renderResults(results, inputs, calculate(inputs))
    save()
  }

  form.addEventListener('input', render)
  form.addEventListener('change', render)

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLButtonElement>('[data-export]')
    if (!button || button.disabled) return

    const inputs = readInputs()
    const result = calculate(inputs)
    const documentData = buildExportDocument(inputs, result)

    if (button.dataset.export === 'pdf') {
      void runExport(button, async () => {
        const { downloadPdfReport } = await import('./export-download')
        await downloadPdfReport(documentData)
      })
    }
  })

  render()
}
