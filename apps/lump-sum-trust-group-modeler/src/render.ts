import { bindLiveForm } from '../../../shared/defer-form-paint'
import {
  bindCurrencyInputs,
  isCurrencyInput,
  setCurrencyInputValue,
} from '../../../shared/currency-input'
import { bindGrowthFields } from '../../../shared/growth-fields'
import { bindSteppers } from '../../../shared/stepper'
import {
  formatCurrency,
  formatMonths,
  formatNominalReal,
  formatPct,
  formatSharePct,
} from './shared/money'
import {
  birthMonthsFromSpacing,
  type CalculatorInputs,
  type CalculatorResult,
  type ChildPayout,
  type RemainingShareRow,
  type SolveMode,
} from './calculator'

function renderSummary(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const childWord = result.childCount === 1 ? 'child' : 'children'
  const equalReal = result.children[0]?.payoutRealAtBirth ?? 0
  if (inputs.solveMode === 'maturity') {
    return `
      <p class="prefund-summary">
        To deliver about <strong>${formatCurrency(equalReal)}</strong>
        real (first-birth dollars) at age ${inputs.payoutAge} for
        <strong>${result.childCount} ${childWord}</strong>, seed
        <strong>${formatCurrency(result.lumpSum)}</strong> at
        ${formatMonths(result.fundingMonth)} — first payout is about
        <strong>${formatCurrency(result.firstSliceAtFirstMaturity)}</strong> nominal.
      </p>
    `
  }
  return `
    <p class="prefund-summary">
      Seed <strong>${formatCurrency(result.lumpSum)}</strong> at
      ${formatMonths(result.fundingMonth)} for
      <strong>${result.childCount} ${childWord}</strong> — first payout slice about
      <strong>${formatCurrency(result.firstSliceAtFirstMaturity)}</strong>
      (age ${inputs.payoutAge}), or about
      <strong>${formatCurrency(equalReal)}</strong> real at first birth per child.
    </p>
  `
}

function renderAssumptions(inputs: CalculatorInputs, result: CalculatorResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Solve for</dt><dd>${inputs.solveMode === 'maturity' ? 'Maturity value' : 'Initial pot'}</dd></div>
      <div><dt>Children</dt><dd>${result.childCount}</dd></div>
      <div><dt>Initial pot</dt><dd>${formatCurrency(result.lumpSum)}</dd></div>
      <div><dt>Funding month</dt><dd>${formatMonths(result.fundingMonth)}</dd></div>
      <div><dt>First maturity slice</dt><dd>${formatCurrency(result.firstSliceAtFirstMaturity)}</dd></div>
      <div><dt>Payout age</dt><dd>${inputs.payoutAge}</dd></div>
      <div><dt>Pot at first payout</dt><dd>${formatCurrency(result.potAtFirstMaturity)}</dd></div>
      <div><dt>Total paid out</dt><dd>${formatCurrency(result.totalPaidNominal)}</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}</dd></div>
      <div><dt>Average market growth</dt><dd>${formatPct(inputs.marketRate)}</dd></div>
    </dl>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <div class="export-toolbar-group export-toolbar-group--results">
        <button type="button" class="btn-export" data-print-results>Print</button>
        <button type="button" class="btn-export" data-show-worksheet>Trustee worksheet</button>
      </div>
      <div class="export-toolbar-group export-toolbar-group--worksheet">
        <button type="button" class="btn-export" data-back-to-results>Back to results</button>
        <button type="button" class="btn-export" data-print-worksheet>Print worksheet</button>
      </div>
    </div>
  `
}

function renderFundingInputsTable(result: CalculatorResult): string {
  return `
    <h3 class="form-section-heading">Funding</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Funding month</th>
            <th scope="col">Initial pot</th>
            <th scope="col">First maturity slice</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${formatMonths(result.fundingMonth)}</td>
            <td>${formatCurrency(result.lumpSum)}</td>
            <td>${formatCurrency(result.firstSliceAtFirstMaturity)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

function renderChildrenInputsTable(
  spacingMonths: number[],
  payoutAge: number,
): string {
  const birthMonths = birthMonthsFromSpacing(spacingMonths)
  const payoutMonths = payoutAge * 12
  return `
    <h3 class="form-section-heading">Children</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Months after previous</th>
            <th scope="col">Birth month</th>
            <th scope="col">Payout month</th>
          </tr>
        </thead>
        <tbody>
          ${birthMonths
            .map(
              (birthMonth, index) => `
            <tr>
              <th scope="row">${index + 1}</th>
              <td>${index === 0 ? '—' : formatMonths(spacingMonths[index] ?? 0)}</td>
              <td>${formatMonths(birthMonth)}</td>
              <td>${formatMonths(birthMonth + payoutMonths)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderPrintInputsSection(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  return `
    <section class="result-group result-group--inputs-print inputs-print-section">
      <h3 class="result-group-heading">Plan inputs</h3>
      ${renderFundingInputsTable(result)}
      ${renderChildrenInputsTable(inputs.spacingMonths, inputs.payoutAge)}
      <dl class="projection-inputs projection-inputs--inline">
        <div><dt>Payout age</dt><dd>${inputs.payoutAge}</dd></div>
        <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}</dd></div>
        <div><dt>Average market growth</dt><dd>${formatPct(inputs.marketRate)}</dd></div>
      </dl>
    </section>
  `
}

function worksheetField(
  label: string,
  attrs = '',
  inputClass = 'worksheet-input--line',
  value = '',
): string {
  const valueAttr = value !== '' ? ` value="${value}"` : ''
  return `
    <label>
      ${label}
      <input type="text" class="worksheet-input ${inputClass}" ${attrs}${valueAttr} />
    </label>
  `
}

function renderPrintableTrusteeWorksheet(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const payoutAge = inputs.payoutAge
  const birthMonths = birthMonthsFromSpacing(inputs.spacingMonths)
  const payoutMonths = payoutAge * 12
  const cpiPct = (inputs.cpiRate * 100).toFixed(1)
  const marketPct = (inputs.marketRate * 100).toFixed(1)

  const blankRows = Array.from({ length: Math.max(5, result.childCount) }, () => `
      <tr>
        <th scope="row"><input type="text" class="worksheet-input worksheet-input--cell" /></th>
        <td><input type="text" class="worksheet-input worksheet-input--cell" inputmode="numeric" /></td>
        <td><input type="text" class="worksheet-input worksheet-input--cell" inputmode="decimal" /></td>
        <td><input type="text" class="worksheet-input worksheet-input--cell" inputmode="decimal" /></td>
      </tr>
    `).join('')

  const worksheetTotal = (label: string) => `
    <tr>
      <th scope="row" colspan="3">${label}</th>
      <td><input type="text" class="worksheet-input worksheet-input--cell" inputmode="decimal" /></td>
    </tr>
  `

  return `
    <div class="trustee-worksheet-print">
      <p class="worksheet-brand">Pot Trust</p>
      <h2 class="worksheet-title">Trustee worksheet — payout at age ${payoutAge}</h2>
      <p class="worksheet-subtitle">
        Use at each payout event. Record the actual pot balance, then calculate the equal slice
        for remaining children.
      </p>

      <div class="worksheet-meta">
        ${worksheetField('Payout date (month from first birth)', 'inputmode="numeric"')}
        ${worksheetField('Child receiving payout #', '', 'worksheet-input--short')}
        ${worksheetField('Children remaining', '', 'worksheet-input--short')}
        ${worksheetField('Pot balance before payout ($)', 'inputmode="numeric"')}
        ${worksheetField('Average CPI (%/yr)', 'inputmode="decimal"', 'worksheet-input--short', cpiPct)}
        ${worksheetField('Average market growth (%/yr)', 'inputmode="decimal"', 'worksheet-input--short', marketPct)}
      </div>

      <ol class="worksheet-steps">
        <li>Record pot balance on this payout date (age ${payoutAge}).</li>
        <li>For each remaining child: months m to their age ${payoutAge}; weight = 1 if today, else 1 ÷ real growth over m÷12 years.</li>
        <li>T = pot ÷ sum of weights (equal slice in today's dollars).</li>
        <li>Pay T to today's child; leave remainder invested (last remaining child: full balance).</li>
      </ol>
      <p class="worksheet-formula">
        Real growth over m months = (1 + market)<sup>m÷12</sup> ÷ (1 + CPI)<sup>m÷12</sup>
      </p>

      <h3 class="worksheet-section-heading">Calculation</h3>
      <table class="worksheet-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Mo. to ${payoutAge}</th>
            <th scope="col">Real growth</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          ${blankRows}
        </tbody>
        <tfoot>
          ${worksheetTotal('Sum of weights')}
          ${worksheetTotal('T = pot ÷ sum')}
          ${worksheetTotal('Payout today')}
          ${worksheetTotal('Pot after payout')}
        </tfoot>
      </table>

      <h3 class="worksheet-section-heading">Plan reference — children</h3>
      <table class="worksheet-table worksheet-table--reference">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Birth month</th>
            <th scope="col">Payout month</th>
          </tr>
        </thead>
        <tbody>
          ${birthMonths
            .map(
              (birthMonth, index) => `
            <tr>
              <th scope="row">${index + 1}</th>
              <td>${formatMonths(birthMonth)}</td>
              <td>${formatMonths(birthMonth + payoutMonths)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>

      <h3 class="worksheet-section-heading">Plan reference — funding</h3>
      <table class="worksheet-table worksheet-table--reference">
        <thead>
          <tr>
            <th scope="col">Funding month</th>
            <th scope="col">Initial pot</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${formatMonths(result.fundingMonth)}</td>
            <td>${formatCurrency(result.lumpSum)}</td>
          </tr>
        </tbody>
      </table>
      <p class="footnote">
        Simulated first payout at age ${payoutAge}: ${formatCurrency(result.firstSliceAtFirstMaturity)} slice
        (pot ${formatCurrency(result.potAtFirstMaturity)}).
      </p>
    </div>
  `
}

function renderRemainingShareTable(rows: RemainingShareRow[]): string {
  return `
    <h3 class="form-section-heading">Share of pot at each payout</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Kids left</th>
            <th scope="col">Maturity month</th>
            <th scope="col">Share of pot</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.childNumber}</th>
              <td>${row.childrenRemaining}</td>
              <td>${formatMonths(row.maturityMonth)}</td>
              <td>${formatSharePct(row.sharePercent)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderPayoutTable(children: ChildPayout[], payoutAge: number): string {
  return `
    <h3 class="form-section-heading">Simulated payouts at age ${payoutAge}</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Maturity month</th>
            <th scope="col">Share</th>
            <th scope="col">Payout</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${formatMonths(child.maturityMonth)}</td>
              <td>${formatSharePct(child.shareOfRemainingPercent)}</td>
              <td>${formatNominalReal(child.payoutNominal, child.payoutRealAtBirth)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">Payout: nominal (real).</p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderExportToolbar()}
    <div class="results-print-body">
      <h2 class="print-only-heading">Pot Trust Modeler</h2>
      ${renderPrintInputsSection(inputs, result)}
      <div class="results-summary">
        <section class="result-group">
          <h3 class="result-group-heading">Summary</h3>
          ${renderSummary(inputs, result)}
        </section>
        <section class="result-group result-group--assumptions">
          <h3 class="result-group-heading">Assumptions</h3>
          ${renderAssumptions(inputs, result)}
        </section>
      </div>
      <section class="result-group no-print">
        ${renderRemainingShareTable(result.remainingShareTable)}
      </section>
      <section class="result-group">
        ${renderPayoutTable(result.children, inputs.payoutAge)}
      </section>
    </div>
  `
}

export function mountTrusteeWorksheet(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = renderPrintableTrusteeWorksheet(inputs, result)
}

type SavedInputs = {
  spacingMonths?: number[]
  solveMode?: string
  amount?: string
  lumpSum?: string
  targetMaturityValue?: string
  fundingMonth?: string
  payoutAge?: string
  cpiRate?: string
  marketRate?: string
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  worksheet: HTMLElement,
  getMode: () => SolveMode,
  setMode: (mode: SolveMode) => void,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: (mode: SolveMode) => CalculatorInputs,
  saved: SavedInputs | null,
  onReset: () => void,
): () => void {
  const render = () => {
    const inputs = readInputs(getMode())
    const result = calculate(inputs)
    renderResults(results, inputs, result)
    mountTrusteeWorksheet(worksheet, inputs, result)
    save()
  }

  const storageKey = 'pot-trust-modeler:inputs'

  const save = () => {
    const inputs = readInputs(getMode())
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          spacingMonths: inputs.spacingMonths,
          solveMode: inputs.solveMode,
          amount: (inputs.solveMode === 'maturity'
            ? inputs.targetMaturityValue
            : inputs.lumpSum
          ).toString(),
          fundingMonth: inputs.fundingMonth.toString(),
          payoutAge: inputs.payoutAge.toString(),
          cpiRate: (inputs.cpiRate * 100).toString(),
          marketRate: (inputs.marketRate * 100).toString(),
        }),
      )
    } catch {
      /* ignore */
    }
  }

  try {
    if (saved) {
      const setField = (name: string, value: string) => {
        const el = form.elements.namedItem(name)
        if (!(el instanceof HTMLInputElement)) return
        if (isCurrencyInput(el)) setCurrencyInputValue(el, value)
        else el.value = value
      }
      if (saved.amount != null) setField('amount', saved.amount)
      else if (saved.lumpSum != null) setField('amount', saved.lumpSum)
      if (saved.fundingMonth != null) setField('fundingMonth', saved.fundingMonth)
      if (saved.payoutAge != null) setField('payoutAge', saved.payoutAge)
      if (saved.cpiRate != null) setField('cpiRate', saved.cpiRate)
      if (saved.marketRate != null) setField('marketRate', saved.marketRate)
    }
  } catch {
    /* ignore */
  }

  const resetBtn = form
    .closest('.card--inputs')
    ?.querySelector<HTMLButtonElement>('[data-reset-assumptions]')
  resetBtn?.addEventListener('click', () => {
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem('lump-sum-trust-group-modeler:inputs')
    } catch {
      /* ignore */
    }
    document.body.classList.remove('viewing-worksheet')
    onReset()
    render()
  })

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-print-results]')) {
      window.print()
      return
    }
    if (target.closest('[data-show-worksheet]')) {
      document.body.classList.add('viewing-worksheet')
      return
    }
    if (target.closest('[data-back-to-results]')) {
      document.body.classList.remove('viewing-worksheet')
      return
    }
    if (target.closest('[data-print-worksheet]')) {
      document.body.classList.add('printing-worksheet')
      const cleanup = () => {
        document.body.classList.remove('printing-worksheet')
        window.removeEventListener('afterprint', cleanup)
      }
      window.addEventListener('afterprint', cleanup)
      window.print()
    }
  })

  form.querySelector('.mode-toggle')?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLButtonElement>('[data-mode]')
    if (!button?.dataset.mode) return
    const next: SolveMode = button.dataset.mode === 'maturity' ? 'maturity' : 'initial'
    if (next === getMode()) return
    setMode(next)
    render()
  })

  bindSteppers(form, render)
  bindCurrencyInputs(form)
  bindGrowthFields(form, render)
  bindLiveForm(form, render)
  render()
  return render
}
