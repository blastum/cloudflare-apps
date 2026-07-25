import {
  bindCurrencyInputs,
  setCurrencyInputValue,
} from '../../../shared/currency-input'
import {
  type CalculatorInputs,
  type CalculatorResult,
  type ChildPayout,
  type RemainingShareRow,
} from './calculator'
import { TARGET_AGE } from './constants'
import {
  formatCurrency,
  formatNominalReal,
  formatPct,
  formatSharePct,
  formatYears,
} from './shared/money'

function formatFundingOffset(months: number): string {
  if (months === 0) return 'At first birth (month 0)'
  const years = months / 12
  const abs = Math.abs(months)
  const unit = abs === 1 ? 'month' : 'months'
  if (months < 0) return `${abs} ${unit} before first birth (${formatYears(years)} yr)`
  return `${abs} ${unit} after first birth (${formatYears(years)} yr)`
}

function renderTrusteeSteps(): string {
  return `
    <h3 class="form-section-heading">Trustee worksheet (each 21)</h3>
    <ol class="trustee-steps">
      <li>Grow pot to today's balance (actual or modeled).</li>
      <li>Weight = 1 for child turning 21 today; for each younger child, weight = 1 ÷ real growth to their 21.</li>
      <li>T = pot ÷ sum of weights (T is in this 21's dollars).</li>
      <li>Pay T to today's child; reinvest the rest until the next 21.</li>
    </ol>
    <p class="footnote">
      CPI and market below are policy estimates (~10-year lookbacks). Same numbers every payout unless amended.
    </p>
  `
}

function renderSummary(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const childWord = result.childCount === 1 ? 'child' : 'children'
  return `
    <p class="prefund-summary">
      Initial lump sum <strong>${formatCurrency(result.lumpSum)}</strong>
      deposited ${formatFundingOffset(inputs.fundingMonthsFromFirstBirth)} for
      <strong>${result.childCount} ${childWord}</strong>. At the first
      ${TARGET_AGE} the pot is
      <strong>${formatCurrency(result.potAtFirstMaturity)}</strong>
      and the equal slice is
      <strong>${formatCurrency(result.firstSliceAtFirstMaturity)}</strong>
      (this 21's dollars). Each later 21 reruns the worksheet on whatever remains.
      Total paid out: <strong>${formatCurrency(result.totalPaidNominal)}</strong>.
    </p>
  `
}

function renderAssumptions(inputs: CalculatorInputs, result: CalculatorResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${result.childCount}</dd></div>
      <div><dt>Initial lump sum</dt><dd>${formatCurrency(result.lumpSum)}</dd></div>
      <div><dt>Funding offset</dt><dd>${formatFundingOffset(inputs.fundingMonthsFromFirstBirth)}</dd></div>
      <div><dt>First slice at first ${TARGET_AGE}</dt><dd>${formatCurrency(result.firstSliceAtFirstMaturity)}</dd></div>
      <div><dt>Pot at first ${TARGET_AGE}</dt><dd>${formatCurrency(result.potAtFirstMaturity)}</dd></div>
      <div><dt>CPI (10-yr lookback)</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
      <div><dt>Market (10-yr lookback)</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
    </dl>
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
            <th scope="col">Maturity year</th>
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
              <td>${formatYears(row.maturityYear)}</td>
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
            <th scope="col">Birth year</th>
            <th scope="col">Maturity year</th>
            <th scope="col">Kids left</th>
            <th scope="col">Share</th>
            <th scope="col">Pot before</th>
            <th scope="col">Slice T</th>
            <th scope="col">Payout</th>
            <th scope="col">Pot after</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${formatYears(child.birthYear)}</td>
              <td>${formatYears(child.maturityYear)}</td>
              <td>${child.childrenRemaining}</td>
              <td>${formatSharePct(child.shareOfRemainingPercent)}</td>
              <td>${formatCurrency(child.potBeforePayout)}</td>
              <td>${formatCurrency(child.equalSliceAtThis21)}</td>
              <td>${formatNominalReal(child.payoutNominal, child.payoutReal)}</td>
              <td>${formatCurrency(child.potAfterPayout)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Slice T and payout real are in this 21's dollars (equal for non-last rows).
      Payout nominal equals T except the last child, who takes the remainder.
    </p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
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
    <section class="result-group">
      ${renderTrusteeSteps()}
    </section>
    <section class="result-group">
      ${renderRemainingShareTable(result.remainingShareTable)}
    </section>
    <section class="result-group">
      ${renderPayoutTable(result.children)}
    </section>
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

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  childrenContainer.addEventListener('input', render)
  childrenContainer.addEventListener('change', render)
  render()
  return render
}
