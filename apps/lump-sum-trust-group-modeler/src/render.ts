import {
  bindCurrencyInputs,
  setCurrencyInputValue,
} from '../../../shared/currency-input'
import {
  birthMonthsFromSpacing,
  type CalculatorInputs,
  type CalculatorResult,
  type ChildPayout,
  type RemainingShareRow,
} from './calculator'
import { TARGET_AGE, TARGET_AGE_MONTHS } from './constants'
import {
  annualToMonthlyRate,
  formatCurrency,
  formatMonths,
  formatNominalReal,
  formatPct,
  formatPctPerMonth,
  formatSharePct,
} from './shared/money'

function formatFundingOffset(months: number): string {
  if (months === 0) return 'At first birth (month 0)'
  const abs = Math.abs(months)
  const unit = abs === 1 ? 'month' : 'months'
  if (months < 0) return `${abs} ${unit} before first birth (month ${months})`
  return `${abs} ${unit} after first birth (month ${months})`
}

function renderPolicyRatesBlock(inputs: CalculatorInputs): string {
  const cpiM = annualToMonthlyRate(inputs.cpiRate)
  const marketM = annualToMonthlyRate(inputs.marketRate)
  return `
    <dl class="worksheet-rates">
      <div><dt>CPI (10-year)</dt><dd>${formatPct(inputs.cpiRate)}/yr · ${formatPctPerMonth(cpiM)}</dd></div>
      <div><dt>Nominal growth (10-year)</dt><dd>${formatPct(inputs.marketRate)}/yr · ${formatPctPerMonth(marketM)}</dd></div>
    </dl>
  `
}

function renderTrusteeSteps(inputs: CalculatorInputs): string {
  return `
    <h3 class="form-section-heading">Trustee worksheet (each 21)</h3>
    ${renderPolicyRatesBlock(inputs)}
    <ol class="trustee-steps">
      <li>Pot balance on this 21.</li>
      <li>Months until each remaining child's 21; weight = 1 today, else 1 ÷ real growth over m months.</li>
      <li>T = pot ÷ sum of weights.</li>
      <li>Pay T; leave remainder invested (last child: balance).</li>
    </ol>
    <p class="footnote">
      Real growth over m months = (1 + market<sub>mo</sub>)<sup>m</sup> ÷ (1 + CPI<sub>mo</sub>)<sup>m</sup>.
    </p>
  `
}

function renderSummary(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const childWord = result.childCount === 1 ? 'child' : 'children'
  const equalReal =
    result.children[0]?.payoutRealAtFunding ?? 0
  return `
    <p class="prefund-summary">
      Seed one communal trust pot. Remove portions for each child at 21, ensuring equal real
      payouts. <strong>${formatCurrency(result.lumpSum)}</strong> deposited
      ${formatFundingOffset(inputs.fundingMonthsFromFirstBirth)} for
      <strong>${result.childCount} ${childWord}</strong> — about
      <strong>${formatCurrency(equalReal)}</strong> real at funding per child.
    </p>
  `
}

function renderAssumptions(inputs: CalculatorInputs, result: CalculatorResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${result.childCount}</dd></div>
      <div><dt>Lump sum</dt><dd>${formatCurrency(result.lumpSum)}</dd></div>
      <div><dt>Funding offset (months)</dt><dd>${Math.round(inputs.fundingMonthsFromFirstBirth)}</dd></div>
      <div><dt>CPI (10-year)</dt><dd>${formatPct(inputs.cpiRate)}</dd></div>
      <div><dt>Nominal growth (10-year)</dt><dd>${formatPct(inputs.marketRate)}</dd></div>
    </dl>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-print-results>Print</button>
      <button type="button" class="btn-export" data-print-worksheet>Trustee worksheet</button>
    </div>
  `
}

function renderPrintableTrusteeWorksheet(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const birthMonths = birthMonthsFromSpacing(inputs.spacingMonths)
  const maturityRows = birthMonths
    .map(
      (birth, i) => `
      <tr>
        <th scope="row">${i + 1}</th>
        <td>${formatMonths(birth)}</td>
        <td>${formatMonths(birth + TARGET_AGE_MONTHS)}</td>
      </tr>
    `,
    )
    .join('')

  const blankRows = Array.from({ length: 5 }, () => `
      <tr>
        <th scope="row" class="worksheet-blank"></th>
        <td class="worksheet-blank"></td>
        <td class="worksheet-blank"></td>
        <td class="worksheet-blank"></td>
      </tr>
    `).join('')

  return `
    <div class="trustee-worksheet-print">
      <h2 class="worksheet-title">Trustee worksheet — payout at age ${TARGET_AGE}</h2>
      <p class="worksheet-subtitle">Lump Sum Trust Group · ${result.childCount} children · seed ${formatCurrency(result.lumpSum)}</p>

      <div class="worksheet-meta">
        <label>Payout date <span class="worksheet-line"></span></label>
        <label>Child # <span class="worksheet-line worksheet-line--short"></span></label>
        <label>Pot balance <span class="worksheet-line"></span></label>
      </div>

      ${renderPolicyRatesBlock(inputs)}

      <ol class="worksheet-steps">
        <li>Record pot balance on this 21.</li>
        <li>For each remaining child: months m to their 21; weight = 1 if today, else 1 ÷ real growth over m.</li>
        <li>T = pot ÷ sum of weights.</li>
        <li>Pay T; leave remainder invested (last child: full balance).</li>
      </ol>
      <p class="worksheet-formula">
        Real growth over m months = (1 + market<sub>mo</sub>)<sup>m</sup> ÷ (1 + CPI<sub>mo</sub>)<sup>m</sup>
      </p>

      <h3 class="worksheet-section-heading">Calculation</h3>
      <table class="worksheet-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Mo. to 21</th>
            <th scope="col">Real growth</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          ${blankRows}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colspan="3">Sum of weights</th>
            <td class="worksheet-blank"></td>
          </tr>
          <tr>
            <th scope="row" colspan="3">T = pot ÷ sum</th>
            <td class="worksheet-blank"></td>
          </tr>
          <tr>
            <th scope="row" colspan="3">Payout today</th>
            <td class="worksheet-blank"></td>
          </tr>
          <tr>
            <th scope="row" colspan="3">Pot after</th>
            <td class="worksheet-blank"></td>
          </tr>
        </tfoot>
      </table>

      <h3 class="worksheet-section-heading">Model schedule (reference)</h3>
      <table class="worksheet-table worksheet-table--reference">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Birth mo.</th>
            <th scope="col">21st mo.</th>
          </tr>
        </thead>
        <tbody>${maturityRows}</tbody>
      </table>
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

function renderPayoutTable(children: ChildPayout[]): string {
  return `
    <h3 class="form-section-heading">Simulated payouts at age ${TARGET_AGE}</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Birth month</th>
            <th scope="col">Maturity month</th>
            <th scope="col">Kids left</th>
            <th scope="col">Share</th>
            <th scope="col">Slice T</th>
            <th scope="col">Payout</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${formatMonths(child.birthMonth)}</td>
              <td>${formatMonths(child.maturityMonth)}</td>
              <td>${child.childrenRemaining}</td>
              <td>${formatSharePct(child.shareOfRemainingPercent)}</td>
              <td>${formatCurrency(child.equalSliceAtThis21)}</td>
              <td>${formatNominalReal(child.payoutNominal, child.payoutRealAtFunding)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Payout: nominal (real at funding). Real values are equal purchasing power when the pot was
      seeded. Slice T is in this 21's dollars. Last child receives the remaining balance.
    </p>
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
      <h2 class="print-only-heading">Lump Sum Trust Group Modeler</h2>
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
        ${renderTrusteeSteps(inputs)}
      </section>
      <section class="result-group">
        ${renderRemainingShareTable(result.remainingShareTable)}
      </section>
      <section class="result-group">
        ${renderPayoutTable(result.children)}
      </section>
    </div>
    ${renderPrintableTrusteeWorksheet(inputs, result)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  childrenContainer: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): () => void {
  const storageKey = 'lump-sum-trust-group-modeler:inputs'

  const save = () => {
    const inputs = readInputs()
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          spacingMonths: inputs.spacingMonths,
          lumpSum: inputs.lumpSum.toString(),
          fundingMonthsFromFirstBirth:
            inputs.fundingMonthsFromFirstBirth.toString(),
          cpiRate: (inputs.cpiRate * 100).toString(),
          marketRate: (inputs.marketRate * 100).toString(),
        }),
      )
    } catch {
      /* ignore */
    }
  }

  const render = () => {
    const inputs = readInputs()
    renderResults(results, inputs, calculate(inputs))
    save()
  }

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as {
        lumpSum?: string
        fundingMonthsFromFirstBirth?: string
        cpiRate?: string
        marketRate?: string
      }
      const setField = (name: string, value: string) => {
        const el = form.elements.namedItem(name)
        if (el instanceof HTMLInputElement) el.value = value
      }
      if (vals.lumpSum != null) {
        const el = form.elements.namedItem('lumpSum')
        if (el instanceof HTMLInputElement) {
          setCurrencyInputValue(el, vals.lumpSum)
        }
      }
      if (vals.fundingMonthsFromFirstBirth != null) {
        setField('fundingMonthsFromFirstBirth', vals.fundingMonthsFromFirstBirth)
      }
      if (vals.cpiRate != null) setField('cpiRate', vals.cpiRate)
      if (vals.marketRate != null) setField('marketRate', vals.marketRate)
    }
  } catch {
    /* ignore */
  }

  bindCurrencyInputs(form, ['lumpSum'])

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-print-results]')) {
      window.print()
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

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  childrenContainer.addEventListener('input', render)
  childrenContainer.addEventListener('change', render)
  render()
  return render
}
