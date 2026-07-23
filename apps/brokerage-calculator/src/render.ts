import { formatCurrency } from './shared/money'
import { type CalculatorInputs, type CalculatorResult, type YearRow } from './calculator'

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function renderYearTable(rows: YearRow[]): string {
  return `
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Contribution</th>
            <th scope="col">Balance</th>
            <th scope="col">Total contributed</th>
            <th scope="col">Earnings</th>
            <th scope="col">Real value</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.year}</th>
              <td>${formatCurrency(row.contribution)}</td>
              <td>${formatCurrency(row.balance)}</td>
              <td>${formatCurrency(row.totalContributions)}</td>
              <td>${formatCurrency(row.earnings)}</td>
              <td>${formatCurrency(row.realValue)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Year-end contributions, then growth at the expected return. Year 0 is the opening
      balance. Real value is in today's dollars, adjusted for expected inflation.
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
      <div><dt>Initial investment</dt><dd>${formatCurrency(inputs.initialInvestment)}</dd></div>
      <div><dt>Annual addition</dt><dd>${formatCurrency(inputs.annualAddition)}</dd></div>
      <div><dt>Projection years</dt><dd>${inputs.years}</dd></div>
      <div><dt>Expected return</dt><dd>${formatPct(inputs.expectedReturn)}/yr</dd></div>
      <div><dt>Expected inflation</dt><dd>${formatPct(inputs.expectedInflation)}/yr</dd></div>
      <div class="result-emphasis"><dt>Final balance</dt><dd>${formatCurrency(result.finalBalance)}</dd></div>
      <div class="result-emphasis"><dt>Final real value</dt><dd>${formatCurrency(result.finalRealValue)}</dd></div>
      <div><dt>Total contributed</dt><dd>${formatCurrency(result.totalContributions)}</dd></div>
      <div><dt>Total earnings</dt><dd>${formatCurrency(result.totalEarnings)}</dd></div>
    </dl>
  `

  container.innerHTML = `
    ${summary}
    <h3 class="form-section-heading">Balance by year</h3>
    ${renderYearTable(result.yearRows)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'brokerage-calculator:inputs'
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
  render()
}
