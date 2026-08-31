import { bindLiveForm } from '../../../shared/defer-form-paint'
import { bindCurrencyInputs, formatCurrencyInput, parseCurrencyInput } from '../../../shared/currency-input'
import { bindGrowthFields } from '../../../shared/growth-fields'
import { bindCalculatorReset } from '../../../shared/reset'
import { bindSteppers } from '../../../shared/stepper'
import { formatCurrency, formatNominalReal, formatPct } from '../../../shared/money'
import { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from '../../../shared/growth'
import { ANNUAL_DEFAULTS, DEFAULT_CONTRIBUTIONS, DEFAULTS, type ProjectionMode } from './constants'
import {
  type AnnualInputs,
  type AnnualResult,
  type AnnualYearRow,
  type CalculatorInputs,
  type CalculatorResult,
  type ChildInputs,
  type ChildResult,
  type ChildYearRow,
  type MilestoneRow,
} from './calculator'

const STORAGE_KEY = 'child-brokerage-modeler:inputs'
const LEGACY_ANNUAL_KEY = 'brokerage-calculator:inputs'

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
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${row.year}</td>
              <td>${formatNominalReal(row.totalContributionsNominal, row.totalContributionsReal)}</td>
              <td>${formatNominalReal(row.nominal, row.real)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Each amount is nominal (real in year-0 dollars). Real values use the CPI assumption.
    </p>
  `
}

function renderChildYearTable(rows: ChildYearRow[]): string {
  return `
    <h3 class="form-section-heading">Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Age</th>
            <th scope="col">Contribution</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.year}</th>
              <td>${row.age}</td>
              <td>${row.contribution > 0 ? formatNominalReal(row.contribution, row.contributionReal) : '—'}</td>
              <td>${formatNominalReal(row.accountBalance, row.realValue)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Year-end contribution, then growth at the market rate. Amounts are nominal (real in year-0 dollars).
    </p>
  `
}

function renderAnnualYearTable(rows: AnnualYearRow[]): string {
  return `
    <h3 class="form-section-heading">Balance by year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Contribution</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.year}</th>
              <td>${formatNominalReal(row.contribution, row.contributionReal)}</td>
              <td>${formatNominalReal(row.balance, row.realValue)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Year-end contribution, then growth at the expected return. Amounts are nominal (real in year-0 dollars).
    </p>
  `
}

function renderChildResults(inputs: ChildInputs, result: ChildResult): string {
  const contributionSummary =
    inputs.contributions.length === 0
      ? 'None'
      : inputs.contributions
          .slice()
          .sort((a, b) => a.year - b.year)
          .map((c) => {
            const label = inputs.contributionsInReal ? 'real' : 'nominal'
            return `Yr ${c.year}: ${formatCurrency(c.amount)} ${label}`
          })
          .join('; ')

  const totalContributionsReal = result.yearRows.reduce(
    (sum, r) => sum + r.contributionReal,
    0,
  )

  return `
    <dl class="projection-inputs">
      <div><dt>Starting age</dt><dd>${inputs.startingAge}</dd></div>
      <div><dt>Starting balance</dt><dd>${formatCurrency(inputs.startingBalance)}</dd></div>
      <div><dt>Total contributions</dt><dd>${formatNominalReal(result.totalContributions, totalContributionsReal)}</dd></div>
      <div><dt>Contributions in real dollars</dt><dd>${inputs.contributionsInReal ? 'Yes' : 'No'}</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
      <div><dt>Contributions by year</dt><dd class="projection-inputs-wide">${contributionSummary}</dd></div>
    </dl>
    ${renderMilestoneTable(result.milestones)}
    ${renderChildYearTable(result.yearRows)}
  `
}

function renderAnnualResults(inputs: AnnualInputs, result: AnnualResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Initial investment</dt><dd>${formatCurrency(inputs.initialInvestment)}</dd></div>
      <div><dt>Annual addition</dt><dd>${formatCurrency(inputs.annualAddition)}</dd></div>
      <div><dt>Projection years</dt><dd>${inputs.years}</dd></div>
      <div><dt>Average market growth</dt><dd>${formatPct(inputs.expectedReturn)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.expectedInflation)}/yr</dd></div>
      <div class="result-emphasis"><dt>Final balance</dt><dd>${formatNominalReal(result.finalBalance, result.finalRealValue)}</dd></div>
      <div><dt>Total contributed</dt><dd>${formatNominalReal(result.totalContributions, result.yearRows.reduce((s, r) => s + r.contributionReal, 0))}</dd></div>
    </dl>
    ${renderAnnualYearTable(result.yearRows)}
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  if (inputs.mode === 'annual' && result.mode === 'annual') {
    container.innerHTML = renderAnnualResults(inputs, result)
    return
  }
  if (inputs.mode === 'child' && result.mode === 'child') {
    container.innerHTML = renderChildResults(inputs, result)
    return
  }
  container.innerHTML = ''
}

function lastContributionDefaults(form: HTMLFormElement): { year: number; amount: number } {
  const rows = form.querySelectorAll<HTMLElement>('[data-contribution-row]')
  const last = rows[rows.length - 1]
  if (!last) {
    return { year: 0, amount: DEFAULT_CONTRIBUTIONS[0]?.amount ?? 5000 }
  }
  const yearInput = last.querySelector<HTMLInputElement>('input[name="contribYear"]')
  const amountInput = last.querySelector<HTMLInputElement>('input[name="contribAmount"]')
  const year = Math.max(0, Math.round(Number(yearInput?.value) || 0))
  const amountRaw = parseCurrencyInput(amountInput?.value ?? '')
  const amount =
    Number.isFinite(amountRaw) && amountRaw > 0
      ? amountRaw
      : (DEFAULT_CONTRIBUTIONS[0]?.amount ?? 5000)
  return { year: year + 1, amount }
}

let contributionRowSeq = 0

function renderContributionRow(year: number, amount: number): string {
  contributionRowSeq += 1
  const yearId = `contrib-year-${contributionRowSeq}`
  const amountId = `contrib-amount-${contributionRowSeq}`
  return `
    <div class="contribution-row" data-contribution-row>
      <div class="form-field">
        <label for="${yearId}">Year</label>
        <input id="${yearId}" type="number" name="contribYear" min="0" step="1" value="${year}" autocomplete="off" />
      </div>
      <div class="form-field">
        <label for="${amountId}">Amount ($)</label>
        <input id="${amountId}" type="text" inputmode="numeric" class="input-currency" name="contribAmount" value="${formatCurrencyInput(amount)}" autocomplete="off" />
      </div>
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
    const { year, amount } = lastContributionDefaults(form)
    container.insertAdjacentHTML('beforeend', renderContributionRow(year, amount))
    const row = container.querySelector<HTMLElement>('[data-contribution-row]:last-child')
    if (row) {
      bindSteppers(row, onChange)
      bindCurrencyInputs(row)
    }
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
      amount: Math.max(0, parseCurrencyInput(amountInput.value)),
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

export function parseMode(value: string | null | undefined): ProjectionMode {
  return value === 'annual' ? 'annual' : 'child'
}

export function modeFromUrl(): ProjectionMode | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('mode')
  if (raw === 'annual' || raw === 'child') return raw
  return null
}

export function writeModeToUrl(mode: ProjectionMode): void {
  const url = new URL(window.location.href)
  if (mode === 'child') url.searchParams.delete('mode')
  else url.searchParams.set('mode', mode)
  history.replaceState(null, '', url)
}

function applyModeToDom(form: HTMLFormElement, mode: ProjectionMode): void {
  for (const button of form.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    const selected = button.dataset.mode === mode
    button.setAttribute('aria-selected', selected ? 'true' : 'false')
  }
  for (const panel of form.querySelectorAll<HTMLElement>('[data-mode-panel]')) {
    panel.hidden = panel.dataset.modePanel !== mode
  }
}

function readStoredRecord(): Record<string, string> {
  const merged: Record<string, string> = {}
  try {
    const legacy = localStorage.getItem(LEGACY_ANNUAL_KEY)
    if (legacy) Object.assign(merged, JSON.parse(legacy) as Record<string, string>)
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) Object.assign(merged, JSON.parse(saved) as Record<string, string>)
  } catch {
    /* ignore */
  }
  return merged
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: (mode: ProjectionMode) => CalculatorInputs,
): void {
  const contributionsEl = form.querySelector<HTMLElement>('#contributions-list')
  if (!contributionsEl) throw new Error('Missing contributions list')

  const stored = readStoredRecord()
  let savedContributions = DEFAULT_CONTRIBUTIONS
  if (stored.contributions) {
    try {
      savedContributions = JSON.parse(stored.contributions) as {
        year: number
        amount: number
      }[]
    } catch {
      /* keep defaults */
    }
  }

  for (const [k, v] of Object.entries(stored)) {
    if (k === 'contributions' || k === 'mode') continue
    const el = form.elements.namedItem(k)
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = v === '1' || v === 'true'
    } else if (el instanceof HTMLInputElement) {
      el.value = String(v)
    }
  }

  contributionsEl.innerHTML = renderContributionRows(savedContributions)

  bindCurrencyInputs(contributionsEl)

  let mode = modeFromUrl() ?? parseMode(stored.mode)
  applyModeToDom(form, mode)
  writeModeToUrl(mode)

  const save = () => {
    const data: Record<string, string> = { mode }
    for (const el of form.elements) {
      if (!(el instanceof HTMLInputElement) || !el.name) continue
      if (el.name === 'contribYear' || el.name === 'contribAmount') continue
      if (el.type === 'checkbox') {
        if (el.checked) data[el.name] = '1'
      } else {
        data[el.name] = el.value
      }
    }
    data.contributions = JSON.stringify(readContributions(form))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }

  const render = () => {
    const inputs = readInputs(mode)
    renderResults(results, inputs, calculate(inputs))
    save()
  }

  const setMode = (next: ProjectionMode) => {
    if (next === mode) return
    mode = next
    applyModeToDom(form, mode)
    writeModeToUrl(mode)
    render()
  }

  form.querySelector('.mode-toggle')?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLButtonElement>('[data-mode]')
    if (!button?.dataset.mode) return
    setMode(parseMode(button.dataset.mode))
  })

  mountContributionRows(form, contributionsEl, render)
  bindSteppers(form, render)
  bindCurrencyInputs(form)
  bindGrowthFields(form, render)
  bindLiveForm(form, render)
  bindCalculatorReset({
    form,
    storageKeys: [STORAGE_KEY, LEGACY_ANNUAL_KEY],
    fieldDefaults: {
      startingAge: String(DEFAULTS.startingAge),
      startingBalance: String(DEFAULTS.startingBalance),
      cpiRate: String(DEFAULT_CPI_PCT),
      marketRate: String(DEFAULT_MARKET_PCT),
      initialInvestment: String(ANNUAL_DEFAULTS.initialInvestment),
      annualAddition: String(ANNUAL_DEFAULTS.annualAddition),
      years: String(ANNUAL_DEFAULTS.years),
      expectedReturn: String(DEFAULT_MARKET_PCT),
      expectedInflation: String(DEFAULT_CPI_PCT),
      contributionsInReal: '',
    },
    onReset: () => {
      contributionsEl.innerHTML = renderContributionRows(DEFAULT_CONTRIBUTIONS)
      bindSteppers(contributionsEl, render)
      bindCurrencyInputs(contributionsEl)
      const realBox = form.elements.namedItem('contributionsInReal')
      if (realBox instanceof HTMLInputElement) realBox.checked = false
    },
    paint: render,
  })
  render()
}
