import {
  type CalculatorInputs,
  type CalculatorResult,
  type ContributionGrowthRow,
  type MilestoneFactor,
  type YearFactor,
} from './calculator'
import {
  formatMultipleLong,
  formatPctRate,
  formatReturnLong,
} from './format'

function realReturnPct(realFactor: number): number {
  return (realFactor - 1) * 100
}

function renderMilestoneTable(milestones: MilestoneFactor[]): string {
  return `
    <div class="table-wrap table-wrap--compact">
      <table class="projection-table milestone-table">
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Years</th>
            <th scope="col">Real return</th>
            <th scope="col">Real multiple</th>
          </tr>
        </thead>
        <tbody>
          ${milestones
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.age}</th>
              <td>${row.age}</td>
              <td>${formatReturnLong(row.realFactor)}</td>
              <td>${formatMultipleLong(row.realFactor)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      $1 contributed at birth, valued at each age in today&apos;s dollars. Return is total real
      growth above principal; multiple is ending real value per dollar contributed.
    </p>
  `
}

function renderContributionTable(
  rows: ContributionGrowthRow[],
  realAnnualFactor: number,
): string {
  return `
    <h3 class="form-section-heading">Contribution years (0–18)</h3>
    <p class="matrix-caption">
      Real growth to age ${67} using ${realAnnualFactor.toFixed(3)}× per year
      (market ÷ inflation), raised to remaining years.
    </p>
    <div class="table-wrap table-wrap--compact">
      <table class="projection-table contribution-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Remaining to 67</th>
            <th scope="col">Real return</th>
            <th scope="col">Real multiple</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.year}</th>
              <td>${row.remainingYears}</td>
              <td>${formatReturnLong(row.realFactor)}</td>
              <td>${formatMultipleLong(row.realFactor)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      $1 contributed in contribution year n grows ${realAnnualFactor.toFixed(3)} raised to
      ${67}−n for the real multiple at age ${67}. Year 0 is the first contribution year.
    </p>
  `
}

function niceLinearTicks(max: number, count: number): number[] {
  if (max <= 0) return [0]
  const roughStep = max / Math.max(count - 1, 1)
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  let step = magnitude
  if (normalized <= 1) step = magnitude
  else if (normalized <= 2) step = 2 * magnitude
  else if (normalized <= 5) step = 5 * magnitude
  else step = 10 * magnitude

  const ticks: number[] = [0]
  for (let value = step; value < max; value += step) {
    ticks.push(value)
  }
  if (ticks[ticks.length - 1] !== max) {
    ticks.push(max)
  }
  return ticks
}

function formatAxisReturnPct(pct: number): string {
  if (pct === 0) return '0%'
  if (pct < 1000) return `${Math.round(pct)}%`
  return `${Math.round(pct / 1000)}k%`
}

function chartPath(
  series: YearFactor[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
): {
  realPath: string
  milestoneLines: string
  yTicks: string
  xTicks: string
} {
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const maxYears = series[series.length - 1]?.years ?? 1

  const returns = series.map((point) => realReturnPct(point.realFactor))
  const yMax = Math.max(...returns, 1)

  const xScale = (years: number) => padding.left + (years / maxYears) * plotW
  const yScale = (returnPct: number) =>
    padding.top + plotH - (returnPct / yMax) * plotH

  const realPath = series
    .map((point, index) => {
      const cmd = index === 0 ? 'M' : 'L'
      const x = xScale(point.years)
      const y = yScale(realReturnPct(point.realFactor))
      return `${cmd}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const milestoneAges = [18, 21, 25, 55, 60, 65, 67]
  const milestoneLines = milestoneAges
    .map((age) => {
      const x = xScale(age)
      const point = series[age]
      const dot =
        point !== undefined
          ? `<circle class="chart-dot" cx="${x.toFixed(1)}" cy="${yScale(realReturnPct(point.realFactor)).toFixed(1)}" r="3.5" />`
          : ''
      return `
        <line class="chart-milestone" x1="${x}" y1="${padding.top}" x2="${x}" y2="${padding.top + plotH}" />
        <text class="chart-milestone-label" x="${x}" y="${padding.top + plotH + 14}" text-anchor="middle">${age}</text>
        ${dot}
      `
    })
    .join('')

  const yTickValues = niceLinearTicks(yMax, 5)
  const yTicks = yTickValues
    .map((value) => {
      const y = yScale(value)
      return `
        <line class="chart-grid" x1="${padding.left}" y1="${y}" x2="${padding.left + plotW}" y2="${y}" />
        <text class="chart-axis-label" x="${padding.left - 6}" y="${y + 4}" text-anchor="end">${formatAxisReturnPct(value)}</text>
      `
    })
    .join('')

  const xTickYears = [0, 10, 18, 25, 40, 55, 67]
  const xTicks = xTickYears
    .filter((years) => years <= maxYears)
    .map((years) => {
      const x = xScale(years)
      return `<text class="chart-axis-label" x="${x}" y="${padding.top + plotH + 28}" text-anchor="middle">${years}</text>`
    })
    .join('')

  return { realPath, milestoneLines, yTicks, xTicks }
}

function renderChart(series: YearFactor[]): string {
  const width = 720
  const height = 280
  const padding = { top: 16, right: 16, bottom: 44, left: 52 }
  const paths = chartPath(series, width, height, padding)

  return `
    <h3 class="form-section-heading">Real return curve</h3>
    <div class="chart-wrap">
      <svg class="growth-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Real total return on one dollar from birth over up to 67 years">
        ${paths.yTicks}
        <rect class="chart-plot-bg" x="${padding.left}" y="${padding.top}" width="${width - padding.left - padding.right}" height="${height - padding.top - padding.bottom}" />
        ${paths.milestoneLines}
        <path class="chart-line chart-line--real" d="${paths.realPath}" />
        ${paths.xTicks}
        <text class="chart-axis-title" x="${width / 2}" y="${height - 4}" text-anchor="middle">Years compounded</text>
        <text class="chart-axis-title chart-axis-title--y" x="12" y="${padding.top + (height - padding.top - padding.bottom) / 2}" text-anchor="middle" transform="rotate(-90 12 ${padding.top + (height - padding.top - padding.bottom) / 2})">Real return</text>
      </svg>
    </div>
    <p class="footnote">Linear axes. Vertical ticks mark milestone ages; dots are values at those ages.</p>
  `
}

export function renderResults(
  container: HTMLElement,
  inputs: CalculatorInputs,
  result: CalculatorResult,
): void {
  container.innerHTML = `
    <dl class="projection-inputs">
      <div><dt>Market growth</dt><dd>${formatPctRate(inputs.marketRate)}/yr</dd></div>
      <div><dt>Inflation (CPI)</dt><dd>${formatPctRate(inputs.cpiRate)}/yr</dd></div>
      <div><dt>Real return (approx.)</dt><dd>${formatPctRate((1 + inputs.marketRate) / (1 + inputs.cpiRate) - 1)}/yr</dd></div>
      <div><dt>Real annual factor</dt><dd>${result.realAnnualFactor.toFixed(3)}×</dd></div>
    </dl>
    ${renderChart(result.yearSeries)}
    <h3 class="form-section-heading">Milestone ages</h3>
    ${renderMilestoneTable(result.milestones)}
    ${renderContributionTable(result.contributionGrowth, result.realAnnualFactor)}
  `
}

export function mountCalculator(
  form: HTMLFormElement,
  results: HTMLElement,
  calculate: (inputs: CalculatorInputs) => CalculatorResult,
  readInputs: () => CalculatorInputs,
): void {
  const storageKey = 'growth-factor-table:inputs'
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

  form.addEventListener('input', render)
  form.addEventListener('change', render)
  render()
}
