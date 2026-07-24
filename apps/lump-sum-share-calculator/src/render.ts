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

function renderSummary(result: CalculatorResult): string {
  const childWord = result.childCount === 1 ? 'child' : 'children'
  return `
    <p class="prefund-summary">
      Seed <strong>${formatCurrency(result.lumpSumAtYear0)}</strong> at year 0 for
      <strong>${result.childCount} ${childWord}</strong>. When the first child turns
      ${TARGET_AGE}, the pot is
      <strong>${formatNominalReal(result.potAtFirstMaturity, result.potAtFirstMaturityReal)}</strong>.
      Each child receives the same
      <strong>${formatCurrency(result.equalRealAtAge21)} real</strong> at age ${TARGET_AGE}
      (nominal amounts differ). Last child empties the pot. Total paid out:
      <strong>${formatCurrency(result.totalPaidNominal)}</strong>.
    </p>
  `
}

function renderAssumptions(inputs: CalculatorInputs, result: CalculatorResult): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${result.childCount}</dd></div>
      <div><dt>Seed at year 0</dt><dd>${formatCurrency(result.lumpSumAtYear0)}</dd></div>
      <div><dt>Last birth year</dt><dd>${formatYears(result.lastBirthYear)}</dd></div>
      <div><dt>Equal real at age ${TARGET_AGE}</dt><dd>${formatCurrency(result.equalRealAtAge21)}</dd></div>
      <div><dt>Pot at first age ${TARGET_AGE}</dt><dd>${formatCurrency(result.potAtFirstMaturity)}</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
    </dl>
  `
}

function renderRemainingShareTable(rows: RemainingShareRow[]): string {
  return `
    <h3 class="form-section-heading">Share of remaining pot at each payout</h3>
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
    <p class="footnote">
      Not a flat 1/k split. Shares are sized so each child gets the same real dollars at age
      ${TARGET_AGE}; later children usually take a larger fraction of whatever is left then.
    </p>
  `
}

function renderPayoutTable(children: ChildPayout[]): string {
  return `
    <h3 class="form-section-heading">Payouts at age ${TARGET_AGE}</h3>
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
      One communal pot grows from the year-0 seed. At each maturity the withdrawal is the
      equal real amount inflated to that year. Payout shows nominal (real in year-0 dollars).
      Pot after the last child is zero.
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
        ${renderSummary(result)}
      </section>
      <section class="result-group result-group--assumptions">
        <h3 class="result-group-heading">Assumptions</h3>
        ${renderAssumptions(inputs, result)}
      </section>
    </div>
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
  const storageKey = 'lump-sum-share-calculator:inputs'

  const save = () => {
    const inputs = readInputs()
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          spacingMonths: inputs.spacingMonths,
          lumpSumAtYear0: inputs.lumpSumAtYear0.toString(),
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
        lumpSumAtYear0?: string
        cpiRate?: string
        marketRate?: string
      }
      const setField = (name: string, value: string) => {
        const el = form.elements.namedItem(name)
        if (el instanceof HTMLInputElement) el.value = value
      }
      if (vals.lumpSumAtYear0 != null) setField('lumpSumAtYear0', vals.lumpSumAtYear0)
      if (vals.cpiRate != null) setField('cpiRate', vals.cpiRate)
      if (vals.marketRate != null) setField('marketRate', vals.marketRate)
    }
  } catch {
    /* ignore */
  }

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  childrenContainer.addEventListener('input', render)
  childrenContainer.addEventListener('change', render)
  render()
  return render
}
