import { formatCurrency } from './shared/money'
import {
  type BalanceYearRow,
  type CalculatorInputs,
  type CalculatorResult,
  type ConversionScenarioRow,
  type IraBalanceRow,
} from './calculator'

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function contributionFootnote(indexed: boolean): string {
  if (indexed) {
    return 'Year-end contributions for 18 years from starting age, each indexed by CPI.'
  }
  return 'Year-end contributions for 18 years from starting age, fixed at the entered amount.'
}

function renderBalanceTable(rows: BalanceYearRow[], indexed: boolean): string {
  return `
    <h3 class="form-section-heading">Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Contribution</th>
            <th scope="col">Account balance</th>
            <th scope="col">Principal</th>
            <th scope="col">Earnings</th>
            <th scope="col">Real value</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${row.contribution > 0 ? formatCurrency(row.contribution) : '—'}</td>
              <td>${formatCurrency(row.accountBalance)}</td>
              <td>${formatCurrency(row.principalBalance)}</td>
              <td>${formatCurrency(row.earningsBalance)}</td>
              <td>${formatCurrency(row.realValue)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      ${contributionFootnote(indexed)} Principal is cumulative contributions (basis); starting
      balance has no basis. Real value is in projection-start dollars.
    </p>
  `
}

function formatYearlyCell(values: number[]): string {
  return values.map((v) => formatCurrency(v)).join('<br>')
}

function formatYearlyTaxCell(nominal: number[], real: number[]): string {
  return nominal
    .map((v, i) => `${formatCurrency(v)} (${formatCurrency(real[i] ?? 0)})`)
    .join('<br>')
}

function formatTaxTotal(nominal: number, real: number): string {
  return `${formatCurrency(nominal)} (${formatCurrency(real)})`
}

function formatYearlyBracketCell(rates: number[]): string {
  return rates.map((r) => formatPct(r)).join('<br>')
}

function renderConversionTable(rows: ConversionScenarioRow[]): string {
  return `
    <h3 class="form-section-heading">Roth conversion cost</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Years</th>
            <th scope="col">Amount</th>
            <th scope="col">Taxable</th>
            <th scope="col">Tax</th>
            <th scope="col">Max bracket</th>
            <th scope="col">Total tax</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.conversionYears}</th>
              <td class="cell-lines">${formatYearlyCell(row.yearlyAmounts)}</td>
              <td class="cell-lines">${formatYearlyCell(row.yearlyTaxable)}</td>
              <td class="cell-lines">${formatYearlyTaxCell(row.yearlyTaxes, row.yearlyTaxesReal)}</td>
              <td class="cell-lines">${formatYearlyBracketCell(row.yearlyMaxMarginalRates)}</td>
              <td>${formatTaxTotal(row.totalTaxPaid, row.totalTaxPaidReal)}<br><span class="field-hint">Peak ${formatPct(row.maxMarginalRate)}</span></td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Conversions start at age 18. Multi-year paths equalize taxable income each year (after
      standard deduction) to minimize total federal tax; the final year converts any remainder.
      Unconverted balance grows at market rate between years. Max bracket is the highest marginal
      rate on conversion income that year. Tax shows nominal with projection-start dollars in
      parentheses. Federal single filer, $0 other income; 2026 brackets and $16,100 standard
      deduction indexed by the CPI assumption from projection start.
    </p>
  `
}

function renderIraTable(rows: IraBalanceRow[]): string {
  return `
    <h3 class="form-section-heading">IRA balance — no conversion</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Nominal</th>
            <th scope="col">Real</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${formatCurrency(row.nominal)}</td>
              <td>${formatCurrency(row.real)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Traditional IRA balance at each age if left unconverted from age 18, growing at the market
      rate assumption with no withdrawals. Real values are in projection-start dollars.
    </p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  const summary = `
    <dl class="projection-inputs">
      <div><dt>Starting age</dt><dd>${inputs.startingAge}</dd></div>
      <div><dt>Starting balance</dt><dd>${formatCurrency(inputs.startingBalance)} (no basis)</dd></div>
      <div><dt>Annual contribution</dt><dd>${formatCurrency(inputs.annualContribution)}/yr${inputs.contributionInflationIndexed ? ' (indexed)' : ' (fixed)'}</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Balance at age 18</dt><dd>${formatCurrency(result.age18Balance)}</dd></div>
    </dl>
  `

  container.innerHTML = `
    ${summary}
    ${renderBalanceTable(result.balanceRows, inputs.contributionInflationIndexed)}
    ${renderConversionTable(result.conversionRows)}
    ${renderIraTable(result.iraRows)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'trump-account-modeler:inputs'
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
  render()
}
