import {
  type CalculatorInputs,
  type CalculatorResult,
  type ChildSummary,
} from './calculator'
import { TARGET_AGE } from './constants'
import {
  formatCurrency,
  formatNominalReal,
  formatPct,
  formatSharePct,
  formatYears,
} from './shared/money'

function renderSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  const childWord = result.childCount === 1 ? 'child' : 'children'
  return `
    <p class="prefund-summary">
      Fund <strong>${formatCurrency(result.totalDepositAtYear0)}</strong> at year 0
      (first birth) for <strong>${result.childCount} ${childWord}</strong>.
      When the last child is born (year <strong>${formatYears(result.lastBirthYear)}</strong>),
      the combined pot is <strong>${formatNominalReal(result.totalPotAtSnapshot, result.totalPotAtSnapshotReal)}</strong>.
      Each child reaches <strong>${formatCurrency(inputs.targetRealAtAge21)} real</strong> at age ${TARGET_AGE}.
    </p>
  `
}

function renderAssumptions(inputs: CalculatorInputs): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${inputs.spacingMonths.length}</dd></div>
      <div><dt>Last birth year</dt><dd>${formatYears(
        inputs.spacingMonths.length > 0
          ? calculateLastBirth(inputs.spacingMonths)
          : 0,
      )}</dd></div>
      <div><dt>Target at age ${TARGET_AGE}</dt><dd>${formatCurrency(inputs.targetRealAtAge21)} real</dd></div>
      <div><dt>Market growth</dt><dd>${formatPct(inputs.marketRate)}/yr</dd></div>
      <div><dt>Average CPI</dt><dd>${formatPct(inputs.cpiRate)}/yr</dd></div>
    </dl>
  `
}

function calculateLastBirth(spacingMonths: number[]): number {
  let cumulative = 0
  for (let i = 1; i < spacingMonths.length; i++) {
    cumulative += Math.max(0, spacingMonths[i]!) / 12
  }
  return cumulative
}

function renderChildTable(children: ChildSummary[], lastBirthYear: number): string {
  return `
    <h3 class="form-section-heading">Pot share when last child is born (year ${formatYears(lastBirthYear)})</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Child</th>
            <th scope="col">Birth year</th>
            <th scope="col">Year-0 deposit</th>
            <th scope="col">Pot value at snapshot</th>
            <th scope="col">Share</th>
            <th scope="col">Balance at age ${TARGET_AGE}</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${formatYears(child.birthYear)}</td>
              <td>${formatCurrency(child.depositAtYear0)}</td>
              <td>${formatCurrency(child.potValueAtSnapshot)}</td>
              <td>${formatSharePct(child.potSharePercent)}</td>
              <td>${formatNominalReal(child.balanceAt21Nominal, child.balanceAt21Real)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>—</td>
            <td>${formatCurrency(children.reduce((a, c) => a + c.depositAtYear0, 0))}</td>
            <td>${formatCurrency(children.reduce((a, c) => a + c.potValueAtSnapshot, 0))}</td>
            <td>100.0%</td>
            <td>—</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <p class="footnote">
      Year 0 is the first child's birth. Each child gets a slice of the year-0 lump sum that
      grows untouched to the same real target at age ${TARGET_AGE}. Shares are shown when the
      youngest child is born; percentages match year-0 allocation because all slices grow at
      the same rate. Balance shows nominal (real in year-0 dollars).
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
        ${renderAssumptions(inputs)}
      </section>
    </div>
    <section class="result-group">
      ${renderChildTable(result.children, result.lastBirthYear)}
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
          targetRealAtAge21: inputs.targetRealAtAge21,
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
        targetRealAtAge21?: string
        cpiRate?: string
        marketRate?: string
      }
      const setField = (name: string, value: string) => {
        const el = form.elements.namedItem(name)
        if (el instanceof HTMLInputElement) el.value = value
      }
      if (vals.targetRealAtAge21 != null) {
        setField('targetRealAtAge21', vals.targetRealAtAge21)
      }
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
