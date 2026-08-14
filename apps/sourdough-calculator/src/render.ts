import {
  type CalculatorInputs,
  type CalculatorResult,
  calculate,
} from './calculator'
import { formatGrams, formatPct } from './format'
import { renderRecipePrint } from './recipe'

function row(label: string, value: string, hint?: string): string {
  return `
    <div class="result-row">
      <dt>${label}${hint ? `<span class="result-hint">${hint}</span>` : ''}</dt>
      <dd>${value}</dd>
    </div>
  `
}

function renderScreenResults(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  return `
    <dl class="projection-inputs">
      <div><dt>Total flour</dt><dd>${formatGrams(inputs.totalFlourG)}</dd></div>
      <div><dt>Hydration</dt><dd>${formatPct(inputs.hydration)}</dd></div>
      <div><dt>Salt</dt><dd>${formatPct(inputs.salt)}</dd></div>
      <div><dt>Levain</dt><dd>${formatPct(inputs.levain)}</dd></div>
    </dl>

    <h3 class="form-section-heading">Totals</h3>
    <dl class="result-list">
      ${row('Total water', formatGrams(result.totalWaterG), 'hydration × flour')}
      ${row('Total leaven', formatGrams(result.totalLeavenG), 'flour × levain% × 2')}
    </dl>

    <h3 class="form-section-heading">Levain build</h3>
    <p class="matrix-caption">
      100% hydrated preferment. Starter is 10% of total leaven (extra for the build).
    </p>
    <dl class="result-list">
      ${row('Leaven flour', formatGrams(result.leavenFlourG))}
      ${row('Leaven water', formatGrams(result.leavenWaterG))}
      ${row('Starter', formatGrams(result.starterG))}
    </dl>

    <h3 class="form-section-heading">Final dough mix</h3>
    <p class="matrix-caption">
      Add these to the ripe leaven. Flour and water already account for what the
      leaven contributes.
    </p>
    <dl class="result-list result-list--emphasis">
      ${row('Dough flour', formatGrams(result.doughFlourG))}
      ${row('Dough water', formatGrams(result.doughWaterG))}
      ${row('Dough salt', formatGrams(result.doughSaltG))}
    </dl>
  `
}

function renderPrintSummary(
  inputs: CalculatorInputs,
  result: CalculatorResult,
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <article class="print-summary-card">
      <header class="print-summary-card__header">
        <h2 class="print-summary-card__title">Sourdough — calculated weights</h2>
        <p class="print-summary-card__date">${date}</p>
      </header>

      <section class="print-summary-card__section">
        <h3 class="print-summary-card__heading">Parameters</h3>
        <dl class="print-summary-card__grid print-summary-card__grid--params">
          <div><dt>Total flour</dt><dd>${formatGrams(inputs.totalFlourG)}</dd></div>
          <div><dt>Hydration</dt><dd>${formatPct(inputs.hydration)}</dd></div>
          <div><dt>Salt</dt><dd>${formatPct(inputs.salt)}</dd></div>
          <div><dt>Levain</dt><dd>${formatPct(inputs.levain)}</dd></div>
        </dl>
      </section>

      <section class="print-summary-card__section">
        <h3 class="print-summary-card__heading">Levain build</h3>
        <dl class="print-summary-card__grid">
          <div><dt>Bread flour</dt><dd>${formatGrams(result.leavenFlourG)}</dd></div>
          <div><dt>Water</dt><dd>${formatGrams(result.leavenWaterG)}</dd></div>
          <div><dt>Starter</dt><dd>${formatGrams(result.starterG)}</dd></div>
        </dl>
      </section>

      <section class="print-summary-card__section">
        <h3 class="print-summary-card__heading">Bread</h3>
        <dl class="print-summary-card__grid">
          <div><dt>Bread flour</dt><dd>${formatGrams(result.doughFlourG)}</dd></div>
          <div><dt>Water</dt><dd>${formatGrams(result.doughWaterG)}</dd></div>
          <div><dt>Salt</dt><dd>${formatGrams(result.doughSaltG)}</dd></div>
          <div><dt>Levain</dt><dd>${formatGrams(result.totalLeavenG)}</dd></div>
        </dl>
      </section>
    </article>
  `
}

function renderExportToolbar(): string {
  return `
    <div class="export-toolbar no-print">
      <button type="button" class="btn-export" data-print-recipe>Print</button>
      <span class="export-hint">
        Summary weights plus full recipe card — opens your browser print dialog.
      </span>
    </div>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  const invalid =
    inputs.totalFlourG <= 0 ||
    inputs.hydration < 0 ||
    inputs.salt < 0 ||
    inputs.levain < 0 ||
    result.doughFlourG < 0 ||
    result.doughWaterG < 0

  if (invalid) {
    container.innerHTML = `
      <p class="error-banner" role="alert">
        Check inputs — flour must be positive, and hydration / levain must leave
        enough flour and water for the final dough.
      </p>
    `
    return
  }

  container.innerHTML = `
    ${renderExportToolbar()}
    <div class="screen-results no-print">
      ${renderScreenResults(inputs, result)}
    </div>
    <div class="print-only-body">
      ${renderPrintSummary(inputs, result)}
      ${renderRecipePrint(result)}
    </div>
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'sourdough-calculator:inputs'
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

  results.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-print-recipe]')) {
      window.print()
    }
  })

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
