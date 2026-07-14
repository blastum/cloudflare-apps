import {
  type CalculatorInputs,
  type CalculatorResult,
  type ScenarioRow,
  scenarioTable,
} from './calculator'
import { formatCurrency } from './shared/money'

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

function renderScenarioTable(rows: ScenarioRow[], currentEstate: number): string {
  return `
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Tentative taxable estate</th>
            <th scope="col">Illinois estate tax</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr${row.estate === currentEstate ? ' class="row-highlight"' : ''}>
              <th scope="row">${formatCurrency(row.estate)}</th>
              <td>${formatCurrency(row.tax)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Adjusted taxable gifts held at $0 (estate size only). Illinois situs from your inputs.
      No tax at or below the $4M exclusion when gifts are $0. Row highlighted when it matches
      your estate size exactly.
    </p>
  `
}

function renderSchedule(result: CalculatorResult): string {
  return `
    <h3 class="form-section-heading">Form 700 Schedule A/B (simplified)</h3>
    <dl class="projection-inputs schedule-lines">
      <div><dt>Line 3 — Illinois tentative taxable estate</dt><dd>${formatCurrency(result.illinoisTentativeTaxableEstate)}</dd></div>
      <div><dt>Line 5 — Credit base plus gifts</dt><dd>${formatCurrency(result.creditBasePlusGifts)}</dd></div>
      <div><dt>Line 6 — Pre-apportionment tax</dt><dd>${formatCurrency(result.preApportionmentTax)}</dd></div>
      <div><dt>Line 9 — Illinois situs fraction</dt><dd>${formatPct(result.illinoisSitusFraction)}</dd></div>
      <div><dt>Line 10 — Illinois estate tax</dt><dd>${formatCurrency(result.illinoisEstateTax)}</dd></div>
      <div><dt>Taxable estate after iteration</dt><dd>${formatCurrency(result.taxableEstateAfterIteration)}</dd></div>
    </dl>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  const summary = `
    <dl class="projection-inputs">
      <div><dt>Tentative taxable estate</dt><dd>${formatCurrency(inputs.tentativeTaxableEstate)}</dd></div>
      <div><dt>Adjusted taxable gifts</dt><dd>${formatCurrency(inputs.adjustedTaxableGifts)}</dd></div>
      <div><dt>Illinois situs</dt><dd>${formatPct(inputs.illinoisSitusFraction)}</dd></div>
      <div class="result-emphasis"><dt>Illinois estate tax</dt><dd>${formatCurrency(result.illinoisEstateTax)}</dd></div>
      <div><dt>Effective rate</dt><dd>${formatPct(result.effectiveRate)}</dd></div>
    </dl>
  `

  container.innerHTML = `
    ${summary}
    ${renderSchedule(result)}
    <p class="footnote">
      <strong>Effective rate</strong> is Illinois estate tax divided by your tentative taxable estate
      (line 3) — tax as a share of the whole estate, not a marginal rate on dollars above the
      exclusion.
    </p>
    <p class="footnote">
      Illinois does <em>not</em> work like income tax (subtract an exemption, then multiply the
      remainder by a bracket rate). It uses the legacy IRC §2011 <strong>state death tax credit
      table</strong>, a built-in <strong>$4M exclusion</strong> (via the federal 40% cap on line
      5), and <strong>interrelated iteration</strong> (estate tax reduces the base used to compute
      tax). Adjusted taxable gifts on line 4 can trigger tax even when line 3 is at or below $4M.
      Educational estimate only — not legal or tax advice. Algorithm matches the Illinois Attorney
      General estate tax calculator.
      ${result.federalCapApplied ? ' Federal 40% cap applied.' : ''}
      Iterations: ${result.iterationCount}.
    </p>
  `
}

export function renderScenarios(
  container: HTMLElement,
  inputs: CalculatorInputs,
): void {
  const rows = scenarioTable(inputs.illinoisSitusFraction)
  container.innerHTML = renderScenarioTable(rows, inputs.tentativeTaxableEstate)
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  scenarios: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'illinois-estate-tax-modeler:inputs'
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
        } else if (el instanceof HTMLSelectElement) {
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
        data[el.name] =
          el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value
      } else if (el instanceof HTMLSelectElement && el.name) {
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
    renderScenarios(scenarios, inputs)
    save()
  }

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
