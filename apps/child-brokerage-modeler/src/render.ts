import { formatCurrency } from './shared/money'
import {
  type CalculatorInputs,
  type CalculatorResult,
  type MilestoneRow,
  type YearRow,
} from './calculator'
import { DEFAULT_CONTRIBUTIONS } from './constants'

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function renderMilestoneTable(rows: MilestoneRow[]): string {
  return `
    <h3 class="form-section-heading">Value at key ages</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Account year</th>
            <th scope="col">Contributions to date</th>
            <th scope="col">Nominal balance</th>
            <th scope="col">Real balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${row.year}</td>
              <td>${formatCurrency(row.totalContributions)}</td>
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
      Nominal balance is the projected account value at each age. Real balance is in
      projection-start dollars (year 0), adjusted for the CPI assumption.
    </p>
  `
}

function renderYearTable(rows: YearRow[]): string {
  return `
    <h3 class="form-section-heading">Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Age</th>
            <th scope="col">Contribution</th>
            <th scope="col">Account balance</th>
            <th scope="col">Contributions</th>
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
              <td>${row.age}</td>
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
      Year-end contributions, then growth at the market rate. Contributions column is
      cumulative gifts deposited. Earnings is growth above starting balance and
      contributions. Real value is in year-0 dollars.
    </p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  const contributionSummary =
    inputs.contributions.length === 0
      ? 'None'
      : inputs.contributions
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((c) => `Yr ${c.year}: ${formatCurrency(c.amount)}`)
          .join('; ')

  const summary = `
    <dl class="projection-inputs">
      <div><dt>Starting age</dt><dd>${inputs.startingAge}</dd></div>
      <div><dt>Starting balance</dt><dd>${formatCurrency(inputs.startingBalance)}</dd></div>
      <div><dt>Total contributions</dt><dd>${formatCurrency(result.totalContributions)}</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
      <div><dt>Contributions by year</dt><dd class="projection-inputs-wide">${contributionSummary}</dd></div>
    </dl>
  `

  container.innerHTML = `
    ${summary}
    ${renderMilestoneTable(result.milestones)}
    ${renderYearTable(result.yearRows)}
  `
}

function nextContributionYear(form: HTMLFormElement): number {
  const years = readContributionYears(form)
  if (years.length === 0) return 0
  return Math.max(...years) + 1
}

function readContributionYears(form: HTMLFormElement): number[] {
  const rows = form.querySelectorAll<HTMLElement>('[data-contribution-row]')
  const years: number[] = []
  for (const row of rows) {
    const yearInput = row.querySelector<HTMLInputElement>('input[name="contribYear"]')
    if (!yearInput) continue
    years.push(Math.max(0, Math.round(Number(yearInput.value) || 0)))
  }
  return years
}

function renderContributionRow(year: number, amount: number): string {
  return `
    <div class="contribution-row" data-contribution-row>
      <label>
        Year
        <input type="number" name="contribYear" min="0" step="1" value="${year}" />
      </label>
      <label>
        Amount ($)
        <input type="number" name="contribAmount" min="0" step="1" value="${amount}" />
      </label>
      <button type="button" class="btn-remove" data-remove-contribution aria-label="Remove year ${year}">
        Remove
      </button>
    </div>
  `
}

function mountContributionRows(
  form: HTMLFormElement,
  container: HTMLElement,
  onChange: () => void,
): void {
  const addButton = form.querySelector<HTMLButtonElement>('[data-add-contribution]')
  if (!addButton) return

  addButton.addEventListener('click', () => {
    const year = nextContributionYear(form)
    container.insertAdjacentHTML('beforeend', renderContributionRow(year, 0))
    onChange()
  })

  container.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const removeButton = target.closest<HTMLButtonElement>('[data-remove-contribution]')
    if (!removeButton) return
    const row = removeButton.closest('[data-contribution-row]')
    if (!row) return
    row.remove()
    onChange()
  })

  container.addEventListener('input', onChange)
  container.addEventListener('change', onChange)
}

export function readContributions(form: HTMLFormElement): { year: number; amount: number }[] {
  const rows = form.querySelectorAll<HTMLElement>('[data-contribution-row]')
  const contributions: { year: number; amount: number }[] = []

  for (const row of rows) {
    const yearInput = row.querySelector<HTMLInputElement>('input[name="contribYear"]')
    const amountInput = row.querySelector<HTMLInputElement>('input[name="contribAmount"]')
    if (!yearInput || !amountInput) continue
    contributions.push({
      year: Math.max(0, Math.round(Number(yearInput.value) || 0)),
      amount: Math.max(0, Number(amountInput.value) || 0),
    })
  }

  return contributions
}

function renderContributionRows(contributions: { year: number; amount: number }[]): string {
  const sorted = contributions.slice().sort((a, b) => a.year - b.year)
  if (sorted.length === 0) {
    return renderContributionRow(0, 0)
  }
  return sorted.map((c) => renderContributionRow(c.year, c.amount)).join('')
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'child-brokerage-modeler:inputs'
  const contributionsEl = form.querySelector<HTMLElement>('#contributions-list')
  if (!contributionsEl) throw new Error('Missing contributions list')

  let savedContributions = DEFAULT_CONTRIBUTIONS

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      if (vals.contributions) {
        savedContributions = JSON.parse(vals.contributions) as {
          year: number
          amount: number
        }[]
      }
      for (const [k, v] of Object.entries(vals)) {
        if (k === 'contributions') continue
        const el = form.elements.namedItem(k)
        if (el instanceof HTMLInputElement) {
          el.value = String(v)
        }
      }
    }
  } catch {
    /* ignore */
  }

  contributionsEl.innerHTML = renderContributionRows(savedContributions)

  const save = () => {
    const data: Record<string, string> = {}
    for (const el of form.elements) {
      if (el instanceof HTMLInputElement && el.name && el.name !== 'contribYear' && el.name !== 'contribAmount') {
        data[el.name] = el.value
      }
    }
    data.contributions = JSON.stringify(readContributions(form))
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

  mountContributionRows(form, contributionsEl, render)
  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
