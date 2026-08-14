import { MONTH_NAMES } from './constants'
import {
  type CalculatorInputs,
  type CalculatorResult,
  type ChildSummary,
  type PotYearRow,
} from './calculator'
import {
  formatCurrency,
  formatMonthYear,
  formatNominalReal,
  formatPct,
} from './shared/money'

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-print-summary>Print summary</button>
      <span class="export-hint">Summary and tables — opens your browser print dialog.</span>
    </div>
  `
}

function renderSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  const childWord = inputs.children.length === 1 ? 'child' : 'children'
  const missedNote =
    result.missedChildCount > 0
      ? ` ${result.missedChildCount} ${result.missedChildCount === 1 ? 'child has' : 'children have'} no contribution years on or after the funding year.`
      : ''
  return `
    <p class="prefund-summary">
      Deposit <strong>${formatNominalReal(result.requiredLumpSum, result.requiredLumpSumReal)}</strong>
      in ${inputs.fundingYear}. Each year the pot pays statutory Trump contributions for
      <strong>${inputs.children.length} ${childWord}</strong> until empty.${missedNote}
    </p>
    <dl class="projection-inputs">
      <div><dt>Funding year</dt><dd>${inputs.fundingYear}</dd></div>
      <div><dt>Contributions</dt><dd>Statutory max each year</dd></div>
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
            <th scope="col">Birth</th>
            <th scope="col">Funded years</th>
            <th scope="col">Deposit at fund year</th>
            <th scope="col">Total contributions</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr${child.missed ? ' class="row-missed"' : ''}>
              <th scope="row">${child.childNumber}</th>
              <td>${formatMonthYear(child.birthYear, child.birthMonth)}</td>
              <td>${child.missed ? 'Missed' : `${child.fundedYears} (through ${child.lastContributionYear})`}</td>
              <td>${child.missed ? '—' : formatCurrency(child.requiredDeposit)}</td>
              <td>${child.missed ? '—' : formatNominalReal(child.totalContributionsNominal, child.totalContributionsReal)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

type MilestoneRow = {
  childNumber: number
  birthLabel: string
  calendarYear: number | null
  nominal: number | null
  real: number | null
}

function milestoneRows(result: CalculatorResult, age: 18 | 67): MilestoneRow[] {
  return result.children.map((child) => ({
    childNumber: child.childNumber,
    birthLabel: formatMonthYear(child.birthYear, child.birthMonth),
    calendarYear: age === 18 ? child.age18CalendarYear : child.age67CalendarYear,
    nominal: age === 18 ? child.age18Balance : child.age67Balance,
    real: age === 18 ? child.age18BalanceReal : child.age67BalanceReal,
  }))
}

function renderMilestoneTable(
  result: CalculatorResult,
  age: 18 | 67,
  heading: string,
  footnote?: string,
): string {
  const rows = milestoneRows(result, age)
  if (rows.length === 0) return ''

  return `
    <h3 class="form-section-heading">${heading}</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Year</th>
            <th scope="col">Trump account balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.childNumber} · ${row.birthLabel}</th>
              <td>${row.calendarYear ?? '—'}</td>
              <td>${
                row.nominal !== null && row.real !== null
                  ? formatNominalReal(row.nominal, row.real)
                  : '—'
              }</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    ${footnote ? `<p class="footnote">${footnote}</p>` : ''}
  `
}

function renderAge18Table(result: CalculatorResult): string {
  return renderMilestoneTable(result, 18, 'Account balance at age 18')
}

function renderAge67Table(result: CalculatorResult): string {
  return renderMilestoneTable(
    result,
    67,
    'Estimated value at age 67',
    'Balance at age 18 grown at the market rate assumption with no further contributions or withdrawals.',
  )
}

function renderPotTable(rows: PotYearRow[]): string {
  const filtered =
    rows.length > 36
      ? [...rows.filter((r) => r.withdrawal > 0), rows[0]!, rows.at(-1)!]
      : rows

  return `
    <h3 class="form-section-heading">Communal pot by calendar year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Withdrawal</th>
            <th scope="col">End balance</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.calendarYear}</th>
              <td>${row.withdrawalLabel}</td>
              <td>${formatNominalReal(row.potNominal, row.potReal)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderResultsBody(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  return `
    ${renderSummary(inputs, result)}
    ${renderAge18Table(result)}
    ${renderAge67Table(result)}
    ${renderChildTable(result.children)}
    ${renderPotTable(result.potRows)}
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderExportToolbar()}
    <h2 class="print-only-heading">Trump Account Modeler</h2>
    ${renderResultsBody(inputs, result)}
    <p class="print-only-footer">Estimates only — not tax or financial advice.</p>
  `
}

export function monthOptions(selected: number): string {
  return MONTH_NAMES.map(
    (name, i) =>
      `<option value="${i + 1}"${i + 1 === selected ? ' selected' : ''}>${name}</option>`,
  ).join('')
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculateFn: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
  options?: {
    onPersist?: () => void
    onReset?: (render: () => void) => void
  },
): void {
  const render = () => {
    const inputs = readInputs()
    renderResults(results, inputs, calculateFn(inputs))
    options?.onPersist?.()
  }

  // Safari number spinners fire `input` on mousedown and repeat until mouseup.
  // Replacing the results DOM in that window steals mouseup, so the stepper
  // sticks in one direction or ignores later clicks. Defer the paint.
  let dirty = false
  let flushTimer = 0
  const pointersDown = new Set<number>()

  const isNumberInput = (target: EventTarget | null): target is HTMLInputElement =>
    target instanceof HTMLInputElement && target.type === 'number'

  const flush = () => {
    if (flushTimer) {
      window.clearTimeout(flushTimer)
      flushTimer = 0
    }
    if (dirty && pointersDown.size === 0) {
      dirty = false
      render()
    }
  }

  const schedule = (event: Event) => {
    dirty = true
    if (isNumberInput(event.target) || pointersDown.size > 0) {
      if (pointersDown.size > 0) return
      if (flushTimer) window.clearTimeout(flushTimer)
      flushTimer = window.setTimeout(flush, 200)
      return
    }
    flush()
  }

  form.addEventListener('pointerdown', (event) => {
    if (isNumberInput(event.target)) pointersDown.add(event.pointerId)
  })
  const onPointerEnd = (event: PointerEvent) => {
    pointersDown.delete(event.pointerId)
    flush()
  }
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)

  form.addEventListener('input', schedule)
  form.addEventListener('change', schedule)

  form
    .closest('.card--inputs')
    ?.querySelector<HTMLButtonElement>('[data-reset-assumptions]')
    ?.addEventListener('click', () => options?.onReset?.(render))

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!target.closest('[data-print-summary]')) return
    window.print()
  })

  render()
}
