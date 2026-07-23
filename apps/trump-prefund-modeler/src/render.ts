import {
  type CalculatorInputs,
  type CalculatorResult,
  type ChildSummary,
  type FundingYearRow,
} from './calculator'
import { formatCurrency, formatNominalReal, formatPct } from './shared/money'

function renderPrefundSummary(inputs: CalculatorInputs, result: CalculatorResult): string {
  const childWord = inputs.childCount === 1 ? 'child' : 'children'
  return `
    <p class="prefund-summary">
      Deposit <strong>${formatNominalReal(result.requiredPrefund, result.requiredPrefundReal)}</strong>
      at model year 0 to prefund Trump contributions for
      <strong>${inputs.childCount} ${childWord}</strong>
      (first birth year ${inputs.yearsBeforeFirstBirth}, spacing ${inputs.childSpacingYears} yr).
      One child alone needs ${formatCurrency(result.standaloneSingleChildPrefund)} at birth.
      Total contributions paid: ${formatCurrency(result.totalContributionsAllChildren)} nominal
      through model year ${result.lastModelYear}.
    </p>
  `
}

function renderInputsSummary(inputs: CalculatorInputs): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Children</dt><dd>${inputs.childCount}</dd></div>
      <div><dt>Spacing</dt><dd>${inputs.childSpacingYears} yr</dd></div>
      <div><dt>First birth</dt><dd>Year ${inputs.yearsBeforeFirstBirth}</dd></div>
      <div><dt>Contributions</dt><dd>${inputs.contributionInflationIndexed ? 'CPI-indexed max $5k/yr × 18' : 'Fixed $5k/yr × 18'}</dd></div>
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
            <th scope="col">Birth year</th>
            <th scope="col">Prefund at year 0</th>
            <th scope="col">If funded at birth alone</th>
          </tr>
        </thead>
        <tbody>
          ${children
            .map(
              (child) => `
            <tr>
              <th scope="row">${child.childNumber}</th>
              <td>${child.birthYear}</td>
              <td>${formatCurrency(child.prefundPresentValue)}</td>
              <td>${formatCurrency(child.standalonePrefundAtBirth)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Prefund at year 0 is this child's share of the single year-0 deposit (sums to the total
      above). If funded at birth alone shows what you'd need if you waited until that child's
      birth instead of prefunding everything at year 0.
    </p>
  `
}

function renderFundingTable(rows: FundingYearRow[]): string {
  return `
    <h3 class="form-section-heading">Funding account by model year</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Withdrawal</th>
            <th scope="col">Active children</th>
            <th scope="col">End balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.modelYear}</th>
              <td>${row.withdrawal > 0 ? formatNominalReal(row.withdrawal, row.withdrawalReal) : '—'}</td>
              <td>${row.activeChildren}</td>
              <td>${formatNominalReal(row.fundingBalance, row.fundingBalanceReal)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Year 0 starts with the required prefund deposit. Each year withdraws all active children's
      Trump contributions, then the remainder grows at the market rate. End balance should reach
      near zero after the last child's final contribution year. Values show nominal (real in
      year-0 dollars).
    </p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    ${renderPrefundSummary(inputs, result)}
    ${renderInputsSummary(inputs)}
    ${renderChildTable(result.children)}
    ${renderFundingTable(result.fundingRows)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'trump-prefund-modeler:inputs'

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      for (const [k, v] of Object.entries(vals)) {
        const el = form.elements.namedItem(k)
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox') {
            el.checked = v === 'on' || v === 'true'
          } else {
            el.value = String(v)
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  const save = () => {
    const data: Record<string, string> = {}
    for (const el of form.elements) {
      if (el instanceof HTMLInputElement && el.name) {
        data[el.name] = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value
      }
    }
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

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
