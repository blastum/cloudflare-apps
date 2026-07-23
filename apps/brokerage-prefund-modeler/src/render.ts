import {
  type AccountYearRow,
  type CalculatorInputs,
  type CalculatorResult,
  type ChildSummary,
} from './calculator'
import { TARGET_AGE } from './constants'
import { formatCurrency, formatNominalReal, formatPct } from './shared/money'

function renderPrefundSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  const childWord = inputs.childCount === 1 ? 'child' : 'children'
  return `
    <p class="prefund-summary">
      Deposit <strong>${formatCurrency(result.totalFundedNominal)}</strong> total
      at year <strong>${result.fundingYear}</strong> for
      <strong>${inputs.childCount} ${childWord}</strong>, each reaching
      <strong>${formatCurrency(inputs.targetRealAtAge21)} real</strong> at age ${TARGET_AGE}.
      Year 0 is first birth; spacing ${inputs.childSpacingYears} yr.
    </p>
  `
}

function renderInputsSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${inputs.childCount}</dd></div>
      <div><dt>Spacing</dt><dd>${inputs.childSpacingYears} yr</dd></div>
      <div><dt>Funding year</dt><dd>${result.fundingYear}</dd></div>
      <div><dt>Target at age ${TARGET_AGE}</dt><dd>${formatCurrency(inputs.targetRealAtAge21)} real</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
    </dl>
  `
}

function renderChildTable(children: ChildSummary[]): string {
  return `
    <h3 class="form-section-heading">Per child</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Birth year</th>
            <th scope="col">Deposit</th>
            <th scope="col">Balance at age ${TARGET_AGE}</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${child.birthYear}</td>
              <td>${formatCurrency(child.depositAtFunding)}</td>
              <td>${formatNominalReal(child.balanceAt21Nominal, child.balanceAt21Real)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Separate lump-sum at the funding year (nominal). Amounts differ so each hits the same
      real target. Balance shows nominal (real in year-0 dollars).
    </p>
  `
}

function renderAccountTable(
  rows: AccountYearRow[],
  childCount: number,
): string {
  const childNumbers = Array.from({ length: childCount }, (_, i) => i + 1)

  return `
    <h3 class="form-section-heading">Brokerage accounts by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            ${childNumbers.map((n) => `<th scope="col">Child ${n}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.modelYear}</th>
              ${childNumbers
                .map((n) => {
                  const entry = row.balances.find((b) => b.childNumber === n)
                  return `<td>${entry ? formatNominalReal(entry.nominal, entry.real) : '—'}</td>`
                })
                .join('')}
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Year-end balances from the funding year through each child's age ${TARGET_AGE}.
      Year 0 is first birth. Values show nominal (real in year-0 dollars).
    </p>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-print-summary>Print summary</button>
      <span class="export-hint">Summary only — opens your browser print dialog.</span>
    </div>
  `
}

function renderSummaryBody(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  return `
    <h2 class="print-only-heading">Brokerage Prefund Modeler</h2>
    <div class="results-summary">
      <section class="result-group">
        <h3 class="result-group-heading">Summary</h3>
        ${renderPrefundSummary(inputs, result)}
      </section>
      <section class="result-group result-group--assumptions">
        <h3 class="result-group-heading">Assumptions</h3>
        ${renderInputsSummary(inputs, result)}
      </section>
    </div>
    <section class="result-group">
      ${renderChildTable(result.children)}
    </section>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderExportToolbar()}
    ${renderSummaryBody(inputs, result)}
    <h3 class="results-calculations-heading no-print">Year-by-year balances</h3>
    <div class="results-calculations no-print">
      ${renderAccountTable(result.accountRows, inputs.childCount)}
    </div>
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'brokerage-prefund-modeler:inputs'

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      if (vals.fundingYear == null && vals.fundingYearDelta != null) {
        vals.fundingYear = vals.fundingYearDelta
        delete vals.fundingYearDelta
      }
      if (vals.fundingYear == null && vals.yearsBeforeFirstBirth != null) {
        const years = Number(vals.yearsBeforeFirstBirth)
        if (Number.isFinite(years)) {
          vals.fundingYear = String(-Math.round(years))
        }
        delete vals.yearsBeforeFirstBirth
      }
      for (const [k, v] of Object.entries(vals)) {
        if (k === 'yearsBeforeFirstBirth' || k === 'fundingYearDelta') continue
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

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!target.closest('[data-print-summary]')) return
    window.print()
  })

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
