import { buildExportDocument, buildSummaryGroups, REAL_VALUES_NOTE } from './export-data'
import {
  type BalanceYearRow,
  type CalculatorInputs,
  type CalculatorResult,
  type IraBalanceRow,
} from './calculator'
import { formatCurrency, formatNominalReal } from './shared/money'

function contributionFootnote(indexed: boolean, prefund: boolean): string {
  const contrib = indexed
    ? 'Year-end contributions for 18 years from starting age, each indexed by CPI.'
    : 'Year-end contributions for 18 years from starting age, fixed at the entered amount.'
  if (!prefund) return contrib
  return `${contrib} Prefund withdraws each contribution from the funding account, then the remainder grows at the market rate.`
}

function renderSummaryGroup(
  title: string,
  items: { label: string; value: string }[],
  footnote?: string,
): string {
  const footnoteClass = title === 'Summary' && footnote ? 'prefund-summary' : 'footnote'
  return `
    <div class="result-group">
      <h3 class="result-group-heading">${title}</h3>
      <dl class="projection-inputs">
        ${items
          .map(
            (item) => `
          <div><dt>${item.label}</dt><dd>${item.value}</dd></div>
        `,
          )
          .join('')}
      </dl>
      ${footnote ? `<p class="${footnoteClass}">${footnote}</p>` : ''}
    </div>
  `
}

function renderBalanceTable(
  rows: BalanceYearRow[],
  indexed: boolean,
  showFunding: boolean,
): string {
  const fundingHeader = showFunding
    ? '<th scope="col">Funding account</th>'
    : ''

  return `
    <h3 class="form-section-heading">Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Contribution</th>
            ${fundingHeader}
            <th scope="col">Principal</th>
            <th scope="col">Account balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => {
              const fundingCell =
                showFunding && row.fundingBalance !== null
                  ? `<td>${formatCurrency(row.fundingBalance)}</td>`
                  : showFunding
                    ? '<td>-</td>'
                    : ''
              return `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${row.contribution > 0 ? formatCurrency(row.contribution) : '-'}</td>
              ${fundingCell}
              <td>${formatCurrency(row.principalBalance)}</td>
              <td>${formatNominalReal(row.accountBalance, row.realValue)}</td>
            </tr>
          `
            })
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      ${contributionFootnote(indexed, showFunding)} Principal is cumulative
      contributions (basis); starting balance has no basis.
      ${showFunding ? ' Funding account is the year-end balance after withdrawal and growth.' : ''}
    </p>
  `
}

function renderIraTable(rows: IraBalanceRow[]): string {
  return `
    <h3 class="form-section-heading">IRA Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${formatNominalReal(row.nominal, row.real)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Traditional IRA balance at each age if left from age 18, growing at the market
      rate assumption with no withdrawals.
    </p>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-export="pdf">Download PDF</button>
      <span class="export-hint">PDF is generated in your browser - no print dialog.</span>
    </div>
  `
}

function renderReportBody(inputs: CalculatorInputs, result: CalculatorResult): string {
  const showFunding = inputs.enablePrefund && result.requiredPrefund !== null
  const summaryGroups = buildSummaryGroups(inputs, result)

  return `
    <div class="results-summary">
      ${summaryGroups.map((group) => renderSummaryGroup(group.title, group.items, group.footnote)).join('')}
    </div>
    <h3 class="results-calculations-heading">Results</h3>
    <p class="footnote results-real-note">${REAL_VALUES_NOTE}</p>
    <div class="results-calculations">
      ${renderBalanceTable(result.balanceRows, inputs.contributionInflationIndexed, showFunding)}
      ${renderIraTable(result.iraRows)}
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
  const storageKey = 'trump-account-modeler-deluxe:inputs'
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      for (const [k, v] of Object.entries(vals)) {
        const el = form.elements.namedItem(k)
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox') {
            el.checked = v === 'on' || v === 'true'
          } else {
            el.value = String(v)
          }
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
        data[el.name] = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value
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

    if (button.dataset.export === 'pdf') {
      void runExport(button, async () => {
        const { downloadPdfReport } = await import('./export-download')
        await downloadPdfReport(buildExportDocument(inputs, result))
      })
    }
  })

  render()
}
