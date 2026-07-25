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
  annualToMonthlyRate,
  formatCurrency,
  formatMonths,
  formatNominalReal,
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

function renderTrusteeSteps(inputs: CalculatorInputs): string {
  const cpiM = annualToMonthlyRate(inputs.cpiRate)
  const marketM = annualToMonthlyRate(inputs.marketRate)
  return `
    <h3 class="form-section-heading">Trustee worksheet (each 21)</h3>
    <p class="trustee-overview">
      At each child's 21st birthday, use the pot balance on that date and the trust's estimated
      monthly CPI and nominal fund growth (${formatPctPerMonth(cpiM)} and
      ${formatPctPerMonth(marketM)} — from ~10-year lookbacks) to size equal real payouts for
      every child still owed.
    </p>
    <ol class="trustee-steps">
      <li>Start with the pot balance on today's 21 — actual or trustee records.</li>
      <li>List remaining children and months until each one's 21.</li>
      <li>For each remaining child: weight = 1 if turning 21 today; else weight = 1 ÷ real growth over the months until their 21.</li>
      <li>T = pot ÷ sum of weights (T is in this 21's dollars).</li>
      <li>Pay T to today's child; leave the remainder invested. Last child receives the balance.</li>
    </ol>
    <p class="footnote">
      Real growth over m months to their 21st birthday =
      (1 + market<sub>mo</sub>)<sup>m</sup> ÷ (1 + CPI<sub>mo</sub>)<sup>m</sup>.
    </p>
    <p class="footnote">
      Same CPI and market estimates at every payout unless the trust is amended.
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
      <div><dt>Initial lump sum</dt><dd>${formatCurrency(result.lumpSum)}</dd></div>
      <div><dt>Funding offset</dt><dd>${formatFundingOffset(inputs.fundingMonthsFromFirstBirth)}</dd></div>
      <div><dt>First slice at first ${TARGET_AGE}</dt><dd>${formatCurrency(result.firstSliceAtFirstMaturity)}</dd></div>
      <div><dt>Pot at first ${TARGET_AGE}</dt><dd>${formatCurrency(result.potAtFirstMaturity)}</dd></div>
      <div><dt>CPI (10-yr lookback)</dt><dd>${formatPctPerMonth(annualToMonthlyRate(inputs.cpiRate))}</dd></div>
      <div><dt>Market (10-yr lookback)</dt><dd>${formatPctPerMonth(annualToMonthlyRate(inputs.marketRate))}</dd></div>
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
              <td>${formatNominalReal(child.payoutNominal, child.payoutReal)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Payout: nominal (real at this 21). Slice T is in this 21's dollars. Last child receives the
      remaining balance.
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
      ${renderTrusteeSteps(inputs)}
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
