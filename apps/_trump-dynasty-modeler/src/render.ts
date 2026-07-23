import {
  birthLabel,
  type CalculatorInputs,
  type CalculatorResult,
  type Milestone,
  type TimelineYear,
} from './calculator'
import { MAX_ANNUAL_CONTRIBUTION } from './constants'
import { formatCurrency, formatPctRate } from './shared/money'

function renderSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  const insolvency =
    result.insolvencyYear === null
      ? 'None in horizon'
      : `Year ${result.insolvencyYear}`

  const perpetual =
    result.perpetualThreshold === null
      ? 'n/a'
      : formatCurrency(result.perpetualThreshold)

  return `
    <dl class="projection-inputs">
      <div><dt>Real return</dt><dd>${formatPctRate(result.realRate)}/yr</dd></div>
      <div><dt>Single-life I<sub>min</sub></dt><dd>${formatCurrency(result.iMin)}</dd></div>
      <div><dt>Generations funded</dt><dd>${result.generationsFullyFunded} / ${inputs.maxGenerations}</dd></div>
      <div><dt>Total contributions paid</dt><dd>${formatCurrency(result.totalContributionsPaid)}</dd></div>
      <div><dt>Perpetual threshold</dt><dd>${perpetual}</dd></div>
      <div><dt>Ending balance</dt><dd>${formatCurrency(result.endingBalance)}</dd></div>
      <div><dt>First insolvency</dt><dd>${insolvency}</dd></div>
      <div><dt>Descendants modeled</dt><dd>${result.births.length}</dd></div>
    </dl>
    ${
      result.insolvencyYear !== null
        ? `<p class="warning">Endowment cannot cover max contributions in year ${result.insolvencyYear}.</p>`
        : ''
    }
    <p class="footnote">
      All figures in real (today&apos;s) dollars. Each active beneficiary withdraws
      ${formatCurrency(MAX_ANNUAL_CONTRIBUTION)}/year for ages 0–17. Timing is withdraw-then-grow.
      Family tree is branching: gen 1 has N children, then each person has N children.
      Perpetual threshold is the approximate initial deposit that funds indefinitely for this
      family shape.
    </p>
  `
}

function renderMilestones(milestones: Milestone[]): string {
  return `
    <h3 class="form-section-heading">Milestones</h3>
    <div class="table-wrap">
      <table class="projection-table milestone-table">
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Year</th>
            <th scope="col">Endowment</th>
          </tr>
        </thead>
        <tbody>
          ${milestones
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.label}</th>
              <td>${row.year}</td>
              <td>${formatCurrency(row.balance)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderTimeline(timeline: TimelineYear[]): string {
  const rows = timeline.filter(
    (row) =>
      row.withdrawal > 0 ||
      row.births.length > 0 ||
      row.year === 0 ||
      row.insolvent ||
      row.year % 5 === 0,
  )

  return `
    <h3 class="form-section-heading">Endowment timeline</h3>
    <p class="matrix-caption">
      Showing years with births, withdrawals, insolvency, year 0, or multiples of 5
      (${rows.length} of ${timeline.length} years).
    </p>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Start</th>
            <th scope="col">Active</th>
            <th scope="col">Withdrawal</th>
            <th scope="col">End</th>
            <th scope="col">Births</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => {
              const birthText =
                row.births.length === 0
                  ? '—'
                  : row.births.map((b) => birthLabel(b)).join(', ')
              const cls = row.insolvent ? ' class="row-insolvent"' : ''
              return `
            <tr${cls}>
              <th scope="row">${row.year}</th>
              <td>${formatCurrency(row.balanceStart)}</td>
              <td>${row.activeBeneficiaries}</td>
              <td>${row.withdrawal > 0 ? formatCurrency(row.withdrawal) : '—'}</td>
              <td>${formatCurrency(row.balanceEnd)}</td>
              <td>${birthText}</td>
            </tr>
          `
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderSummary(inputs, result)}
    ${renderMilestones(result.milestones)}
    ${renderTimeline(result.timeline)}
  `
}

function syncSliderOutput(form: HTMLFormElement, name: string): void {
  const input = form.elements.namedItem(name)
  const output = form.querySelector<HTMLOutputElement>(`output[for="${name}"]`)
  if (!(input instanceof HTMLInputElement) || !output) return
  output.value = input.value
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'trump-dynasty-modeler:inputs'
  const sliderNames = [
    'generationalGap',
    'childrenPerGeneration',
    'childSpacing',
    'maxGenerations',
    'yearsBeforeFirstBirth',
  ]

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

  for (const name of sliderNames) syncSliderOutput(form, name)

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
    for (const name of sliderNames) syncSliderOutput(form, name)
    const inputs = readInputs()
    renderResults(results, inputs, calculate(inputs))
    save()
  }

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
