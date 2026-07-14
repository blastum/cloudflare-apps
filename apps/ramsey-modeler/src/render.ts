import { SAMPLE_TRIAL_COUNT } from './constants'
import { formatCurrency } from './shared/money'
import {
  type CalculatorInputs,
  type CalculatorResult,
  type TrialResult,
} from './calculator'

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${months} mo`
  if (rem === 0) return `${years} yr`
  return `${years} yr ${rem} mo`
}

function winnerLabel(winner: TrialResult['winner']): string {
  if (winner === 'snowball') return 'Snowball'
  if (winner === 'avalanche') return 'Avalanche'
  return 'Tie'
}

function winnerClass(winner: TrialResult['winner']): string {
  if (winner === 'snowball') return 'winner-snowball'
  if (winner === 'avalanche') return 'winner-avalanche'
  return ''
}

function renderError(message: string): string {
  return `<div class="error-banner" role="alert">${message}</div>`
}

function renderTrialTable(trials: TrialResult[]): string {
  const sample = trials.slice(0, SAMPLE_TRIAL_COUNT)
  return `
    <h3 class="form-section-heading">Sample trials</h3>
    <div class="table-wrap">
      <table class="projection-table">
        <thead>
          <tr>
            <th scope="col">Trial</th>
            <th scope="col">Debts</th>
            <th scope="col">Rate range</th>
            <th scope="col">Snowball</th>
            <th scope="col">Avalanche</th>
            <th scope="col">Winner</th>
            <th scope="col">Δ months</th>
          </tr>
        </thead>
        <tbody>
          ${sample
            .map(
              (trial, index) => `
            <tr>
              <th scope="row">${index + 1}</th>
              <td>${trial.debtCount}</td>
              <td>${formatPct(trial.minRate)} – ${formatPct(trial.maxRate)}</td>
              <td>${formatMonths(trial.snowballMonths)}</td>
              <td>${formatMonths(trial.avalancheMonths)}</td>
              <td class="${winnerClass(trial.winner)}">${winnerLabel(trial.winner)}</td>
              <td>${trial.monthDiff > 0 ? '+' : ''}${trial.monthDiff}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Δ months is avalanche minus snowball (negative means snowball finished sooner). First
      ${SAMPLE_TRIAL_COUNT} of ${trials.length} trials shown.
    </p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  if (!result.ok) {
    container.innerHTML = renderError(result.error)
    return
  }

  const mc = result.monteCarlo
  const advantage = mc.avgMonthAdvantage
  const faster =
    advantage > 0.05
      ? 'Avalanche'
      : advantage < -0.05
        ? 'Snowball'
        : 'Neither strategy'
  const advantageText =
    Math.abs(advantage) < 0.05
      ? 'Strategies finish in about the same time on average.'
      : `${faster} finishes ${Math.abs(advantage).toFixed(1)} months sooner on average.`

  const interestText =
    mc.avgInterestSavings > 0
      ? `Avalanche saves ${formatCurrency(mc.avgInterestSavings)} in interest on average.`
      : mc.avgInterestSavings < 0
        ? `Snowball saves ${formatCurrency(Math.abs(mc.avgInterestSavings))} in interest on average.`
        : 'Both strategies pay about the same interest on average.'

  container.innerHTML = `
    <p class="win-tally">
      <span class="snowball">Snowball ${mc.snowballWins}</span>
      · <span class="avalanche">Avalanche ${mc.avalancheWins}</span>
      · Ties ${mc.ties}
      <span style="font-weight:400;color:var(--text-muted)"> (of ${inputs.trials})</span>
    </p>

    <dl class="projection-inputs">
      <div><dt>Total debt</dt><dd>${formatCurrency(inputs.totalDebt)}</dd></div>
      <div><dt>Monthly budget</dt><dd>${formatCurrency(inputs.monthlyBudget)}</dd></div>
      <div><dt>Min payment rule</dt><dd>max($25, ${inputs.minPaymentPercent}% of balance)</dd></div>
      <div><dt>APR range</dt><dd>${inputs.minApr}% – ${inputs.maxApr}%</dd></div>
      <div><dt>Avg snowball payoff</dt><dd>${formatMonths(Math.round(mc.avgSnowballMonths))}</dd></div>
      <div><dt>Avg avalanche payoff</dt><dd>${formatMonths(Math.round(mc.avgAvalancheMonths))}</dd></div>
    </dl>

    <p class="footnote">${advantageText} ${interestText}</p>

    ${renderTrialTable(mc.trialResults)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'ramsey-modeler:inputs'
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const vals = JSON.parse(saved) as Record<string, string>
      for (const [k, v] of Object.entries(vals)) {
        const el = form.elements.namedItem(k)
        if (el instanceof HTMLInputElement) el.value = String(v)
      }
    }
  } catch {
    /* ignore */
  }

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
    const inputs = readInputs()
    renderResults(results, inputs, calculate(inputs))
    save()
  }

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
